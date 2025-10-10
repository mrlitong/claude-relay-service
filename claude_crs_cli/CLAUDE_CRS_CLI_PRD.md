# Claude Relay Service - CLI 版本产品需求文档

**文档版本**: v1.0
**创建时间**: 2025-10-10
**项目代号**: Claude CRS CLI Demo

---

## 项目范围和开发约束

### ⚠️ 重要约束

**所有开发工作必须严格限定在 `claude_crs_cli/` 目录内，不得修改其他任何目录的代码。**

#### 目录结构约定

```
claude-relay-service/          # 现有项目根目录
├── src/                       # 现有 Web 版本代码（禁止修改）
├── web/                       # 现有前端代码（禁止修改）
├── config/                    # 现有配置（禁止修改）
├── docs/                      # 文档目录
└── claude_crs_cli/            # ✅ CLI 项目目录（所有改动限定在此）
    ├── package.json           # 独立的依赖配置
    ├── cli.js                 # CLI 入口文件
    ├── lib/                   # CLI 核心逻辑
    │   ├── auth.js
    │   ├── chat.js
    │   ├── proxy.js
    │   ├── storage.js
    │   └── constants.js
    ├── data/                  # 本地数据存储
    │   └── auth.json
    ├── CLAUDE_CRS_CLI_PRD.md  # 本文档
    └── README.md              # CLI 使用说明
```

#### 代码复用策略

**允许的操作**：
- ✅ 从现有代码库**复制**代码到 `claude_crs_cli/lib/` 目录
- ✅ 参考以下现有模块的实现逻辑：
  - `src/utils/oauthHelper.js` - OAuth PKCE 流程实现
  - `src/utils/proxyHelper.js` - 代理 Agent 创建
  - `src/services/claudeAccountService.js` - Token 刷新机制
  - `src/services/claudeRelayService.js` - 流式响应处理
- ✅ 复制后根据 CLI 场景进行简化和调整

**禁止的操作**：
- ❌ 直接修改 `src/`、`web/`、`config/` 等现有目录的任何文件
- ❌ 通过 `require('../src/...')` 引用现有模块（会产生依赖耦合）
- ❌ 修改现有的 `package.json`、`.env` 等配置文件

#### 独立性原则

Claude CRS CLI 是一个**完全独立的项目**：

1. **独立的依赖管理**：使用自己的 `package.json`，不依赖现有项目的 `node_modules`
2. **独立的配置**：使用本地 JSON 文件存储，不依赖 Redis 或现有配置
3. **独立的运行**：可以在没有现有 Web 服务运行的情况下独立使用
4. **独立的文档**：维护自己的 README 和使用说明

---

## 一、项目背景

### 1.1 现状分析

Claude Relay Service 当前是一个基于 Web 的 AI API 中转服务，提供了完整的管理界面和多账户调度功能。但在某些场景下，Web 界面并非必需：

- **服务器环境部署**：无需图形界面，纯 SSH 操作更高效
- **自动化脚本集成**：需要命令行工具而非浏览器交互
- **资源占用优化**：Web 前端及其依赖占用大量存储和内存
- **开发测试场景**：快速验证 OAuth 流程和 API 调用无需完整系统

### 1.2 项目定位

本项目旨在创建一个**最小化的命令行版本**，作为技术验证 Demo，专注于核心功能：

1. Claude 账号的 OAuth 2.0 授权流程
2. 通过代理转发消息到 Anthropic Messages API
3. 流式响应的处理和展示

**注意**：这不是对现有 Web 版本的完全替代，而是一个独立的轻量级工具。

---

## 二、项目目标

### 2.1 核心目标

- ✅ 实现完整的 Claude OAuth 2.0 PKCE 授权流程（CLI 适配）
- ✅ 支持 SOCKS5/HTTP 代理配置
- ✅ 自动管理 Access Token 的刷新机制
- ✅ 实现 Messages API 的流式消息处理
- ✅ 提供良好的命令行交互体验

