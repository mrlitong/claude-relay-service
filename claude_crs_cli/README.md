# Claude CRS CLI

> Claude Relay Service - 命令行版本
> 轻量级的 Claude OAuth 授权和 Messages API 调用工具

## 📋 项目简介

Claude CRS CLI 是 Claude Relay Service 的**最小化命令行版本**，专注于核心功能：

- ✅ Claude OAuth 2.0 PKCE 授权流程
- ✅ 自动 Token 刷新机制
- ✅ SOCKS5/HTTP 代理支持
- ✅ Messages API 流式消息处理

**注意**：这是一个独立的技术验证 Demo，不是对现有 Web 版本的完全替代。

## 🚀 快速开始

### 1. 安装依赖

```bash
# 进入项目目录
cd claude_crs_cli

# 使用 pip3 安装依赖
pip3 install -r requirements.txt
```

### 2. 基本使用

```bash
# 查看帮助信息
python3 cli.py --help

# 查看版本号
python3 cli.py --version

# OAuth 授权（第二阶段实现）
python3 cli.py auth login

# 查看授权状态（第二阶段实现）
python3 cli.py auth status

# 发送消息（第四阶段实现）
python3 cli.py chat send "Hello Claude"
```

## 📦 项目结构

```
claude_crs_cli/
├── cli.py                   # CLI 入口文件
├── requirements.txt         # Python 运行依赖
├── requirements-dev.txt     # 开发和测试依赖
├── pytest.ini               # pytest 配置文件
├── src/                     # 核心模块
│   ├── __init__.py
│   ├── constants.py         # OAuth 配置常量 ✅
│   ├── storage.py           # 本地 JSON 文件存储 ✅
│   ├── proxy.py             # 代理配置管理 ✅
│   ├── auth.py              # OAuth 授权逻辑（待实现）
│   └── chat.py              # Messages API 调用（待实现）
├── tests/                   # 单元测试 ✅
│   ├── __init__.py
│   ├── conftest.py          # 测试 fixtures
│   ├── test_proxy.py        # 代理模块测试（50 个测试）
│   └── test_storage.py      # 存储模块测试（23 个测试）
├── data/                    # 本地数据存储
│   └── auth.json            # OAuth Token 存储
├── htmlcov/                 # 测试覆盖率报告
├── TEST_REPORT.md           # 详细测试报告
├── CLAUDE_CRS_CLI_PRD.md    # 产品需求文档
└── README.md                # 本文档
```

## 🛠️ 开发进度

### ✅ 阶段 1：基础框架搭建（已完成 - 2025-10-10）

#### 核心功能
- [x] 创建项目目录结构
- [x] 配置依赖管理（requirements.txt + requirements-dev.txt）
- [x] 实现 `src/constants.py`（OAuth 配置常量）
- [x] 实现 `src/storage.py`（JSON 文件读写）
- [x] 实现 `src/proxy.py`（代理 URL 构建）
- [x] 创建 `cli.py` 入口文件（typer 框架）

#### 单元测试
- [x] 配置 pytest 测试框架
- [x] 实现 `tests/test_proxy.py`（50 个测试用例）
- [x] 实现 `tests/test_storage.py`（23 个测试用例）
- [x] 集成真实静态代理 IP 测试（台湾、英国）
- [x] 代码覆盖率：**95%** (133/140 行)

### ⏳ 阶段 2：OAuth 授权功能（规划中）

- [ ] 实现 PKCE 参数生成
- [ ] 实现授权 URL 构建
- [ ] 实现 Token 交换（支持代理）
- [ ] 实现 `auth login` 命令
- [ ] 实现 `auth status` 命令

### ⏳ 阶段 3：Token 自动刷新（规划中）

- [ ] 实现 Token 过期检测
- [ ] 实现自动刷新逻辑
- [ ] 集成到所有 API 调用前

### ⏳ 阶段 4：Messages API 流式处理（规划中）

- [ ] 实现消息发送功能
- [ ] 实现 SSE 流式响应解析
- [ ] 实现 `chat send` 命令
- [ ] 优化终端输出体验

