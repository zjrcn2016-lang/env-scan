# EnvGuard

> 一个小命令行工具，用来检查 .env 相关的常见问题：泄露的密钥、缺失的变量、配置漂移。

<p align="center">
  <img src="https://img.shields.io/badge/node-%3E%3D18-brightgreen" alt="Node >= 18">
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="License MIT">
  <img src="https://img.shields.io/badge/dependencies-3-lightgrey" alt="Dependencies">
</p>

---

## 它能做什么

扫描项目中 .env 相关的常见问题：

- 密钥被意外提交到 git
- API 密钥硬编码在源码里
- .env.example 里有但 .env 里漏了的变量（或反过来）
- 定义了但从来没被引用过的变量

---

## 快速开始

```bash
npx envguard                        # 在任意项目目录中运行
npm install -g envguard              # 或全局安装
envguard
```

无需配置文件，无需额外设置，直接运行即可。

---

## 运行效果

```
EnvGuard v1.0.0
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

## 5 项安全检查

| 检查项 | 参数 | 严重程度 | 检测内容 |
|-------|------|----------|---------------|
| **密钥泄露** | `--secrets` | Critical | 源码中的硬编码密钥、令牌、密码 |
| **Git 暴露** | `--git-exposed` | Critical | 被版本控制跟踪的 .env 文件 |
| **缺失变量** | `--missing` | Medium | .env.example 中有但 .env 中缺失的键 |
| **环境漂移** | `--drift` | Medium | .env 与 .env.example 的结构差异 |
| **未使用变量** | `--unused` | Low | 已定义但代码中从未引用的变量 |

---

## 密钥检测：3 层防护

### 第 1 层：已知模式

30+ 种服务签名的精确正则匹配：

| 服务 | 模式 |
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

以及 20+ 种更多服务（Google Cloud、Azure、Discord、Telegram、NPM、JWT、私钥等）

### 第 2 层：关键词启发式

捕获任何命名为 `SECRET`、`TOKEN`、`PASSWORD`、`API_KEY`、`CREDENTIAL` 等的变量。

### 第 3 层：香农熵检测

检测随机字符串（熵值 > 4.5），不匹配已知格式——捕获自定义令牌和密钥。内置误报过滤：自动跳过 URL、文件路径、自然语言文本、UUID/Hash。

---

## 命令行参考

```bash
envguard [directory]                 # 扫描目录（默认：当前目录）
envguard --secrets                   # 仅检查硬编码密钥
envguard --git-exposed               # 仅检查 git 跟踪
envguard --missing                   # 仅检查缺失变量
envguard --unused                    # 仅检查未使用变量
envguard --drift                     # 仅检查 .env/.env.example 漂移
envguard --format json               # JSON 输出（用于 CI/CD）
envguard --format markdown           # Markdown 报告
envguard --severity high             # 仅显示高危及以上
envguard --no-ignore                 # 不遵循 .gitignore 规则
envguard --install-hook              # 安装 git pre-commit 钩子
envguard --uninstall-hook            # 移除 git pre-commit 钩子
envguard --strict                    # 将所有问题视为阻断性
```

---

## Git Pre-Commit 钩子

阻止泄露密钥的提交：

```bash
npx envguard --install-hook          # 安装
git commit -m "update"               # EnvGuard 自动先扫描
SKIP_ENVGUARD=1 git commit -m "..."  # 跳过检查
npx envguard --install-hook --strict # 严格模式
```

该钩子在每次提交前运行 `envguard --format json`，如果发现严重/高危问题则阻止提交。

---

## CI/CD 集成

```yaml
# .github/workflows/envguard.yml
name: EnvGuard
on: [push, pull_request]
jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npx envguard --format json --severity high
```

JSON 输出可以接入 CI 流水线——解析结果、发告警、阻止合并等。

---

## 安装

```bash
npx envguard                        # 一次性使用（无需安装）
npm install -g envguard              # 全局安装
npm install --save-dev envguard       # 本地开发依赖
```

环境要求：Node.js >= 18。仅 3 个依赖项，包体积 < 100KB。

---

## 开发

```bash
git clone https://github.com/your-username/envguard.git
cd envguard
npm install
npm run build                       # 编译 TypeScript
node dist/index.js                  # 从源码运行
```

---

## License

MIT — 自由使用

---

<p align="center">
  希望能帮你的项目守住密钥安全。<br>
</p>