### 2.2 成功标准

用户能够通过以下简单步骤完成从授权到使用的完整流程：

```bash
# 1. 授权
$ node cli.js auth login
→ 完成 OAuth 授权，保存 Token

# 2. 发送消息
$ node cli.js chat send "Hello Claude"
→ 收到流式响应，实时显示回复内容
```

---

## 三、功能范围

### 3.1 包含的功能

| 功能模块 | 说明 |
|---------|------|
| OAuth 授权 | 支持 PKCE 流程，代理配置，本地 Token 存储 |
| Token 管理 | 自动检查过期，自动刷新 Refresh Token |
| 代理支持 | SOCKS5 和 HTTP 代理，支持用户名密码认证 |
| 消息发送 | 调用 Messages API，支持流式响应 |
| 授权状态查询 | 查看当前 Token 状态、过期时间、用户邮箱 |

### 3.2 明确排除的功能

以下功能**不包含**在本 Demo 中：

- ❌ API Key 管理（不需要 `cr_` 前缀的自建 Key）
- ❌ 多账户管理和调度
- ❌ 速率限制和配额管理
- ❌ 使用统计和成本计算
- ❌ Web 管理界面
- ❌ Redis 存储（改用本地 JSON 文件）
- ❌ 管理员账户和权限系统
- ❌ Gemini、OpenAI 等其他平台支持
- ❌ Count Tokens API 等辅助接口
- ❌ 会话粘性（Sticky Session）
- ❌ 完整的日志系统和监控

---

## 四、技术架构

### 4.1 技术栈选择

**语言**: Python 3.8+

**理由**:
- 丰富的 HTTP 和代理库生态
- 优秀的命令行工具开发体验
- 更好的跨平台兼容性
- 简洁的异步处理支持

### 4.2 项目结构

```
claude_crs_cli/            # CLI 项目根目录
├── pyproject.toml         # Python 项目配置（推荐）
├── requirements.txt       # 依赖列表（备选）
├── cli.py                 # 命令行入口
├── src/                   # 核心逻辑模块
│   ├── __init__.py
│   ├── auth.py            # OAuth 2.0 授权逻辑
│   ├── chat.py            # Messages API 调用
│   ├── proxy.py           # 代理 Agent 创建
│   ├── storage.py         # 本地文件存储
│   └── constants.py       # 常量配置（Client ID、URLs）
├── data/                  # 本地数据存储
│   └── auth.json          # 存储 OAuth Token 和代理配置
├── CLAUDE_CRS_CLI_PRD.md  # 产品需求文档（本文档）
└── README.md              # 使用说明
```

**注意**：此项目完全独立于父目录的 Web 版本，拥有独立的虚拟环境。

### 4.3 核心依赖

| 依赖包 | 版本 | 用途 |
|-------|------|------|
| typer | ^0.9.0 | 现代化 CLI 框架（基于 click） |
| httpx | ^0.25.0 | 异步 HTTP 客户端，支持流式响应 |
| httpx[socks] | ^0.25.0 | SOCKS5 代理支持 |
| questionary | ^2.0.0 | 交互式命令行输入 |
| rich | ^13.0.0 | 终端美化输出、进度显示 |
| pydantic | ^2.0.0 | 数据验证和配置管理 |

### 4.4 数据存储结构

**文件路径**: `data/auth.json`

**存储字段**:
- `accessToken`: OAuth 访问令牌
- `refreshToken`: 刷新令牌
- `expiresAt`: 过期时间戳（毫秒）
- `email`: 用户邮箱
- `codeVerifier`: PKCE code_verifier（用于 token 刷新）
- `proxy`: 代理配置对象（可选）
  - `type`: "socks5" 或 "http"
  - `host`: 代理地址
  - `port`: 代理端口
  - `username`: 用户名（可选）
  - `password`: 密码（可选）

**注意**：由于是本地开发工具，Token 暂不加密存储，后续可增加加密层。

