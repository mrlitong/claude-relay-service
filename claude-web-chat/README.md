# Claude Web Chat

一个现代化的Claude聊天界面，通过Claude Relay Service进行API代理。

## ✨ 特性

- 🚀 **流式响应** - 实时接收Claude的回复，提供流畅的聊天体验
- 💬 **会话管理** - 多会话支持，自动保存聊天历史
- 🎨 **Markdown渲染** - 完整支持Markdown格式和代码高亮
- 🌙 **暗黑模式** - 自动适配系统主题，支持手动切换
- 📱 **响应式设计** - 完美适配桌面和移动设备
- 🔐 **安全配置** - API Key本地存储，支持自定义代理地址

## 🚀 快速开始

### 前置要求

1. 确保Claude Relay Service已经运行（默认端口3000）
2. 从Claude Relay Service获取API Key（cr_开头）

### 安装步骤

```bash
# 进入项目目录
cd claude-web-chat

# 安装依赖
npm install

# 复制环境变量配置
cp .env.example .env

# 编辑.env文件，配置你的API Key和Relay Service地址
# VITE_RELAY_SERVICE_URL=http://localhost:3000
# VITE_API_KEY=cr_your_api_key_here

# 启动开发服务器
npm run dev
```

访问 http://localhost:5173 即可使用！

## 🔧 配置说明

### 环境变量配置

在项目根目录创建`.env`文件：

```env
# Claude Relay Service地址
VITE_RELAY_SERVICE_URL=http://localhost:3000

# 你的API Key
VITE_API_KEY=cr_your_api_key_here
```

### 应用内设置

点击右下角的设置按钮，可以：
- 配置Relay Service URL
- 设置API Key
- 切换明亮/暗黑模式

设置会自动保存到浏览器本地存储。

## 📦 构建部署

```bash
# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

构建完成后，`dist`目录包含所有静态文件，可以部署到任何静态托管服务。

### Docker部署

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

## 🎯 功能特点

### 聊天功能
- **流式传输**: 实时显示Claude的回复，逐字呈现
- **消息格式化**: 支持Markdown、代码块、表格等
- **快捷键支持**: Enter发送，Shift+Enter换行

### 会话管理
- **多会话**: 创建和管理多个独立对话
- **自动保存**: 聊天历史自动保存到本地
- **会话重命名**: 可编辑会话标题
- **会话删除**: 支持删除不需要的会话

### 界面设计
- **响应式布局**: 自适应不同屏幕尺寸
- **侧边栏收缩**: 可隐藏侧边栏获得更大聊天空间
- **平滑动画**: 所有交互都有流畅的过渡效果

## 🛠 技术栈

- **React 18** - 用户界面框架
- **TypeScript** - 类型安全
- **Tailwind CSS** - 样式框架
- **Zustand** - 状态管理
- **React Markdown** - Markdown渲染
- **Vite** - 构建工具

## 📝 开发指南

### 项目结构

```
claude-web-chat/
├── src/
│   ├── components/        # React组件
│   │   ├── ChatInterface.tsx    # 主聊天界面
│   │   ├── ChatMessage.tsx      # 消息组件
│   │   ├── ConversationList.tsx # 会话列表
│   │   └── SettingsModal.tsx    # 设置模态框
│   ├── services/          # API服务
│   │   └── claudeApi.ts        # Claude API集成
│   ├── stores/            # 状态管理
│   │   └── chatStore.ts        # 聊天状态
│   ├── App.tsx           # 主应用组件
│   └── main.tsx          # 应用入口
├── .env.example          # 环境变量示例
├── vite.config.ts        # Vite配置
└── package.json          # 项目配置
```

### 自定义开发

1. **修改API集成**: 编辑`src/services/claudeApi.ts`
2. **自定义UI组件**: 修改`src/components/`下的组件
3. **调整样式主题**: 编辑`tailwind.config.js`和`src/index.css`
4. **扩展功能**: 在`src/stores/chatStore.ts`添加新的状态和动作

## 🤝 贡献

欢迎提交Issue和Pull Request！

## 📄 许可

MIT License