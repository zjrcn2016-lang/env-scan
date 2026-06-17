import { SecretPattern, Severity } from './types';

/**
 * 30+ known secret patterns for popular services.
 * Each pattern includes a name, regex, severity, and fix suggestion.
 */
export const SECRET_PATTERNS: SecretPattern[] = [
  // ── Cloud & Infrastructure ──────────────────────────
  {
    name: 'AWS Access Key',
    regex: /(?:A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}/g,
    severity: 'critical',
    suggestion: 'Use IAM roles or environment variables. Rotate this key immediately.',
  },
  {
    name: 'AWS Secret Key',
    regex: /(?:aws[_-]?secret|aws[_-]?secret[_-]?key)\s*[:=]\s*["']?[A-Za-z0-9\/+=]{40}["']?/gi,
    severity: 'critical',
    suggestion: 'Rotate this key immediately. Never store AWS secret keys in code.',
  },
  {
    name: 'Google Cloud API Key',
    regex: /AIza[0-9A-Za-z\-_]{35}/g,
    severity: 'critical',
    suggestion: 'Restrict this key in GCP Console. Consider using service accounts.',
  },
  {
    name: 'Google OAuth Client Secret',
    regex: /GOCSPX-[0-9A-Za-z\-_]{28}/g,
    severity: 'critical',
    suggestion: 'Rotate in GCP Console → APIs & Services → Credentials.',
  },
  {
    name: 'Azure Storage Key',
    regex: /(?:AccountKey|SharedAccessKey)\s*[:=]\s*["']?[A-Za-z0-9+\/=]{60,100}["']?/gi,
    severity: 'critical',
    suggestion: 'Use Azure Managed Identity instead of access keys.',
  },

  // ── Payments ─────────────────────────────────────────
  {
    name: 'Stripe Live Key',
    regex: /sk_live_[0-9a-zA-Z]{24,99}/g,
    severity: 'critical',
    suggestion: 'Use Stripe test keys for development. Rotate this live key now.',
  },
  {
    name: 'Stripe Restricted Key',
    regex: /rk_live_[0-9a-zA-Z]{24,99}/g,
    severity: 'critical',
    suggestion: 'Rotate in Stripe Dashboard. Use restricted keys with minimal permissions.',
  },
  {
    name: 'PayPal Client Secret',
    regex: /(?:paypal[_-]?secret|PAYPAL[_-]?SECRET)\s*[:=]\s*["']?E[A-Za-z0-9_-]{70,100}["']?/gi,
    severity: 'critical',
    suggestion: 'Rotate in PayPal Developer Dashboard.',
  },

  // ── GitHub / Git ─────────────────────────────────────
  {
    name: 'GitHub Personal Access Token',
    regex: /ghp_[0-9a-zA-Z]{36}/g,
    severity: 'critical',
    suggestion: 'Revoke at github.com/settings/tokens. Use fine-grained tokens.',
  },
  {
    name: 'GitHub OAuth Token',
    regex: /gho_[0-9a-zA-Z]{36}/g,
    severity: 'critical',
    suggestion: 'Revoke in GitHub OAuth Apps settings.',
  },
  {
    name: 'GitHub App Token',
    regex: /ghu_[0-9a-zA-Z]{36}/g,
    severity: 'critical',
    suggestion: 'Revoke in GitHub App settings.',
  },
  {
    name: 'GitHub PAT (new format)',
    regex: /github_pat_[0-9a-zA-Z_]{36,99}/g,
    severity: 'critical',
    suggestion: 'Revoke at github.com/settings/tokens.',
  },
  {
    name: 'GitLab PAT',
    regex: /glpat-[0-9a-zA-Z\-_]{20,99}/g,
    severity: 'critical',
    suggestion: 'Revoke at gitlab.com/-/profile/personal_access_tokens.',
  },

  // ── AI / LLM ─────────────────────────────────────────
  {
    name: 'OpenAI API Key',
    regex: /sk-[a-zA-Z0-9]{32,99}/g,
    severity: 'critical',
    suggestion: 'Rotate at platform.openai.com/api-keys. Set usage limits.',
  },
  {
    name: 'OpenAI Project Key',
    regex: /sk-proj-[a-zA-Z0-9_-]{32,99}/g,
    severity: 'critical',
    suggestion: 'Rotate at platform.openai.com. Use project-scoped keys.',
  },
  {
    name: 'Anthropic API Key',
    regex: /sk-ant-[a-zA-Z0-9_-]{32,99}/g,
    severity: 'critical',
    suggestion: 'Rotate at console.anthropic.com.',
  },
  {
    name: 'HuggingFace API Token',
    regex: /hf_[a-zA-Z0-9]{34}/g,
    severity: 'critical',
    suggestion: 'Rotate at huggingface.co/settings/tokens.',
  },
  {
    name: 'Cohere API Key',
    regex: /(?:COHERE[_-]?API[_-]?KEY|cohere[_-]?api[_-]?key)\s*[:=]\s*["']?[A-Za-z0-9]{32,64}["']?/gi,
    severity: 'critical',
    suggestion: 'Rotate at dashboard.cohere.com/api-keys.',
  },

  // ── Communication ────────────────────────────────────
  {
    name: 'Slack Bot Token',
    regex: /xox[baprs]-[0-9a-zA-Z\-]{10,99}/g,
    severity: 'critical',
    suggestion: 'Revoke at api.slack.com/apps. Use short-lived tokens.',
  },
  {
    name: 'Slack Webhook URL',
    regex: /https:\/\/hooks\.slack\.com\/services\/T[A-Z0-9]+\/B[A-Z0-9]+\/[A-Za-z0-9]+/g,
    severity: 'critical',
    suggestion: 'Revoke at slack.com/apps. Rotate webhook URLs.',
  },
  {
    name: 'Discord Bot Token',
    regex: /(?:DISCORD[_-]?TOKEN|discord[_-]?token)\s*[:=]\s*["']?[A-Za-z0-9_.-]{50,72}["']?/gi,
    severity: 'critical',
    suggestion: 'Regenerate at discord.com/developers/applications.',
  },
  {
    name: 'Telegram Bot Token',
    regex: /\d{8,10}:[A-Za-z0-9_-]{35}/g,
    severity: 'critical',
    suggestion: 'Revoke with @BotFather using /revoke command.',
  },
  {
    name: 'Twilio Auth Token',
    regex: /(?:TWILIO[_-]?AUTH|twilio[_-]?auth)\s*[:=]\s*["']?[0-9a-f]{32}["']?/gi,
    severity: 'critical',
    suggestion: 'Rotate at twilio.com/console.',
  },
  {
    name: 'SendGrid API Key',
    regex: /SG\.[A-Za-z0-9_-]{22,68}\.[A-Za-z0-9_-]{22,68}/g,
    severity: 'critical',
    suggestion: 'Rotate at app.sendgrid.com/settings/api_keys.',
  },

  // ── Database / Services ──────────────────────────────
  {
    name: 'MongoDB URI',
    regex: /mongodb(?:\+srv)?:\/\/[^:\s]+:[^@\s]+@[^\s]+/g,
    severity: 'critical',
    suggestion: 'Use environment variables for connection strings.',
  },
  {
    name: 'PostgreSQL URI',
    regex: /postgres(?:ql)?:\/\/[^:\s]+:[^@\s]+@[^\s]+/g,
    severity: 'critical',
    suggestion: 'Use environment variables for connection strings.',
  },
  {
    name: 'Redis URI with auth',
    regex: /redis:\/\/[^:\s]*:[^@\s]+@[^\s]+/g,
    severity: 'critical',
    suggestion: 'Use environment variables or Redis ACL.',
  },
  {
    name: 'Supabase Service Key',
    regex: /eyJ[A-Za-z0-9_-]{50,1000}\.[A-Za-z0-9_-]{20,500}\.[A-Za-z0-9_-]{20,500}/g,
    severity: 'critical',
    suggestion: 'This looks like a JWT service key. Rotate at supabase.com.',
  },

  // ── Misc ─────────────────────────────────────────────
  {
    name: 'Heroku API Key',
    regex: /(?:HEROKU[_-]?API[_-]?KEY|heroku[_-]?api[_-]?key)\s*[:=]\s*["']?[A-Za-z0-9_-]{32,48}["']?/gi,
    severity: 'critical',
    suggestion: 'Rotate at dashboard.heroku.com/account.',
  },
  {
    name: 'NPM Access Token',
    regex: /npm_[A-Za-z0-9]{36}/g,
    severity: 'critical',
    suggestion: 'Revoke at npmjs.com/settings/tokens.',
  },
  {
    name: 'JWT Token',
    regex: /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g,
    severity: 'high',
    suggestion: 'JWT tokens in source code may indicate leaked credentials.',
  },
  {
    name: 'Generic Private Key',
    regex: /-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/g,
    severity: 'critical',
    suggestion: 'Private keys should NEVER be in source code. Revoke immediately.',
  },
];

/**
 * Generic credential keyword patterns (Layer 2 heuristics).
 * Matches variable-like assignments with sensitive names.
 */
export const KEYWORD_PATTERNS: { name: string; regex: RegExp; severity: Severity; suggestion: string }[] = [
  {
    name: 'Generic API Key assignment',
    regex: /(?:api[_-]?key|apikey|API[_-]?KEY)\s*[:=]\s*["'][A-Za-z0-9_\-]{8,}["']/g,
    severity: 'high',
    suggestion: 'Move API keys to environment variables.',
  },
  {
    name: 'Generic Secret assignment',
    regex: /(?:secret|SECRET)\s*[:=]\s*["'][A-Za-z0-9_\-]{6,}["']/g,
    severity: 'high',
    suggestion: 'Move secrets to environment variables.',
  },
  {
    name: 'Generic Token assignment',
    regex: /(?:token|TOKEN|auth[_-]?token|AUTH[_-]?TOKEN)\s*[:=]\s*["'][A-Za-z0-9_\-.]{8,}["']/g,
    severity: 'high',
    suggestion: 'Move tokens to environment variables.',
  },
  {
    name: 'Password assignment',
    regex: /(?:password|passwd|pwd|PASSWORD)\s*[:=]\s*["'][^"'\s]{4,}["']/g,
    severity: 'high',
    suggestion: 'Never hardcode passwords. Use environment variables or a secrets manager.',
  },
  {
    name: 'Credential assignment',
    regex: /(?:credential|CREDENTIAL)\s*[:=]\s*["'][A-Za-z0-9_\-]{4,}["']/g,
    severity: 'high',
    suggestion: 'Move credentials to environment variables.',
  },
  {
    name: 'Bearer token',
    regex: /["']Bearer\s+[A-Za-z0-9_\-.]{20,}["']/g,
    severity: 'high',
    suggestion: 'Hardcoded bearer tokens should be stored in env vars.',
  },
];