---

## 五、详细功能设计

### 5.1 OAuth 2.0 授权流程（`auth login`）

#### 5.1.1 交互流程

```
步骤 1: 代理配置（可选）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
? 是否配置代理？ (Y/n)

[如果选择 Yes]
? 代理类型: (使用方向键选择)
  ❯ SOCKS5
    HTTP

? 代理地址: 127.0.0.1
? 代理端口: 1080
? 用户名 (可选):
? 密码 (可选):

✓ 代理配置完成


步骤 2: 生成授权 URL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ 正在生成授权链接...

请在浏览器中打开以下链接进行授权：

┌──────────────────────────────────────────────────────┐
│                                                      │
│  https://claude.ai/oauth/authorize?client_id=...    │
│                                                      │
└──────────────────────────────────────────────────────┘

[尝试自动打开浏览器]
✓ 已在默认浏览器中打开授权页面

步骤 3: 等待用户输入
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
授权完成后，浏览器会跳转到回调页面。
请复制完整的回调 URL 或其中的 Authorization Code。

? 请粘贴内容: https://console.anthropic.com/oauth/code/callback?code=abc123&state=xyz


步骤 4: 交换 Token
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⠋ 正在获取访问令牌...
✓ Token 获取成功

⠋ 正在查询账户信息...
✓ 授权完成！

账户信息
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
邮箱:     user@example.com
套餐:     Claude Max
Token 有效期: 2025-10-10 15:30:00 (剩余 3600 秒)
代理:     socks5://127.0.0.1:1080

授权信息已保存到: data/auth.json
```

#### 5.1.2 技术实现要点

**可参考的现有代码位置**：`src/utils/oauthHelper.js`

##### PKCE 参数生成

**现有实现**：
- 函数：`generateCodeVerifier()` - 第 33-35 行
- 函数：`generateCodeChallenge()` - 第 42-44 行
- 函数：`generateState()` - 第 25-27 行
- 完整流程：`generateOAuthParams()` - 第 71-84 行

**Python 实现要点**：
- 使用 `secrets.token_urlsafe(32)` 生成 code_verifier
- 使用 `hashlib.sha256()` 计算 code_challenge
- 使用 `base64.urlsafe_b64encode()` 进行 base64url 编码

##### 授权 URL 构建

**现有实现**：
- OAuth 配置常量：第 12-19 行
- 函数：`generateAuthUrl()` - 第 52-65 行

**关键参数**：
- `client_id`: `9d1c250a-e61b-44d9-88ed-5944d1962f5e`
- `redirect_uri`: `https://console.anthropic.com/oauth/code/callback`
- `scope`: `org:create_api_key user:profile user:inference`

##### Token 交换（带代理支持）

**现有实现**：
- 函数：`exchangeCodeForTokens()` - 第 143-288 行
- 代理 Agent 创建：第 131-133 行（调用 ProxyHelper）

**Python 实现要点**：
- 使用 `httpx.AsyncClient` 发送请求
- 通过 `proxies={"https://": proxy_url}` 配置代理
- 请求头必须包含：`User-Agent`, `Referer`, `Origin`
- 清理授权码：移除 `#` 和 `&` 后的内容（第 145 行）

---

### 5.2 Token 自动刷新机制

#### 5.2.1 刷新时机

在每次调用 Messages API 前，自动检查 Token 有效性：

- **提前 10 秒刷新**：`expiresAt - Date.now() < 10000`
- **401 错误时刷新**：如果请求返回 401，立即尝试刷新

#### 5.2.2 刷新流程

**可参考的现有代码位置**：`src/services/claudeAccountService.js`

**现有实现**：
- 函数：`refreshAccessToken()` - 约第 200-250 行（刷新逻辑）
- 检查过期时间：计算 `expiresAt - now < 10000`（提前 10 秒）
- 并发控制：使用 Redis 锁防止并发刷新（第 220-230 行）

