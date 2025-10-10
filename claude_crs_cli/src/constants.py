"""
OAuth 和 API 配置常量
从 src/utils/oauthHelper.js 提取的配置信息
"""

# OAuth 2.0 配置常量
# 参考：src/utils/oauthHelper.js 第 12-19 行
OAUTH_CONFIG = {
    "AUTHORIZE_URL": "https://claude.ai/oauth/authorize",
    "TOKEN_URL": "https://console.anthropic.com/v1/oauth/token",
    "CLIENT_ID": "9d1c250a-e61b-44d9-88ed-5944d1962f5e",
    "REDIRECT_URI": "https://console.anthropic.com/oauth/code/callback",
    "SCOPES": "org:create_api_key user:profile user:inference",
}

# 简化的常量（用于直接导入）
AUTHORIZE_URL = OAUTH_CONFIG["AUTHORIZE_URL"]
TOKEN_URL = OAUTH_CONFIG["TOKEN_URL"]
CLIENT_ID = OAUTH_CONFIG["CLIENT_ID"]
REDIRECT_URI = OAUTH_CONFIG["REDIRECT_URI"]
SCOPES = OAUTH_CONFIG["SCOPES"]

# Profile API 配置
# 参考：src/services/claudeAccountService.js 第 1963 行
PROFILE_API_URL = "https://api.anthropic.com/api/oauth/profile"

# Claude Messages API 配置
# 用于发送消息和流式响应处理
API_CONFIG = {
    "MESSAGES_URL": "https://api.anthropic.com/v1/messages",
    "ANTHROPIC_VERSION": "2023-06-01",
    "BETA_HEADER": "prompt-caching-2024-07-31",
}

# 默认模型配置
DEFAULT_MODEL = "claude-sonnet-4-20250514"
DEFAULT_MAX_TOKENS = 4096

# 本地存储配置
DATA_DIR = "data"
AUTH_FILE = "auth.json"

# Token 刷新策略
# 提前 10 秒刷新（与现有系统保持一致）
TOKEN_REFRESH_THRESHOLD_SECONDS = 10

# HTTP 请求配置
REQUEST_TIMEOUT_SECONDS = 30
USER_AGENT = "claude-crs-cli/1.0.0 (Python)"

# 代理类型常量
PROXY_TYPES = ["socks5", "http", "https"]
