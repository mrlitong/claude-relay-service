"""
代理配置管理模块
参考：src/utils/proxyHelper.js
"""

from typing import Optional, Dict, Any
from urllib.parse import quote

from .constants import PROXY_TYPES


def validate_proxy_config(proxy_config: Optional[Dict[str, Any]]) -> bool:
    """
    验证代理配置的有效性

    Args:
        proxy_config: 代理配置字典

    Returns:
        bool: 配置有效返回 True

    参考：src/utils/proxyHelper.js:117-145
    """
    if not proxy_config:
        return False

    # 检查必要字段
    if not all(key in proxy_config for key in ['type', 'host', 'port']):
        return False

    # 检查支持的代理类型
    if proxy_config['type'] not in PROXY_TYPES:
        return False

    # 检查端口范围
    try:
        port = int(proxy_config['port'])
        if port < 1 or port > 65535:
            return False
    except (ValueError, TypeError):
        return False

    return True


def build_proxy_url(proxy_config: Optional[Dict[str, Any]]) -> Optional[str]:
    """
    构建代理 URL

    Args:
        proxy_config: 代理配置字典
            {
                "type": "socks5" | "http" | "https",
                "host": str,
                "port": int,
                "username": str (可选),
                "password": str (可选)
            }

    Returns:
        Optional[str]: 代理 URL，格式如 "socks5://user:pass@host:port"

    参考：src/utils/proxyHelper.js:18-68 (createProxyAgent 函数)
    """
    if not proxy_config or not validate_proxy_config(proxy_config):
        return None

    proxy_type = proxy_config['type']
    host = proxy_config['host']
    port = proxy_config['port']

    # 构建认证信息（URL 编码用户名和密码）
    auth = ""
    if proxy_config.get('username') and proxy_config.get('password'):
        username = quote(proxy_config['username'], safe='')
        password = quote(proxy_config['password'], safe='')
        auth = f"{username}:{password}@"

    # SOCKS5 代理使用 socks5h:// 协议（支持远程 DNS 解析）
    # 参考：proxyHelper.js:41
    if proxy_type == 'socks5':
        return f"socks5h://{auth}{host}:{port}"
    elif proxy_type in ['http', 'https']:
        return f"{proxy_type}://{auth}{host}:{port}"

    return None


def build_httpx_proxies(proxy_config: Optional[Dict[str, Any]]) -> Optional[Dict[str, str]]:
    """
    构建 httpx 客户端使用的代理配置字典

    Args:
        proxy_config: 代理配置字典

    Returns:
        Optional[Dict]: httpx 格式的代理配置，如 {"https://": "socks5://...", "http://": "socks5://..."}
    """
    proxy_url = build_proxy_url(proxy_config)

    if not proxy_url:
        return None

    # httpx 需要同时配置 http 和 https 协议的代理
    return {
        "https://": proxy_url,
        "http://": proxy_url,
    }


def mask_proxy_info(proxy_config: Optional[Dict[str, Any]]) -> str:
    """
    脱敏显示代理信息（用于日志输出）

    Args:
        proxy_config: 代理配置字典

    Returns:
        str: 脱敏后的代理描述

    参考：src/utils/proxyHelper.js:171-197 (maskProxyInfo 函数)
    """
    if not proxy_config:
        return "No proxy"

    if not validate_proxy_config(proxy_config):
        return "Invalid proxy config"

    proxy_type = proxy_config['type']
    host = proxy_config['host']
    port = proxy_config['port']

    proxy_desc = f"{proxy_type}://{host}:{port}"

    # 脱敏处理认证信息
    username = proxy_config.get('username')
    password = proxy_config.get('password')

    if username and password:
        # 用户名：保留首尾字符，中间用星号代替
        if len(username) <= 2:
            masked_username = username
        else:
            masked_username = username[0] + '*' * max(1, len(username) - 2) + username[-1]

        # 密码：全部用星号代替（最多显示 8 个星号）
        masked_password = '*' * min(8, len(password))

        proxy_desc += f" (auth: {masked_username}:{masked_password})"

    return proxy_desc


def get_proxy_description(proxy_config: Optional[Dict[str, Any]]) -> str:
    """
    获取代理配置的简短描述

    Args:
        proxy_config: 代理配置字典

    Returns:
        str: 代理描述字符串

    参考：src/utils/proxyHelper.js:152-164
    """
    if not proxy_config:
        return "No proxy"

    if not validate_proxy_config(proxy_config):
        return "Invalid proxy config"

    has_auth = proxy_config.get('username') and proxy_config.get('password')
    auth_suffix = " (with auth)" if has_auth else ""

    return f"{proxy_config['type']}://{proxy_config['host']}:{proxy_config['port']}{auth_suffix}"