**Python 实现要点**：
- 使用 `time.time() * 1000` 获取当前时间戳（毫秒）
- 刷新请求参数：`grant_type=refresh_token`, `client_id`, `refresh_token`
- Token URL：`https://console.anthropic.com/v1/oauth/token`
- 成功后更新本地 JSON 文件（`accessToken`, `refreshToken`, `expiresAt`）
- 使用 `rich.spinner.Spinner` 显示刷新进度

---

### 5.3 代理配置支持

#### 5.3.1 代理 Agent 创建

**可参考的现有代码位置**：`src/utils/proxyHelper.js`

**现有实现**：
- 函数：`createProxyAgent()` - 约第 20-60 行
- 支持 SOCKS5 和 HTTP 代理
- 处理用户名密码认证
- 掩码显示代理信息：`maskProxyInfo()` - 约第 80-90 行

**Python 实现要点**：
- SOCKS5 代理格式：`socks5://[username:password@]host:port`
- HTTP 代理格式：`http://[username:password@]host:port`
- 使用 `httpx` 的 `proxies` 参数：
  ```python
  proxies = {"https://": proxy_url, "http://": proxy_url}
  async with httpx.AsyncClient(proxies=proxies) as client:
      ...
  ```
- URL 编码用户名密码：使用 `urllib.parse.quote()`

#### 5.3.2 使用场景

代理在以下场景中自动使用：

1. **OAuth Token 交换**：`exchangeCodeForTokens()`
2. **Token 刷新**：`refreshAccessToken()`
3. **Messages API 调用**：`sendMessage()`

---

### 5.4 Messages API 流式处理

#### 5.4.1 发送消息命令

```bash
$ node cli.js chat send "解释什么是 OAuth 2.0"

# 或从文件读取
$ node cli.js chat send --file prompt.txt
```

#### 5.4.2 流式响应处理

**可参考的现有代码位置**：`src/services/claudeRelayService.js`

**现有实现**：
- 函数：`relayStreamRequestWithUsageCapture()` - 约第 300-450 行
- SSE 事件解析逻辑：约第 350-400 行
- Usage 数据捕获：从 `message_start` 和 `message_delta` 事件提取

**Python 实现要点**：

##### 发送请求
- API Endpoint: `https://api.anthropic.com/v1/messages`
- 必需请求头：
  - `Content-Type: application/json`
  - `Authorization: Bearer {accessToken}`
  - `anthropic-version: 2023-06-01`
  - `anthropic-beta: prompt-caching-2024-07-31`
- 请求体：`{"model": "...", "max_tokens": 4096, "stream": true, "messages": [...]}`

##### SSE 流式解析
- 使用 `httpx.AsyncClient.stream()` 方法
- 逐行读取：`async for line in response.aiter_lines():`
- 解析 `data:` 开头的行
- 事件类型：
  - `message_start`: 提取 `event.message.usage.input_tokens`
  - `content_block_delta`: 提取 `event.delta.text` 并实时打印
  - `message_delta`: 提取 `event.usage.output_tokens`
  - `error`: 显示错误信息

##### 实时输出
- 使用 `rich.console.Console.print()` 输出彩色文本
- 或使用 `sys.stdout.write()` + `sys.stdout.flush()` 实现打字机效果

---

### 5.5 授权状态查询（`auth status`）

**功能说明**：读取本地 `data/auth.json` 文件并格式化展示授权信息

**Python 实现要点**：

##### 数据读取
- 使用 `json.load()` 读取 `data/auth.json`
- 异常处理：文件不存在时提示未授权

##### 时间计算
- 当前时间：`int(time.time() * 1000)`（毫秒）
- 剩余时间：`(expiresAt - now) / 1000`（秒）
- 格式化过期时间：`datetime.fromtimestamp(expiresAt / 1000).strftime('%Y-%m-%d %H:%M:%S')`

