"""
auth.py 模块的单元测试
测试 OAuth 2.0 PKCE 授权流程的各个组件
"""

import pytest
import re
import time
from unittest.mock import Mock, patch, AsyncMock
from urllib.parse import parse_qs, urlparse

from src.auth import (
    generate_state,
    generate_code_verifier,
    generate_code_challenge,
    build_auth_url,
    generate_oauth_params,
    parse_callback_url,
    exchange_code_for_tokens,
    fetch_profile_info,
)
from src.constants import (
    AUTHORIZE_URL,
    CLIENT_ID,
    REDIRECT_URI,
    SCOPES,
)


# ============================================================================
# 测试 PKCE 参数生成
# ============================================================================


@pytest.mark.unit
def test_generate_state():
    """测试 state 参数生成"""
    state = generate_state()

    # 验证长度（base64url 编码后应该约为 43 字符）
    assert len(state) >= 32
    assert len(state) <= 64

    # 验证字符集（base64url: A-Z, a-z, 0-9, -, _）
    assert re.match(r'^[A-Za-z0-9_-]+$', state)

    # 验证唯一性（两次生成应该不同）
    state2 = generate_state()
    assert state != state2


@pytest.mark.unit
def test_generate_code_verifier():
    """测试 code_verifier 生成"""
    code_verifier = generate_code_verifier()

    # 验证长度（PKCE 标准要求 43-128 字符）
    assert len(code_verifier) >= 32
    assert len(code_verifier) <= 128

    # 验证字符集（base64url）
    assert re.match(r'^[A-Za-z0-9_-]+$', code_verifier)

    # 验证唯一性
    code_verifier2 = generate_code_verifier()
    assert code_verifier != code_verifier2


@pytest.mark.unit
def test_generate_code_challenge():
    """测试 code_challenge 生成"""
    code_verifier = "test_code_verifier_12345678"
    code_challenge = generate_code_challenge(code_verifier)

    # 验证长度（SHA256 base64url 编码应该是 43 字符）
    assert len(code_challenge) == 43

    # 验证字符集
    assert re.match(r'^[A-Za-z0-9_-]+$', code_challenge)

    # 验证确定性（相同输入应产生相同输出）
    code_challenge2 = generate_code_challenge(code_verifier)
    assert code_challenge == code_challenge2

    # 验证不同输入产生不同输出
    different_verifier = "different_code_verifier"
    different_challenge = generate_code_challenge(different_verifier)
    assert code_challenge != different_challenge


# ============================================================================
# 测试授权 URL 构建
# ============================================================================


@pytest.mark.unit
def test_build_auth_url():
    """测试授权 URL 构建"""
    code_challenge = "test_challenge_123"
    state = "test_state_456"

    auth_url = build_auth_url(code_challenge, state)

    # 验证 URL 格式
    assert auth_url.startswith(AUTHORIZE_URL)
    assert "?" in auth_url

    # 解析 URL 参数
    parsed_url = urlparse(auth_url)
    query_params = parse_qs(parsed_url.query)

    # 验证必需参数
    assert query_params['code'] == ['true']
    assert query_params['client_id'] == [CLIENT_ID]
    assert query_params['response_type'] == ['code']
    assert query_params['redirect_uri'] == [REDIRECT_URI]
    assert query_params['scope'] == [SCOPES]
    assert query_params['code_challenge'] == [code_challenge]
    assert query_params['code_challenge_method'] == ['S256']
    assert query_params['state'] == [state]


@pytest.mark.unit
def test_generate_oauth_params():
    """测试完整的 OAuth 参数生成"""
    params = generate_oauth_params()

    # 验证返回的字段
    assert 'authUrl' in params
    assert 'codeVerifier' in params
    assert 'state' in params
    assert 'codeChallenge' in params

    # 验证 authUrl 格式
    assert params['authUrl'].startswith(AUTHORIZE_URL)

    # 验证参数长度
    assert len(params['codeVerifier']) >= 32
    assert len(params['state']) >= 32
    assert len(params['codeChallenge']) == 43

    # 验证 code_challenge 是由 code_verifier 生成的
    expected_challenge = generate_code_challenge(params['codeVerifier'])
    assert params['codeChallenge'] == expected_challenge


