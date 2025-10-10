"""
OAuth 2.0 PKCE 授权模块
严格参考原 Node.js 实现: src/utils/oauthHelper.js
"""

import secrets
import hashlib
import base64
import json
import re
import time
from urllib.parse import urlencode, urlparse, parse_qs
from typing import Dict, Optional, Tuple

import httpx

from .constants import (
    AUTHORIZE_URL,
    TOKEN_URL,
    CLIENT_ID,
    REDIRECT_URI,
    SCOPES,
    PROFILE_API_URL,
)
from .proxy import build_proxy_url


# ============================================================================
# PKCE 参数生成函数
# 参考: src/utils/oauthHelper.js 第 25-44 行
# ============================================================================


def generate_state() -> str:
    """
    生成随机的 state 参数

    Returns:
        str: base64url 编码的随机字符串

    参考: oauthHelper.js generateState() - 第 25-27 行
    """
    # 使用 secrets 模块生成加密安全的随机值
    # 对应 Node.js: crypto.randomBytes(32).toString('base64url')
    return secrets.token_urlsafe(32)


def generate_code_verifier() -> str:
    """
    生成随机的 code verifier（PKCE）

    Returns:
        str: base64url 编码的随机字符串

    参考: oauthHelper.js generateCodeVerifier() - 第 33-35 行
    """
    # 对应 Node.js: crypto.randomBytes(32).toString('base64url')
    return secrets.token_urlsafe(32)


def generate_code_challenge(code_verifier: str) -> str:
    """
    生成 code challenge（PKCE）

    Args:
        code_verifier: code verifier 字符串

    Returns:
        str: SHA256 哈希后的 base64url 编码字符串

    参考: oauthHelper.js generateCodeChallenge() - 第 42-44 行
    """
    # 对应 Node.js: crypto.createHash('sha256').update(codeVerifier).digest('base64url')

    # 1. 计算 SHA256 哈希
    sha256_hash = hashlib.sha256(code_verifier.encode('utf-8')).digest()

    # 2. Base64URL 编码（去除填充符 '='）
    base64_encoded = base64.urlsafe_b64encode(sha256_hash).decode('utf-8').rstrip('=')

    return base64_encoded


# ============================================================================
# 授权 URL 构建函数
# 参考: src/utils/oauthHelper.js 第 52-84 行
# ============================================================================


def build_auth_url(code_challenge: str, state: str) -> str:
    """
    构建 OAuth 授权 URL

    Args:
        code_challenge: PKCE code challenge
        state: state 参数

    Returns:
        str: 完整的授权 URL

    参考: oauthHelper.js generateAuthUrl() - 第 52-65 行
    """
    # 对应 Node.js 的 URLSearchParams
    params = {
        'code': 'true',
        'client_id': CLIENT_ID,
        'response_type': 'code',
        'redirect_uri': REDIRECT_URI,
        'scope': SCOPES,
        'code_challenge': code_challenge,
        'code_challenge_method': 'S256',
        'state': state,
    }

    query_string = urlencode(params)
    return f"{AUTHORIZE_URL}?{query_string}"


def generate_oauth_params() -> Dict[str, str]:
    """
    生成 OAuth 授权 URL 和相关参数

    Returns:
        dict: 包含 authUrl, codeVerifier, state, codeChallenge

    参考: oauthHelper.js generateOAuthParams() - 第 71-84 行
    """
    state = generate_state()
    code_verifier = generate_code_verifier()
    code_challenge = generate_code_challenge(code_verifier)
    auth_url = build_auth_url(code_challenge, state)

    return {
        'authUrl': auth_url,
        'codeVerifier': code_verifier,
        'state': state,
        'codeChallenge': code_challenge,
    }


# ============================================================================
# 授权码解析函数
# 参考: src/utils/oauthHelper.js 第 295-337 行
# ============================================================================