### ⏳ 阶段 5：错误处理和优化（规划中）

- [ ] 添加全局错误捕获
- [ ] 优化交互体验
- [ ] 完善文档

## 📚 依赖说明

### 运行依赖 (`requirements.txt`)

| 依赖包       | 版本要求 | 用途                     |
| ------------ | -------- | ------------------------ |
| typer        | ^0.9.0   | 现代化 CLI 框架          |
| httpx        | ^0.25.0  | 异步 HTTP 客户端         |
| httpx[socks] | ^0.25.0  | SOCKS5 代理支持          |
| questionary  | ^2.0.0   | 交互式命令行输入         |
| rich         | ^13.0.0  | 终端美化输出、进度显示   |
| pydantic     | ^2.0.0   | 数据验证和配置管理       |

### 开发依赖 (`requirements-dev.txt`)

| 依赖包         | 版本要求 | 用途                |
| -------------- | -------- | ------------------- |
| pytest         | ^7.4.0   | 测试框架            |
| pytest-cov     | ^4.1.0   | 覆盖率报告          |
| pytest-mock    | ^3.11.1  | Mock 支持           |
| pytest-asyncio | ^0.21.0  | 异步测试支持        |

## 🧪 单元测试

### 测试概览

- **测试用例总数**: 73 个
- **通过率**: 100% (73/73)
- **代码覆盖率**: 95% (133/140 行)
- **执行时间**: ~0.2 秒

### 安装测试依赖

```bash
pip3 install --break-system-packages -r requirements-dev.txt
```

### 运行测试

```bash
# 运行所有测试
pytest tests/ -v

# 运行所有测试并显示覆盖率
pytest tests/ --cov=src

# 生成 HTML 覆盖率报告
pytest tests/ --cov=src --cov-report=html
open htmlcov/index.html

# 仅运行代理模块测试
pytest tests/test_proxy.py -v

# 仅运行存储模块测试
pytest tests/test_storage.py -v

# 运行特定标记的测试
pytest -m unit           # 仅单元测试
pytest -m real_proxy     # 仅真实代理测试
pytest -m integration    # 仅集成测试
```

### 测试标记 (Markers)

- `@pytest.mark.unit` - 单元测试（快速，无外部依赖）
- `@pytest.mark.integration` - 集成测试（涉及文件系统）
- `@pytest.mark.real_proxy` - 使用真实代理 IP 的测试

### 测试报告

详细的测试报告和覆盖率分析请查看 [TEST_REPORT.md](./TEST_REPORT.md)

## 🔧 开发指南

### 代码复用策略

本项目从现有 Web 版本**复制**代码到 `src/` 目录，参考以下模块：

- `src/utils/oauthHelper.js` - OAuth PKCE 流程实现
- `src/utils/proxyHelper.js` - 代理 Agent 创建
- `src/services/claudeAccountService.js` - Token 刷新机制
- `src/services/claudeRelayService.js` - 流式响应处理

**注意**：所有开发工作严格限定在 `claude_crs_cli/` 目录内，不修改其他目录的代码。

### 独立性原则

Claude CRS CLI 是一个**完全独立的项目**：

1. **独立的依赖管理**：使用自己的 `requirements.txt`
2. **独立的配置**：使用本地 JSON 文件存储，不依赖 Redis
3. **独立的运行**：可以在没有 Web 服务的情况下独立使用
4. **独立的文档**：维护自己的 README 和使用说明

## 📖 参考文档

- [产品需求文档 (PRD)](./CLAUDE_CRS_CLI_PRD.md) - 完整的功能规划和技术设计
- [现有项目文档](../CLAUDE.md) - 现有 Web 版本的架构说明

## 🤝 贡献

本项目是 Claude Relay Service 的子项目，遵循父项目的开发规范。

## 📄 许可证

与 Claude Relay Service 主项目保持一致。

---

**当前版本**: v1.0.0 (阶段 1 已完成)
**最后更新**: 2025-10-10
