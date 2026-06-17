#!/usr/bin/env bash
# sync-check.sh — alignement Mac ↔ GitHub + audit sécurité complet
# (projet déployé sur Vercel via auto-deploy GitHub → GitHub = source de vérité)
# Exit: 0 = SAFE, 1 = warnings, 2 = BLOCKING (fuite de secret)

set -uo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_DIR" || { echo "ERR: repo dir introuvable"; exit 1; }

ok=0; warn=0; block=0
print_ok()    { echo "✅ $1"; ok=$((ok+1)); }
print_warn()  { echo "⚠️  $1"; warn=$((warn+1)); }
print_block() { echo "🚨 $1"; block=$((block+1)); }

echo "════════ SÉCURITÉ ════════"

# .env tracké par git = danger max
bad=$(git ls-files 2>/dev/null | grep -E '^\.env($|\..*)' | grep -vE '\.env\.(example|sample|template)$' | head -3)
if [[ -n "$bad" ]]; then
  print_block ".env TRACKÉ par git — secrets exposés:"
  echo "$bad" | sed 's/^/   /'
  echo "   Fix: git rm --cached $bad && git commit -m 'security: untrack .env'"
else
  print_ok "Aucun .env tracké par git"
fi

# .env local présent → doit être gitignored
if [[ -f .env ]]; then
  git check-ignore -q .env 2>/dev/null \
    && print_ok ".env local présent et gitignored" \
    || { print_block ".env existe mais PAS gitignored"; echo "   Fix: echo '.env' >> .gitignore"; }
fi

# .gitignore essentiels
if [[ -f .gitignore ]]; then
  missing=()
  for p in '\.env' '\*\.key' '\*\.pem' 'node_modules' 'dist'; do
    grep -qE "^${p}/?$" .gitignore 2>/dev/null || missing+=("$p")
  done
  [[ ${#missing[@]} -eq 0 ]] && print_ok ".gitignore complet" || print_warn ".gitignore — manque: ${missing[*]}"
else
  print_block "Pas de .gitignore"
fi

# Scan secrets dans les fichiers tracked (clés API / privées / RPC à clé)
SECRET_REGEX='sk-ant-[a-zA-Z0-9_-]{30,}|sk-proj-[a-zA-Z0-9_-]{30,}|ghp_[a-zA-Z0-9]{36}|github_pat_[a-zA-Z0-9_]{50,}|AKIA[0-9A-Z]{16}|AIza[0-9A-Za-z_-]{35}|xoxb-[0-9]+-[0-9]+-[a-zA-Z0-9]+|helius-rpc\.com/\?api-key=[a-zA-Z0-9-]{20,}|api[._-]?key=[a-zA-Z0-9]{20,}|BEGIN (RSA|EC|OPENSSH|PGP) PRIVATE KEY|0x[a-fA-F0-9]{64}'
hits=""
while IFS= read -r f; do
  [[ -f "$f" ]] || continue
  grep -lE "$SECRET_REGEX" "$f" 2>/dev/null && hits+="$f"$'\n'
done < <(git ls-files 2>/dev/null | grep -vE '\.(example|sample|template|lock|min\.js|map|png|jpg|jpeg|svg|ico|woff2?|ttf)$')
if [[ -z "${hits//[[:space:]]/}" ]]; then
  print_ok "Aucun secret / clé API détecté dans les fichiers GitHub"
else
  print_block "SECRETS détectés dans:"; echo "$hits" | sed 's/^/   /'
fi

echo ""
echo "════════ SYNC Mac ↔ GitHub ════════"
git fetch origin --quiet 2>/dev/null
branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo main)
ahead=$(git rev-list --count "origin/$branch..HEAD" 2>/dev/null || echo 0)
behind=$(git rev-list --count "HEAD..origin/$branch" 2>/dev/null || echo 0)
dirty=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')
if [[ "$dirty" != "0" ]]; then
  print_warn "Mac: $dirty fichier(s) non commité(s) — pas encore sur GitHub/Vercel"
elif [[ "$ahead" != "0" ]]; then
  print_warn "Mac en avance de $ahead commit(s) — 'git push' manquant (Vercel pas à jour)"
elif [[ "$behind" != "0" ]]; then
  print_warn "Mac en retard de $behind commit(s) — 'git pull' manquant"
else
  print_ok "Mac == GitHub ($branch @ $(git rev-parse --short HEAD)) → Vercel à jour"
fi

echo ""
if [[ $block -gt 0 ]]; then
  echo "🚨 BLOCKING — $block problème(s) critique(s). NE PAS push tel quel."
  exit 2
elif [[ $warn -gt 0 ]]; then
  echo "⚠️  $warn warning(s) — review conseillé ($ok checks OK)"
  exit 1
else
  echo "🛡️  SAFE — $ok checks validés. Mac = GitHub = Vercel, zéro fuite."
  exit 0
fi