# ============================================================================
# 测试授权码解析
# ============================================================================


@pytest.mark.unit
def test_parse_callback_url_with_full_url():
    """测试解析完整的回调 URL"""
    callback_url = f"{REDIRECT_URI}?code=test_authorization_code_123&state=xyz"
    code = parse_callback_url(callback_url)

    assert code == "test_authorization_code_123"


@pytest.mark.unit
def test_parse_callback_url_with_direct_code():
    """测试解析直接的授权码"""
    code_input = "test_authorization_code_456"
    code = parse_callback_url(code_input)

    assert code == "test_authorization_code_456"


@pytest.mark.unit
def test_parse_callback_url_with_fragments():
    """测试解析包含 URL fragments 的授权码"""
    # 模拟 Node.js 代码的处理：移除 # 和 & 后的内容
    code_input = "test_code_789#fragment"
    code = parse_callback_url(code_input)

    assert code == "test_code_789"

    code_input2 = "test_code_abc&extra_param=value"
    code2 = parse_callback_url(code_input2)

    assert code2 == "test_code_abc"


@pytest.mark.unit
def test_parse_callback_url_invalid_inputs():
    """测试无效输入的错误处理"""
    # 空字符串
    with pytest.raises(ValueError, match="请提供有效的授权码"):
        parse_callback_url("")

    # None
    with pytest.raises(ValueError, match="请提供有效的授权码"):
        parse_callback_url(None)

    # URL 但没有 code 参数
    with pytest.raises(ValueError, match="回调 URL 中未找到授权码"):
        parse_callback_url(f"{REDIRECT_URI}?state=xyz")

    # 太短的授权码
    with pytest.raises(ValueError, match="授权码格式无效"):
        parse_callback_url("short")

    # 包含无效字符
    with pytest.raises(ValueError, match="授权码包含无效字符"):
        parse_callback_url("invalid code with spaces")


# ============================================================================
# 测试 Token 交换（Mock 测试）
# ============================================================================


@pytest.mark.unit
@pytest.mark.asyncio
async def test_exchange_code_for_tokens_success():
    """测试 Token 交换成功的情况"""
    # Mock 响应数据
    mock_response_data = {
        'access_token': 'mock_access_token_123',
        'refresh_token': 'mock_refresh_token_456',
        'expires_in': 3600,
        'scope': 'user:inference user:profile',
    }

    # Mock httpx.AsyncClient
    with patch('src.auth.httpx.AsyncClient') as mock_client:
        # 配置 mock
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = mock_response_data
        mock_response.raise_for_status = Mock()

        mock_post = AsyncMock(return_value=mock_response)
        mock_client_instance = Mock()
        mock_client_instance.post = mock_post
        mock_client_instance.__aenter__ = AsyncMock(return_value=mock_client_instance)
        mock_client_instance.__aexit__ = AsyncMock(return_value=None)
        mock_client.return_value = mock_client_instance

        # 执行函数
        result = await exchange_code_for_tokens(
            authorization_code="test_code",
            code_verifier="test_verifier",
            state="test_state",
            proxy_config=None,
        )

        # 验证结果
        assert result['accessToken'] == 'mock_access_token_123'
        assert result['refreshToken'] == 'mock_refresh_token_456'
        assert 'expiresAt' in result
        assert result['scopes'] == ['user:inference', 'user:profile']
        assert result['isMax'] is True


