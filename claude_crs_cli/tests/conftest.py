"""
pytest 配置和共享 fixtures
"""

import pytest
import json
from pathlib import Path


# ============================================================
# 代理配置 Fixtures
# ============================================================

@pytest.fixture
def valid_socks5_proxy():
    """有效的 SOCKS5 代理配置（无认证）"""
    return {
        "type": "socks5",
        "host": "127.0.0.1",
        "port": 1080,
    }


@pytest.fixture
def valid_http_proxy():
    """有效的 HTTP 代理配置（无认证）"""
    return {
        "type": "http",
        "host": "127.0.0.1",
        "port": 8080,
    }


@pytest.fixture
def socks5_proxy_with_auth():
    """带认证的 SOCKS5 代理配置"""
    return {
        "type": "socks5",
        "host": "proxy.example.com",
        "port": 1080,
        "username": "testuser",
        "password": "testpass123",
    }


@pytest.fixture
def http_proxy_with_special_chars():
    """带特殊字符认证的 HTTP 代理配置（测试 URL 编码）"""
    return {
        "type": "http",
        "host": "proxy.example.com",
        "port": 8080,
        "username": "user@domain.com",
        "password": "p@ss:w0rd!",
    }


@pytest.fixture
def invalid_proxy_missing_fields():
    """无效配置：缺少必要字段"""
    return {
        "type": "socks5",
        # 缺少 host 和 port
    }


@pytest.fixture
def invalid_proxy_bad_port():
    """无效配置：端口号超出范围"""
    return {
        "type": "http",
        "host": "127.0.0.1",
        "port": 99999,  # 超出 65535 范围
    }


# ============================================================
# 真实静态代理 Fixtures（你提供的）
# ============================================================

@pytest.fixture
def real_proxy_taiwan():
    """真实代理：台湾台北 (202.160.84.39:443)"""
    return {
        "host": "202.160.84.39",
        "port": 443,
        "username": "litong",
        "password": "litong318",
    }


@pytest.fixture
def real_proxy_uk():
    """真实代理：英国伦敦 (86.53.45.246:443)"""
    return {
        "host": "86.53.45.246",
        "port": 443,
        "username": "mfpw93061",
        "password": "UKzxquCR",
    }


# ============================================================
# 存储模块 Fixtures
# ============================================================

@pytest.fixture
def mock_auth_data():
    """模拟的认证数据"""
    return {
        "accessToken": "mock_access_token_12345",
        "refreshToken": "mock_refresh_token_67890",
        "expiresAt": 1728584400000,  # 2024-10-10 15:00:00
        "email": "test@example.com",
        "codeVerifier": "mock_code_verifier",
        "proxy": {
            "type": "socks5",
            "host": "127.0.0.1",
            "port": 1080,
        },
    }


@pytest.fixture
def temp_auth_file(tmp_path, mock_auth_data):
    """
    创建临时的 auth.json 文件

    Args:
        tmp_path: pytest 提供的临时目录
        mock_auth_data: 模拟认证数据

    Returns:
        Path: 临时认证文件路径
    """
    auth_file = tmp_path / "auth.json"
    with open(auth_file, "w", encoding="utf-8") as f:
        json.dump(mock_auth_data, f, indent=2)
    return auth_file


@pytest.fixture
def invalid_json_file(tmp_path):
    """创建包含无效 JSON 的文件"""
    invalid_file = tmp_path / "invalid.json"
    with open(invalid_file, "w", encoding="utf-8") as f:
        f.write("{ invalid json content }")
    return invalid_file