##### 终端美化输出
- 使用 `rich.console.Console` 和 `rich.table.Table` 展示表格
- 颜色方案：
  - 有效状态：绿色 `[green]✓ 有效[/green]`
  - 过期状态：红色 `[red]✗ 已过期[/red]`
  - 邮箱：青色 `[cyan]{email}[/cyan]`
  - 代理信息：黄色 `[yellow]{proxy_url}[/yellow]`

---

## 六、命令行界面设计

### 6.1 命令结构

```
claude-cli <command> [options]

命令:
  auth login         交互式 OAuth 授权流程
  auth status        查看当前授权状态
  chat send <msg>    发送消息到 Claude

选项:
  -h, --help         显示帮助信息
  -v, --version      显示版本号
```

### 6.2 命令详细说明

#### `auth login` - OAuth 授权

```bash
$ python cli.py auth login [OPTIONS]

选项:
  --no-proxy         跳过代理配置
  --no-browser       不自动打开浏览器

示例:
  python cli.py auth login
  python cli.py auth login --no-proxy
  python cli.py auth login --no-browser
```

#### `auth status` - 查看授权状态

```bash
$ python cli.py auth status

输出示例:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
授权状态
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
状态:       ✓ 有效
邮箱:       user@example.com
过期时间:   2025-10-10 15:30:00
剩余时间:   3500 秒
代理:       socks5://127.0.0.1:1080
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

#### `chat send` - 发送消息

```bash
$ python cli.py chat send <MESSAGE> [OPTIONS]

选项:
  --model TEXT        指定模型 (默认: claude-sonnet-4-20250514)
  --max-tokens INT    最大输出 tokens (默认: 4096)
  --file PATH         从文件读取消息内容

示例:
  # 直接发送消息
  python cli.py chat send "解释什么是 PKCE"

  # 使用不同模型
  python cli.py chat send "写一个快排" --model claude-opus-4-20250514

  # 从文件读取
  python cli.py chat send --file prompt.txt
```

---

## 七、实施计划

### ✅ 阶段 1：基础框架搭建（已完成 - 2025-10-10）

**目标**: 创建 Python 项目结构和基础模块

**任务清单**:
1. ✅ 在 `claude_crs_cli/` 目录下创建完整的项目结构
2. ✅ 创建 `requirements.txt` 和 `requirements-dev.txt`，定义依赖
3. ✅ 使用系统 Python 3 并安装依赖（不使用虚拟环境）
4. ✅ 实现 `src/storage.py`：本地 JSON 文件读写（使用 `json` 标准库）
   - 参考：`src/utils/oauthHelper.js` 第 12-19 行
5. ✅ 实现 `src/constants.py`：定义 OAuth 配置常量
   - 参考：`src/utils/oauthHelper.js` 第 12-19 行
6. ✅ 实现 `src/proxy.py`：代理 URL 构建逻辑
   - 参考：`src/utils/proxyHelper.js` 第 20-60 行
7. ✅ 创建 `cli.py` 入口文件，集成 `typer` 框架

**单元测试（额外完成）**:
8. ✅ 配置 pytest 测试框架（`pytest.ini`）
9. ✅ 创建测试 fixtures（`tests/conftest.py`）
10. ✅ 实现 `tests/test_proxy.py`：50 个测试用例
    - 包含真实静态代理 IP 测试（台湾、英国）
    - 测试 SOCKS5、HTTP、HTTPS 三种协议
11. ✅ 实现 `tests/test_storage.py`：23 个测试用例
    - 涵盖文件读写、权限设置、异常处理

**验收标准**:
- ✅ 能够执行 `python3 cli.py --help` 显示帮助信息
- ✅ 能够执行 `python3 cli.py --version` 显示版本号
- ✅ `src/storage.py` 能够正确读写 `data/auth.json`
- ✅ `src/proxy.py` 能够生成 SOCKS5 和 HTTP 代理 URL
- ✅ 所有依赖成功安装（使用 `--break-system-packages`）
- ✅ **单元测试通过率：100% (73/73)**
- ✅ **代码覆盖率：95% (133/140 行)**
- ✅ **测试执行时间：< 0.2 秒**

**测试命令**:
```bash
# 运行所有测试
pytest tests/ -v

