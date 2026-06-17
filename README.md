# env-scan

> A small CLI tool to catch leaked secrets, missing env vars, and .env drift.

<p align="center">
  <img src="https://img.shields.io/badge/node-%3E%3D18-brightgreen" alt="Node >= 18">
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="License MIT">
  <img src="https://img.shields.io/badge/dependencies-3-lightgrey" alt="Dependencies">
</p>

---

## What it does

Scans your project for common .env problems:

- Secrets accidentally committed to git
- API keys hardcoded in source files
- Variables in .env.example missing from .env (or vice versa)
- Variables defined but never used

---

## Quick Start

```bash
npx env-scan                        # Run in any project directory
npm install -g env-scan              # Or install globally
env-scan
```

No config file. No setup. Just run it.

---

## Example Output

```
env-scan v1.0.0
   Scanned 47 files (3 env, 44 source)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  CRITICAL (2)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  [git-exposure] .env is tracked by git
  └─ .env
     Run: git rm --cached .env && echo ".env" >> .gitignore

  [secret-leak] Stripe Live Key exposed: sk_l...o345
  └─ src/payment.ts:23
     Use Stripe test keys for development. Rotate this live key now.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  HIGH (3)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  [secret-leak] GitHub Personal Access Token exposed
  └─ src/config.ts:15
     Revoke at github.com/settings/tokens.

  [secret-leak] OpenAI API Key exposed: sk-...b1f4
  └─ src/ai.ts:42
     Rotate at platform.openai.com/api-keys.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  MEDIUM (2)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  [missing-vars] SECRET_KEY is in .env.example but missing from .env
  [missing-vars] REDIS_URL is in .env.example but missing from .env

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Summary: 2 critical · 3 high · 2 medium · 0 low
```

---

## 5 Security Checks

| Check | Flag | Severity | What It Finds |
|-------|------|----------|---------------|
| **Secret Leak** | `--secrets` | Critical | Hardcoded API keys, tokens, passwords in source |
| **Git Exposure** | `--git-exposed` | Critical | .env files tracked by version control |
| **Missing Vars** | `--missing` | Medium | Keys in .env.example missing from .env |
| **Env Drift** | `--drift` | Medium | Structural differences between .env and .env.example |
| **Unused Vars** | `--unused` | Low | Variables defined but never referenced in code |

---

## Secret Detection — 3 Layers

### Layer 1: Known Patterns

30+ service signatures with exact regex matching:

| Service | Pattern |
|---------|---------|
| AWS | `AKIA...` |
| Stripe | `sk_live_...` |
| GitHub | `ghp_...`, `github_pat_...` |
| OpenAI | `sk-...` |
| Anthropic | `sk-ant-...` |
| GitLab | `glpat-...` |
| Slack | `xoxb-...` |
| Twilio | `SK...` |
| MongoDB | `mongodb://user:pass@...` |
| PostgreSQL | `postgres://user:pass@...` |
| HuggingFace | `hf_...` |
| SendGrid | `SG....` |

And 20+ more (Google Cloud, Azure, Discord, Telegram, NPM, JWT, private keys, etc.)

### Layer 2: Keyword Heuristics

Catches anything named `SECRET`, `TOKEN`, `PASSWORD`, `API_KEY`, `CREDENTIAL`, etc.

### Layer 3: Shannon Entropy

Detects random-looking strings (entropy > 4.5) that don't match known formats — catches custom tokens and keys. Includes false-positive filtering: automatically skips URLs, file paths, natural language text, UUIDs, and hashes.

---

## CLI Reference

```bash
env-scan [directory]                 # Scan directory (default: current)
env-scan --secrets                   # Only check for hardcoded secrets
env-scan --git-exposed               # Only check git tracking
env-scan --missing                   # Only check missing vars
env-scan --unused                    # Only check unused vars
env-scan --drift                     # Only check .env/.env.example drift
env-scan --format json               # JSON output (for CI/CD)
env-scan --format markdown           # Markdown report
env-scan --severity high             # Only show high severity and above
env-scan --no-ignore                 # Don't respect .gitignore
env-scan --install-hook              # Install git pre-commit hook
env-scan --uninstall-hook            # Remove git pre-commit hook
env-scan --strict                    # Treat all issues as blocking
```

---

## Git Pre-Commit Hook

Block commits that leak secrets:

```bash
npx env-scan --install-hook          # Install
git commit -m "update"               # env-scan runs automatically
SKIP_ENVGUARD=1 git commit -m "..."  # Skip if needed
npx env-scan --install-hook --strict # Strict mode
```

The hook runs `env-scan --format json` before each commit and blocks if critical/high issues are found.

---

## CI/CD Integration

```yaml
# .github/workflows/env-scan.yml
name: env-scan
on: [push, pull_request]
jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npx env-scan --format json --severity high
```

JSON output works well for CI pipelines — parse it, send alerts, block merges, etc.

---

## Installation

```bash
npx env-scan                        # One-off (no install needed)
npm install -g env-scan              # Global install
npm install --save-dev env-scan       # Local dev dependency
```

**Requirements:** Node.js >= 18. Only 3 dependencies. Package size < 100KB.

---

## Development

```bash
git clone https://github.com/your-username/env-scan.git
cd env-scan
npm install
npm run build                       # Compile TypeScript
node dist/index.js                  # Run from source
```

---

## License

MIT

---

<p align="center">
  Hope it helps keep your secrets safe.<br>
</p>