def parse_callback_url(input_str: str) -> str:
    """
    解析回调 URL 或授权码

    Args:
        input_str: 完整的回调 URL 或直接的授权码

    Returns:
        str: 授权码

    Raises:
        ValueError: 输入无效时抛出异常

    参考: oauthHelper.js parseCallbackUrl() - 第 295-337 行
    """
    if not input_str or not isinstance(input_str, str):
        raise ValueError('请提供有效的授权码或回调 URL')

    trimmed_input = input_str.strip()

    # 情况1: 尝试作为完整 URL 解析
    if trimmed_input.startswith('http://') or trimmed_input.startswith('https://'):
        try:
            parsed_url = urlparse(trimmed_input)
            query_params = parse_qs(parsed_url.query)

            # 获取 code 参数
            authorization_code = query_params.get('code', [None])[0]

            if not authorization_code:
                raise ValueError('回调 URL 中未找到授权码 (code 参数)')

            return authorization_code
        except ValueError as e:
            if '回调 URL 中未找到授权码' in str(e):
                raise
            raise ValueError('无效的 URL 格式，请检查回调 URL 是否正确')

    # 情况2: 直接的授权码（可能包含 URL fragments）
    # 参考 claude-code-login.js 的处理方式：移除 URL fragments 和参数
    # 对应 Node.js: trimmedInput.split('#')[0]?.split('&')[0] ?? trimmedInput
    cleaned_code = trimmed_input
    if '#' in cleaned_code:
        cleaned_code = cleaned_code.split('#')[0]
    if '&' in cleaned_code:
        cleaned_code = cleaned_code.split('&')[0]

    # 验证授权码格式
    if not cleaned_code or len(cleaned_code) < 10:
        raise ValueError('授权码格式无效，请确保复制了完整的 Authorization Code')

    # 基本格式验证：授权码应该只包含字母、数字、下划线、连字符
    valid_code_pattern = re.compile(r'^[A-Za-z0-9_-]+$')
    if not valid_code_pattern.match(cleaned_code):
        raise ValueError('授权码包含无效字符，请检查是否复制了正确的 Authorization Code')

    return cleaned_code


# ============================================================================
# Token 交换函数
# 参考: src/utils/oauthHelper.js 第 143-288 行
# ============================================================================


async def exchange_code_for_tokens(
    authorization_code: str,
    code_verifier: str,
    state: str,
    proxy_config: Optional[Dict] = None,
) -> Dict:
    """
    使用授权码交换访问令牌

    Args:
        authorization_code: 授权码
        code_verifier: PKCE code verifier
        state: state 参数
        proxy_config: 代理配置（可选）

    Returns:
        dict: Claude 格式的 token 响应

    Raises:
        Exception: Token 交换失败时抛出异常

    参考: oauthHelper.js exchangeCodeForTokens() - 第 143-288 行
    """
    # 清理授权码，移除 URL 片段
    # 对应 Node.js: authorizationCode.split('#')[0]?.split('&')[0] ?? authorizationCode
    cleaned_code = authorization_code
    if '#' in cleaned_code:
        cleaned_code = cleaned_code.split('#')[0]
    if '&' in cleaned_code:
        cleaned_code = cleaned_code.split('&')[0]

    # 构建请求参数
    params = {
        'grant_type': 'authorization_code',
        'client_id': CLIENT_ID,
        'code': cleaned_code,
        'redirect_uri': REDIRECT_URI,
        'code_verifier': code_verifier,
        'state': state,
    }

    # 构建请求头（严格按照原代码）
    # 参考: oauthHelper.js 第 176-184 行
    headers = {
        'Content-Type': 'application/json',
        'User-Agent': 'claude-cli/1.0.56 (external, cli)',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://claude.ai/',
        'Origin': 'https://claude.ai',
    }

    # 构建代理配置
    proxies = None
    if proxy_config:
        proxy_url = build_proxy_url(proxy_config)
        proxies = {
            'https://': proxy_url,
            'http://': proxy_url,
        }

    try:
        # 发送 Token 交换请求
        # 对应 Node.js: axios.post() with httpsAgent
        async with httpx.AsyncClient(proxies=proxies, timeout=30.0) as client:
            response = await client.post(
                TOKEN_URL,
                json=params,  # httpx 会自动设置 Content-Type: application/json
                headers=headers,
            )

            # 检查响应状态
            response.raise_for_status()

            data = response.json()

            # 返回 Claude 格式的 token 数据
            # 参考: oauthHelper.js 第 216-222 行
            # 对应 Node.js: (Math.floor(Date.now() / 1000) + data.expires_in) * 1000
            result = {
                'accessToken': data['access_token'],
                'refreshToken': data['refresh_token'],
                'expiresAt': (int(time.time()) + int(data['expires_in'])) * 1000,
                'scopes': data.get('scope', 'user:inference user:profile').split(' '),
                'isMax': True,
            }

            # 如果响应中包含套餐信息，添加到返回结果中
            # 参考: oauthHelper.js 第 225-235 行
            if any(key in data for key in ['subscription', 'plan', 'tier', 'account_type']):
                result['subscriptionInfo'] = {
                    'subscription': data.get('subscription'),
                    'plan': data.get('plan'),
                    'tier': data.get('tier'),
                    'accountType': data.get('account_type'),
                    'features': data.get('features'),
                    'limits': data.get('limits'),
                }

            return result

    except httpx.HTTPStatusError as error:
        # 处理 HTTP 错误响应
        # 参考: oauthHelper.js 第 239-270 行
        status = error.response.status_code

        try:
            error_data = error.response.json()
        except Exception:
            error_data = error.response.text

        # 构建错误消息
        error_message = f"HTTP {status}"

        if isinstance(error_data, dict):
            if 'error' in error_data:
                error_message += f": {error_data['error']}"
                if 'error_description' in error_data:
                    error_message += f" - {error_data['error_description']}"
            else:
                error_message += f": {json.dumps(error_data)}"
        elif isinstance(error_data, str) and error_data:
            error_message += f": {error_data}"

        raise Exception(f"Token exchange failed: {error_message}")

    except httpx.RequestError as error:
        # 处理网络错误
        # 参考: oauthHelper.js 第 271-278 行
        raise Exception(
            'Token exchange failed: No response from server (network error or timeout)'
        ) from error

    except Exception as error:
        # 处理其他错误
        # 参考: oauthHelper.js 第 279-286 行
        raise Exception(f"Token exchange failed: {str(error)}") from error


