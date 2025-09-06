# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with the Claude Web Chat codebase.

这个文件为 Claude Code (claude.ai/code) 提供 Claude Web Chat 项目的工作指导。

## 项目概述

Claude Web Chat 是一个现代化的 Web 聊天界面，专门设计用于与 Claude Relay Service 集成。它提供了一个优雅、响应式的用户界面，支持流式对话、会话管理和实时交互体验。该项目作为 Claude Relay Service 的前端配套应用，让用户能够通过浏览器便捷地与 Claude AI 进行对话。

## 核心架构

### 技术栈

- **React 18** + **TypeScript**: 类型安全的现代前端框架
- **Vite**: 快速的构建工具和开发服务器
- **Tailwind CSS**: 实用优先的 CSS 框架
- **Zustand**: 轻量级状态管理解决方案
- **React Markdown**: 支持代码高亮的 Markdown 渲染
- **Lucide React**: 现代图标库

### 项目结构

```
claude-web-chat/
├── src/
│   ├── components/           # UI 组件
│   │   ├── ChatInterface.tsx      # 主聊天界面（核心组件）
│   │   ├── ChatMessage.tsx        # 消息显示组件
│   │   ├── ConversationList.tsx   # 会话列表侧边栏
│   │   └── SettingsModal.tsx      # 设置模态框
│   ├── services/            # API 服务层
│   │   └── claudeApi.ts          # Claude API 集成（流式处理）
│   ├── stores/              # 状态管理
│   │   └── chatStore.ts          # Zustand 聊天状态管理
│   ├── App.tsx              # 应用根组件
│   ├── main.tsx             # 应用入口
│   └── index.css            # 全局样式
├── proxy-bridge.cjs         # 代理桥接服务（可选）
├── vite.config.ts           # Vite 配置
├── tailwind.config.js       # Tailwind 配置
├── tsconfig.json            # TypeScript 配置
└── package.json             # 项目依赖
```

### 核心功能特性

1. **流式响应处理**: 实时接收和显示 Claude 的回复，提供流畅的打字机效果
2. **多会话管理**: 创建、切换、删除和重命名独立的对话会话
3. **消息历史持久化**: 使用浏览器 localStorage 自动保存聊天记录
4. **Markdown 渲染**: 完整支持 Markdown 格式、代码高亮、表格等
5. **暗黑模式**: 自动适配系统主题，支持手动切换
6. **响应式设计**: 完美适配桌面和移动设备
7. **模型选择**: 支持切换不同的 Claude 模型（Sonnet 4、Opus 4）

## 开发环境配置

### 基本设置

```bash
# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件设置：
# VITE_RELAY_SERVICE_URL=http://localhost:3000
# VITE_API_KEY=cr_your_api_key_here

# 启动开发服务器
npm run dev           # 默认运行在 http://localhost:5173
```

### 代理配置选项

#### 选项 1: Vite 开发代理（推荐）
vite.config.ts 中已配置开发代理，自动转发 `/api` 请求到远程服务器

#### 选项 2: 代理桥接服务（系统代理）
```bash
# 如需通过系统代理访问
node proxy-bridge.cjs
# 然后将 VITE_RELAY_SERVICE_URL 设置为 http://localhost:3333
```

## 核心组件详解

### API 服务层 (claudeApi.ts)

- **流式消息处理**: 使用 AsyncGenerator 处理 SSE 流
- **模型管理**: 支持 Claude Sonnet 4 和 Opus 4 模型切换
- **错误处理**: 完善的错误捕获和用户友好的错误提示
- **配置管理**: 支持动态更新 API Key 和服务 URL

关键方法：
- `sendMessageStream()`: 核心流式通信方法，处理 SSE 事件流
- `setApiKey()` / `setBaseURL()`: 动态配置更新
- `setModel()` / `getCurrentModel()`: 模型切换管理

### 状态管理 (chatStore.ts)

使用 Zustand 管理全局状态，支持持久化存储：

- **会话管理**: 创建、选择、删除会话
- **消息管理**: 添加用户/助手消息，更新流式内容
- **UI 状态**: 加载状态、错误处理、流式消息 ID
- **数据持久化**: 自动保存到 localStorage

关键状态：
- `conversations`: 所有会话数组
- `currentConversationId`: 当前活动会话
- `streamingContent`: 实时流式内容
- `isLoading`: 请求状态

### 主聊天界面 (ChatInterface.tsx)

核心 UI 组件，协调各个子组件：

- **自适应布局**: 可收缩侧边栏，响应式设计
- **模型切换**: 下拉菜单选择不同 Claude 模型
- **输入处理**: 支持 Enter 发送，Shift+Enter 换行
- **自动滚动**: 新消息自动滚动到底部
- **实时更新**: 流式内容逐字显示

## 开发最佳实践

### 代码规范

1. **类型安全**: 始终使用 TypeScript 类型定义
2. **组件设计**: 保持组件小而专注，遵循单一职责原则
3. **状态管理**: 使用 Zustand store 管理全局状态，组件内部使用 useState
4. **错误处理**: 所有异步操作都需要 try-catch 和用户友好的错误提示
5. **性能优化**: 使用 React.memo、useCallback、useMemo 优化渲染