@pytest.mark.unit
@pytest.mark.asyncio
async def test_exchange_code_for_tokens_with_proxy():
    """测试使用代理进行 Token 交换"""
    # Mock 响应数据
    mock_response_data = {
        'access_token': 'token_with_proxy',
        'refresh_token': 'refresh_with_proxy',
        'expires_in': 3600,
        'scope': 'user:inference user:profile',
    }

    proxy_config = {
        'type': 'socks5',
        'host': '127.0.0.1',
        'port': 1080,
    }

    with patch('src.auth.httpx.AsyncClient') as mock_client:
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = mock_response_data
        mock_response.raise_for_status = Mock()

        mock_post = AsyncMock(return_value=mock_response)
        mock_client_instance = Mock()
        mock_client_instance.post = mock_post
        mock_client_instance.__aenter__ = AsyncMock(return_value=mock_client_instance)
        mock_client_instance.__aexit__ = AsyncMock(return_value=None)
        mock_client.return_value = mock_client_instance

        result = await exchange_code_for_tokens(
            authorization_code="test_code",
            code_verifier="test_verifier",
            state="test_state",
            proxy_config=proxy_config,
        )

        # 验证 httpx.AsyncClient 被调用时传入了代理配置
        mock_client.assert_called_once()
        call_kwargs = mock_client.call_args[1]
        assert 'proxies' in call_kwargs
        # 注意：socks5h 表示 DNS 解析在代理服务器端，这是正确的
        assert call_kwargs['proxies']['https://'] == 'socks5h://127.0.0.1:1080'


@pytest.mark.unit
@pytest.mark.asyncio
async def test_exchange_code_for_tokens_http_error():
    """测试 Token 交换 HTTP 错误处理"""
    with patch('src.auth.httpx.AsyncClient') as mock_client:
        # 模拟 HTTP 错误
        from httpx import HTTPStatusError, Request, Response

        mock_response = Response(
            status_code=400,
            json={'error': 'invalid_grant', 'error_description': 'Invalid authorization code'},
        )
        mock_request = Request('POST', 'https://example.com')

        mock_post = AsyncMock(
            side_effect=HTTPStatusError(
                'Bad Request', request=mock_request, response=mock_response
            )
        )

        mock_client_instance = Mock()
        mock_client_instance.post = mock_post
        mock_client_instance.__aenter__ = AsyncMock(return_value=mock_client_instance)
        mock_client_instance.__aexit__ = AsyncMock(return_value=None)
        mock_client.return_value = mock_client_instance

        # 验证异常被正确处理
        with pytest.raises(Exception, match="Token exchange failed: HTTP 400"):
            await exchange_code_for_tokens(
                authorization_code="invalid_code",
                code_verifier="test_verifier",
                state="test_state",
                proxy_config=None,
            )


# ============================================================================
# 测试 Profile 信息查询（Mock 测试）
# ============================================================================


@pytest.mark.unit
@pytest.mark.asyncio
async def test_fetch_profile_info_success():
    """测试 Profile 信息查询成功"""
    mock_profile_data = {
        'account': {
            'email': 'test@example.com',
            'full_name': 'Test User',
            'has_claude_max': True,
            'has_claude_pro': False,
            'uuid': 'test-uuid-123',
        },
        'organization': {
            'name': 'Test Org',
            'uuid': 'org-uuid-456',
        },
    }

    with patch('src.auth.httpx.AsyncClient') as mock_client:
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = mock_profile_data
        mock_response.raise_for_status = Mock()

        mock_get = AsyncMock(return_value=mock_response)
        mock_client_instance = Mock()
        mock_client_instance.get = mock_get
        mock_client_instance.__aenter__ = AsyncMock(return_value=mock_client_instance)
        mock_client_instance.__aexit__ = AsyncMock(return_value=None)
        mock_client.return_value = mock_client_instance

        result = await fetch_profile_info(
            access_token="test_token",
            proxy_config=None,
        )

        # 验证结果
        assert result['email'] == 'test@example.com'
        assert result['fullName'] == 'Test User'
        assert result['accountType'] == 'Claude Max'
        assert result['hasClaudeMax'] is True
        assert result['hasClaudePro'] is False