# 查看覆盖率
pytest tests/ --cov=src

# 生成 HTML 报告
pytest tests/ --cov=src --cov-report=html
```

---

### 阶段 2：OAuth 授权功能

**目标**: 实现完整的 OAuth 2.0 PKCE 授权流程（Python 版）

**任务清单**:
1. 实现 `src/auth.py` 核心函数：
   - `generate_pkce_params()` - 生成 PKCE 参数
     - 参考：`src/utils/oauthHelper.js` 第 33-44 行
   - `build_auth_url()` - 构建授权 URL
     - 参考：`src/utils/oauthHelper.js` 第 52-65 行
   - `parse_auth_code()` - 解析用户输入的 code
     - 参考：`src/utils/oauthHelper.js` 第 295-337 行
   - `exchange_code_for_tokens()` - 交换 Token（支持代理）
     - 参考：`src/utils/oauthHelper.js` 第 143-288 行
   - `fetch_profile_info()` - 查询用户信息（邮箱、套餐）
     - 参考：`src/services/claudeAccountService.js` 约第 400-450 行
2. 实现 `auth login` 命令：
   - 使用 `questionary` 进行交互式代理配置
   - 使用 `webbrowser.open()` 自动打开浏览器
   - 使用 `questionary.text()` 等待用户粘贴 code
   - 使用 `rich.spinner.Spinner` 显示加载动画
   - 保存授权信息到 `data/auth.json`
3. 实现 `auth status` 命令：
   - 读取并展示授权信息（使用 `rich.table.Table`）
   - 显示 Token 剩余有效时间

**验收标准**:
- 能够成功完成 OAuth 授权流程
- `data/auth.json` 包含所有必需字段
- `python cli.py auth status` 能正确显示授权状态
- 代理配置能正常工作（通过代理获取 Token）

---

### 阶段 3：Token 自动刷新

**目标**: 实现智能的 Token 过期检测和自动刷新（Python 异步版本）

**任务清单**:
1. 实现 `src/auth.py` 刷新函数：
   - `ensure_valid_token()` - 检查并刷新 Token
     - 参考：`src/services/claudeAccountService.js` 约第 200-250 行
   - `refresh_access_token()` - 调用 Refresh Token API
     - 使用 `httpx.AsyncClient.post()` 发送异步请求
2. 添加错误处理：
   - Refresh Token 失效时的提示（捕获 400/401 错误）
   - 网络错误时的重试机制（使用 `tenacity` 库或手动实现）
3. 集成到所有 API 调用前（装饰器模式）

**验收标准**:
- Token 过期前 10 秒自动刷新
- 刷新成功后更新 `data/auth.json`
- 刷新失败时有明确的错误提示（使用 `rich.console.Console.print()`）
- 通过代理发送刷新请求

---

### 阶段 4：Messages API 流式处理

**目标**: 实现消息发送和流式响应处理（Python 异步版本）

**任务清单**:
1. 实现 `src/chat.py` 核心函数：
   - `send_message()` - 发送消息到 Messages API
     - 参考：`src/services/claudeRelayService.js` 约第 300-450 行
     - 使用 `httpx.AsyncClient.stream()` 发送流式请求
   - `handle_stream_response()` - 解析 SSE 流式响应
     - 使用 `async for line in response.aiter_lines():`
   - `extract_usage_data()` - 提取 usage 统计数据
2. 实现 `chat send` 命令：
   - 支持命令行参数传递消息（typer 参数）
   - 支持 `--file` 从文件读取（`Path` 类型）
   - 支持 `--model` 和 `--max-tokens` 选项
3. 优化输出体验：
   - 实时打印 `content_block_delta`（使用 `sys.stdout.write()` + `flush()`）
   - 显示 loading 动画（使用 `rich.spinner.Spinner`）
   - 统计并展示 token 使用量（使用 `rich.table.Table`）

**验收标准**:
- 能够成功发送消息并收到流式响应
- 文本逐字显示，无明显延迟
- Token 过期时自动刷新并重试
- 正确提取并显示 input_tokens 和 output_tokens
- 通过代理发送请求成功

---

### 阶段 5：错误处理和优化

**目标**: 完善错误处理，提升用户体验

**任务清单**:
1. 添加全局错误捕获：
   - 网络错误处理（超时、连接失败） - 使用 `httpx.TimeoutException`
   - API 错误处理（401、403、429、500） - 使用 `httpx.HTTPStatusError`
   - 用户输入错误处理 - 使用 `typer.BadParameter`
2. 优化交互体验：
   - 添加彩色输出（使用 `rich.console.Console`）
   - 优化错误提示信息（使用 `rich.panel.Panel` 显示错误）
   - 添加进度提示（使用 `rich.progress.Progress`）
3. 编写 README.md 文档：
   - 安装说明（虚拟环境创建、依赖安装）
   - 使用示例（完整的授权和聊天流程）
   - 常见问题解答（代理配置、Token 刷新失败等）

**验收标准**:
- 所有错误都有友好的提示信息（使用 rich 格式化）
- 网络异常时有重试机制（使用 `tenacity` 库）
- README 文档完整清晰

---

### 阶段 6：测试和发布

**目标**: 完整测试和打包发布

**任务清单**:
1. 功能测试：
   - 测试完整的授权流程（有代理/无代理）
   - 测试 Token 自动刷新机制
   - 测试不同网络环境下的消息发送
   - 测试错误场景（无效 code、网络断开等）
2. 代码优化：
   - 运行 `black` 格式化所有 Python 代码
   - 运行 `ruff` 进行代码检查
   - 检查并移除调试代码
   - 优化性能瓶颈
3. 打包和发布：
   - 创建可执行脚本（添加 shebang `#!/usr/bin/env python3`）
   - 使用 `setuptools` 或 `poetry` 打包
   - 准备发布说明

