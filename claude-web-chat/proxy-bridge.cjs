/**
 * 代理桥接服务器
 * 将本地请求通过系统代理转发到远程Claude Relay Service
 */

const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { HttpsProxyAgent } = require('https-proxy-agent');

const app = express();

// 系统代理配置
const SYSTEM_PROXY = 'http://127.0.0.1:10809';
const TARGET_URL = 'http://149.88.90.105:888';

// 创建代理agent
const proxyAgent = new HttpsProxyAgent(SYSTEM_PROXY);

// 配置代理中间件
const proxy = createProxyMiddleware({
  target: TARGET_URL,
  changeOrigin: true,
  agent: proxyAgent,  // 使用系统代理
  onProxyReq: (proxyReq, req, res) => {
    console.log(`[Proxy] ${req.method} ${req.url} -> ${TARGET_URL}${req.url}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`[Proxy] Response: ${proxyRes.statusCode}`);
  },
  onError: (err, req, res) => {
    console.error('[Proxy Error]', err);
    res.status(500).json({ error: 'Proxy error', message: err.message });
  },
});

// 应用代理到所有/api路径
app.use('/api', proxy);

// 启动服务器
const PORT = 3333;
app.listen(PORT, () => {
  console.log(`🚀 Proxy Bridge Server running on http://localhost:${PORT}`);
  console.log(`📡 Forwarding requests through ${SYSTEM_PROXY} to ${TARGET_URL}`);
});