@pytest.mark.unit
@pytest.mark.asyncio
async def test_fetch_profile_info_pro_account():
    """测试 Claude Pro 账户的 Profile 信息"""
    mock_profile_data = {
        'account': {
            'email': 'pro@example.com',
            'has_claude_max': False,
            'has_claude_pro': True,
        },
        'organization': {},
    }

    with patch('src.auth.httpx.AsyncClient') as mock_client:
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = mock_profile_data
        mock_response.raise_for_status = Mock()

        mock_get = AsyncMock(return_value=mock_response)
        mock_client_instance = Mock()
        mock_client_instance.get = mock_get
        mock_client_instance.__aenter__ = AsyncMock(return_value=mock_client_instance)
        mock_client_instance.__aexit__ = AsyncMock(return_value=None)
        mock_client.return_value = mock_client_instance

        result = await fetch_profile_info(
            access_token="test_token",
            proxy_config=None,
        )

        assert result['accountType'] == 'Claude Pro'


@pytest.mark.unit
@pytest.mark.asyncio
async def test_fetch_profile_info_free_account():
    """测试免费账户的 Profile 信息"""
    mock_profile_data = {
        'account': {
            'email': 'free@example.com',
            'has_claude_max': False,
            'has_claude_pro': False,
        },
        'organization': {},
    }

    with patch('src.auth.httpx.AsyncClient') as mock_client:
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = mock_profile_data
        mock_response.raise_for_status = Mock()

        mock_get = AsyncMock(return_value=mock_response)
        mock_client_instance = Mock()
        mock_client_instance.get = mock_get
        mock_client_instance.__aenter__ = AsyncMock(return_value=mock_client_instance)
        mock_client_instance.__aexit__ = AsyncMock(return_value=None)
        mock_client.return_value = mock_client_instance

        result = await fetch_profile_info(
            access_token="test_token",
            proxy_config=None,
        )

        assert result['accountType'] == 'Free'


@pytest.mark.unit
@pytest.mark.asyncio
async def test_fetch_profile_info_401_error():
    """测试 Profile API 返回 401 错误"""
    with patch('src.auth.httpx.AsyncClient') as mock_client:
        mock_response = Mock()
        mock_response.status_code = 401

        mock_get = AsyncMock(return_value=mock_response)
        mock_client_instance = Mock()
        mock_client_instance.get = mock_get
        mock_client_instance.__aenter__ = AsyncMock(return_value=mock_client_instance)
        mock_client_instance.__aexit__ = AsyncMock(return_value=None)
        mock_client.return_value = mock_client_instance

        with pytest.raises(Exception, match="401 - token may be invalid"):
            await fetch_profile_info(
                access_token="invalid_token",
                proxy_config=None,
            )


# ============================================================================
# 集成测试标记（需要真实代理才能运行）
# ============================================================================


@pytest.mark.integration
@pytest.mark.skip(reason="需要真实的 OAuth 授权码和代理配置")
@pytest.mark.asyncio
async def test_full_oauth_flow():
    """完整的 OAuth 流程集成测试（需要手动运行）"""
    # 生成 OAuth 参数
    params = generate_oauth_params()

    # 打印授权 URL（需要用户手动访问）
    print(f"\n请访问以下 URL 进行授权：\n{params['authUrl']}\n")

    # 这里需要用户手动输入授权码
    # authorization_code = input("请输入授权码: ")

    # 测试代理配置
    # proxy_config = {
    #     'type': 'socks5',
    #     'host': '127.0.0.1',
    #     'port': 1080,
    # }

    # # 交换 Token
    # token_data = await exchange_code_for_tokens(
    #     authorization_code,
    #     params['codeVerifier'],
    #     params['state'],
    #     proxy_config,
    # )

    # # 查询 Profile
    # profile_info = await fetch_profile_info(
    #     token_data['accessToken'],
    #     proxy_config,
    # )

    # print(f"\n授权成功！")
    # print(f"邮箱: {profile_info['email']}")
    # print(f"账户类型: {profile_info['accountType']}")

    pass