**验收标准**:
- 所有核心功能正常工作
- 代码格式统一（通过 black 和 ruff 检查）
- README 和使用文档完善
- 可通过 `python cli.py` 或打包后的可执行文件运行

---

## 八、技术风险和应对

### 8.1 OAuth 授权回调问题

**风险**: CLI 环境无法接收 OAuth 回调

**应对方案**:
- 使用官方回调 URL（`https://console.anthropic.com/oauth/code/callback`）
- 用户手动复制 Authorization Code
- 提供清晰的操作指引

### 8.2 代理连接失败

**风险**: 代理配置错误或代理服务不可用

**应对方案**:
- 添加代理连接测试功能
- 提供详细的错误信息（连接超时、认证失败等）
- 允许跳过代理配置

### 8.3 Token 刷新失败

**风险**: Refresh Token 失效导致无法自动刷新

**应对方案**:
- 捕获 400/401 错误，提示用户重新授权
- 保留旧的 Refresh Token 作为备份
- 记录刷新失败日志

### 8.4 流式响应解析错误

**风险**: SSE 格式解析异常或数据不完整

**应对方案**:
- 健壮的 buffer 处理逻辑（处理跨 chunk 的 JSON）
- 忽略无法解析的事件，继续处理后续数据
- 添加超时机制，避免无限等待

---

## 九、后续扩展方向

以下功能可在 Demo 验证成功后逐步添加：

1. **会话管理**：保存历史对话，支持多轮对话
2. **模型切换**：快速切换 Sonnet/Opus/Haiku
3. **配置文件**：支持 `~/.claude-cli/config.json` 全局配置
4. **插件系统**：支持自定义命令扩展
5. **多账户支持**：管理多个 Claude 账号
6. **使用统计**：记录本地 token 消耗统计

---

**文档结束**