### 样式开发

- **Tailwind 优先**: 使用 Tailwind CSS 类，避免内联样式
- **暗黑模式兼容**: 所有新增样式必须同时支持明暗主题
  - 文本：`text-gray-700 dark:text-gray-200`
  - 背景：`bg-white dark:bg-gray-800`
  - 边框：`border-gray-200 dark:border-gray-700`
- **响应式设计**: 使用 Tailwind 响应式前缀（sm:、md:、lg:、xl:）
- **动画过渡**: 使用 `transition-all duration-300` 提供流畅体验

### 流式响应处理

处理 Claude API 流式响应的关键点：

1. **SSE 事件解析**: 正确解析 `data:` 前缀的事件
2. **分块处理**: 处理不完整的 JSON 块，使用缓冲区
3. **事件类型**: 识别 `content_block_delta`、`message_delta` 等事件
4. **错误恢复**: 流中断时的优雅降级
5. **资源清理**: 组件卸载时清理 Reader 和 AbortController

### 调试技巧

1. **网络调试**: 使用浏览器 Network 面板查看 SSE 流
2. **Console 日志**: claudeApi.ts 中有详细的调试日志
3. **React DevTools**: 检查组件状态和 props
4. **Zustand DevTools**: 监控全局状态变化

## 常用命令

```bash
# 开发
npm run dev              # 启动开发服务器
npm run build           # 构建生产版本
npm run preview         # 预览构建结果
npm run lint            # 代码检查

# 代理桥接（可选）
node proxy-bridge.cjs   # 启动代理桥接服务
```

## 部署说明

### 静态部署

```bash
npm run build
# dist 目录包含所有静态文件
# 可部署到 Nginx、Apache、Vercel、Netlify 等
```

### Docker 部署

```dockerfile
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
```

### 环境变量配置

生产环境需要配置：
- `VITE_RELAY_SERVICE_URL`: Claude Relay Service 地址
- `VITE_API_KEY`: API 认证密钥（cr_ 前缀）

## 故障排除

### 常见问题

1. **连接失败**: 检查 Relay Service 是否运行，API Key 是否正确
2. **CORS 错误**: 确认 Vite 代理配置或使用 proxy-bridge.cjs
3. **流式响应中断**: 检查网络稳定性，查看控制台错误日志
4. **会话丢失**: localStorage 被清理，检查浏览器设置
5. **模型切换无效**: 清除 localStorage 中的 `claude_model` 键

### 调试步骤

1. 打开浏览器控制台查看错误信息
2. 检查 Network 面板中的 API 请求
3. 查看 claudeApi.ts 的 console.log 输出
4. 验证环境变量是否正确加载
5. 测试 Relay Service 的健康状态

## 扩展开发指南

### 添加新功能

1. **新增组件**: 在 `src/components/` 创建，遵循现有模式
2. **扩展 Store**: 在 `chatStore.ts` 添加新的状态和 actions
3. **API 集成**: 在 `claudeApi.ts` 添加新的 API 方法
4. **样式主题**: 编辑 `tailwind.config.js` 和 `index.css`

### 性能优化建议

1. **虚拟滚动**: 对于长对话历史，考虑实现虚拟滚动
2. **消息分页**: 实现消息的懒加载和分页
3. **缓存策略**: 使用 IndexedDB 替代 localStorage 存储大量数据
4. **代码分割**: 使用动态导入实现路由级代码分割

## 安全注意事项

1. **API Key 安全**: 不要将 API Key 硬编码在代码中
2. **XSS 防护**: Markdown 渲染已经过滤危险内容
3. **CSP 策略**: 生产环境配置适当的 Content Security Policy
4. **输入验证**: 对用户输入进行长度和内容验证
5. **HTTPS**: 生产环境必须使用 HTTPS

## 项目特定约定

### 命名规范

- 组件文件：PascalCase (如 `ChatInterface.tsx`)
- 工具函数：camelCase (如 `sendMessage`)
- 常量：UPPER_SNAKE_CASE (如 `AVAILABLE_MODELS`)
- CSS 类：kebab-case 或 Tailwind 类

### 文件组织

- 每个组件一个文件
- 相关的类型定义放在同一文件顶部
- 工具函数放在 services 目录
- 全局状态放在 stores 目录

### Git 工作流

- feature 分支命名：`feature/功能名称`
- bugfix 分支命名：`fix/问题描述`
- commit 信息格式：`type: description`
  - feat: 新功能
  - fix: 修复问题
  - docs: 文档更新
  - style: 代码格式
  - refactor: 重构
  - test: 测试相关
  - chore: 构建/工具链

## 重要提醒

- 修改代码前先理解现有实现
- 保持代码风格一致性
- 新功能需要考虑暗黑模式兼容
- 流式响应是核心功能，修改时特别注意
- 测试在不同浏览器和设备上的兼容性
- 保持良好的用户体验和性能