# ============================================================================
# 用户信息查询函数
# 参考: src/services/claudeAccountService.js 第 1963-2044 行
# ============================================================================


async def fetch_profile_info(
    access_token: str,
    proxy_config: Optional[Dict] = None,
) -> Dict:
    """
    查询用户 Profile 信息

    Args:
        access_token: OAuth 访问令牌
        proxy_config: 代理配置（可选）

    Returns:
        dict: 用户信息，包含 email、accountType 等

    Raises:
        Exception: 查询失败时抛出异常

    参考: claudeAccountService.js updateAccountProfile() - 第 1963-2044 行
    """
    # 构建请求头
    # 参考: claudeAccountService.js 第 1964-1970 行
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'claude-cli/1.0.56 (external, cli)',
        'Accept-Language': 'en-US,en;q=0.9',
    }

    # 构建代理配置
    proxies = None
    if proxy_config:
        proxy_url = build_proxy_url(proxy_config)
        proxies = {
            'https://': proxy_url,
            'http://': proxy_url,
        }

    try:
        # 发送 Profile API 请求
        # 参考: claudeAccountService.js 第 1963 行
        async with httpx.AsyncClient(proxies=proxies, timeout=15.0) as client:
            response = await client.get(
                PROFILE_API_URL,
                headers=headers,
            )

            # 检查响应状态
            if response.status_code == 401:
                raise Exception('Profile API returned 401 - token may be invalid')
            elif response.status_code == 403:
                raise Exception('Profile API returned 403 - insufficient permissions')

            response.raise_for_status()

            profile_data = response.json()

            # 构建订阅信息
            # 参考: claudeAccountService.js 第 1986-2012 行
            account = profile_data.get('account', {})
            organization = profile_data.get('organization', {})

            has_claude_max = account.get('has_claude_max', False)
            has_claude_pro = account.get('has_claude_pro', False)

            # 判断账号类型
            if has_claude_max:
                account_type = 'Claude Max'
            elif has_claude_pro:
                account_type = 'Claude Pro'
            else:
                account_type = 'Free'

            subscription_info = {
                # 账号信息
                'email': account.get('email'),
                'fullName': account.get('full_name'),
                'displayName': account.get('display_name'),
                'hasClaudeMax': has_claude_max,
                'hasClaudePro': has_claude_pro,
                'accountUuid': account.get('uuid'),
                'accountType': account_type,

                # 组织信息
                'organizationName': organization.get('name'),
                'organizationUuid': organization.get('uuid'),
                'billingType': organization.get('billing_type'),
                'rateLimitTier': organization.get('rate_limit_tier'),
                'organizationType': organization.get('organization_type'),
            }

            return subscription_info

    except httpx.HTTPStatusError as error:
        status = error.response.status_code
        raise Exception(f"Failed to fetch profile with status: {status}") from error

    except httpx.RequestError as error:
        raise Exception('Profile API network error or timeout') from error

    except Exception as error:
        raise Exception(f"Failed to fetch profile: {str(error)}") from error
