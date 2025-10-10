"""
代理模块测试
测试 src/proxy.py 中的所有函数
"""

import pytest
from src.proxy import (
    validate_proxy_config,
    build_proxy_url,
    build_httpx_proxies,
    mask_proxy_info,
    get_proxy_description,
)


# ============================================================
# validate_proxy_config() 测试
# ============================================================

class TestValidateProxyConfig:
    """测试代理配置验证函数"""

    @pytest.mark.unit
    def test_valid_socks5_proxy(self, valid_socks5_proxy):
        """测试有效的 SOCKS5 代理配置"""
        assert validate_proxy_config(valid_socks5_proxy) is True

    @pytest.mark.unit
    def test_valid_http_proxy(self, valid_http_proxy):
        """测试有效的 HTTP 代理配置"""
        assert validate_proxy_config(valid_http_proxy) is True

    @pytest.mark.unit
    def test_valid_https_proxy(self):
        """测试有效的 HTTPS 代理配置"""
        config = {"type": "https", "host": "proxy.example.com", "port": 8443}
        assert validate_proxy_config(config) is True

    @pytest.mark.unit
    def test_valid_proxy_with_auth(self, socks5_proxy_with_auth):
        """测试带认证的有效代理配置"""
        assert validate_proxy_config(socks5_proxy_with_auth) is True

    @pytest.mark.unit
    def test_none_config(self):
        """测试 None 配置"""
        assert validate_proxy_config(None) is False

    @pytest.mark.unit
    def test_empty_dict_config(self):
        """测试空字典配置"""
        assert validate_proxy_config({}) is False

    @pytest.mark.unit
    def test_missing_required_fields(self, invalid_proxy_missing_fields):
        """测试缺少必要字段"""
        assert validate_proxy_config(invalid_proxy_missing_fields) is False

    @pytest.mark.unit
    def test_missing_type_field(self):
        """测试缺少 type 字段"""
        config = {"host": "127.0.0.1", "port": 1080}
        assert validate_proxy_config(config) is False

    @pytest.mark.unit
    def test_missing_host_field(self):
        """测试缺少 host 字段"""
        config = {"type": "socks5", "port": 1080}
        assert validate_proxy_config(config) is False

    @pytest.mark.unit
    def test_missing_port_field(self):
        """测试缺少 port 字段"""
        config = {"type": "socks5", "host": "127.0.0.1"}
        assert validate_proxy_config(config) is False

    @pytest.mark.unit
    def test_unsupported_proxy_type(self):
        """测试不支持的代理类型"""
        config = {"type": "ftp", "host": "127.0.0.1", "port": 21}
        assert validate_proxy_config(config) is False

    @pytest.mark.unit
    @pytest.mark.parametrize("port", [-1, 0, 65536, 99999])
    def test_invalid_port_range(self, port):
        """测试无效的端口范围"""
        config = {"type": "socks5", "host": "127.0.0.1", "port": port}
        assert validate_proxy_config(config) is False

    @pytest.mark.unit
    def test_port_as_string_valid(self):
        """测试端口号为字符串（可转换）"""
        config = {"type": "socks5", "host": "127.0.0.1", "port": "1080"}
        assert validate_proxy_config(config) is True

    @pytest.mark.unit
    def test_port_as_string_invalid(self):
        """测试端口号为无效字符串"""
        config = {"type": "socks5", "host": "127.0.0.1", "port": "invalid"}
        assert validate_proxy_config(config) is False


# ============================================================
# build_proxy_url() 测试
# ============================================================

class TestBuildProxyUrl:
    """测试代理 URL 构建函数"""

    @pytest.mark.unit
    def test_socks5_without_auth(self, valid_socks5_proxy):
        """测试 SOCKS5 代理 URL 构建（无认证）"""
        url = build_proxy_url(valid_socks5_proxy)
        assert url == "socks5h://127.0.0.1:1080"

    @pytest.mark.unit
    def test_http_without_auth(self, valid_http_proxy):
        """测试 HTTP 代理 URL 构建（无认证）"""
        url = build_proxy_url(valid_http_proxy)
        assert url == "http://127.0.0.1:8080"

    @pytest.mark.unit
    def test_https_without_auth(self):
        """测试 HTTPS 代理 URL 构建（无认证）"""
        config = {"type": "https", "host": "proxy.example.com", "port": 8443}
        url = build_proxy_url(config)
        assert url == "https://proxy.example.com:8443"

    @pytest.mark.unit
    def test_socks5_with_auth(self, socks5_proxy_with_auth):
        """测试 SOCKS5 代理 URL 构建（带认证）"""
        url = build_proxy_url(socks5_proxy_with_auth)
        assert url == "socks5h://testuser:testpass123@proxy.example.com:1080"

    @pytest.mark.unit
    def test_http_with_auth(self):
        """测试 HTTP 代理 URL 构建（带认证）"""
        config = {
            "type": "http",
            "host": "proxy.example.com",
            "port": 8080,
            "username": "user",
            "password": "pass",
        }
        url = build_proxy_url(config)
        assert url == "http://user:pass@proxy.example.com:8080"

    @pytest.mark.unit
    def test_url_encoding_special_chars(self, http_proxy_with_special_chars):
        """测试 URL 编码特殊字符（@ : !）"""
        url = build_proxy_url(http_proxy_with_special_chars)
        # user@domain.com -> user%40domain.com
        # p@ss:w0rd! -> p%40ss%3Aw0rd%21
        assert "user%40domain.com" in url
        assert "p%40ss%3Aw0rd%21" in url

    @pytest.mark.unit
    def test_none_config(self):
        """测试 None 配置返回 None"""
        assert build_proxy_url(None) is None

    @pytest.mark.unit
    def test_invalid_config(self, invalid_proxy_missing_fields):
        """测试无效配置返回 None"""
        assert build_proxy_url(invalid_proxy_missing_fields) is None

    @pytest.mark.unit
    def test_partial_auth_username_only(self):
        """测试只有用户名没有密码（不应包含认证）"""
        config = {
            "type": "socks5",
            "host": "127.0.0.1",
            "port": 1080,
            "username": "user",
            # 缺少 password
        }
        url = build_proxy_url(config)
        assert url == "socks5h://127.0.0.1:1080"
        assert "@" not in url

    @pytest.mark.unit
    def test_partial_auth_password_only(self):
        """测试只有密码没有用户名（不应包含认证）"""
        config = {
            "type": "socks5",
            "host": "127.0.0.1",
            "port": 1080,
            # 缺少 username
            "password": "pass",
        }
        url = build_proxy_url(config)
        assert url == "socks5h://127.0.0.1:1080"
        assert "@" not in url


# ============================================================
# 真实静态代理测试（你提供的 IP）
# ============================================================

class TestRealStaticProxies:
    """测试真实的静态代理 IP（台湾和英国）"""

    @pytest.mark.real_proxy
    @pytest.mark.parametrize("proxy_type", ["socks5", "http", "https"])
    def test_taiwan_proxy_all_protocols(self, real_proxy_taiwan, proxy_type):
        """测试台湾代理（202.160.84.39:443）- 三种协议"""
        config = {**real_proxy_taiwan, "type": proxy_type}
        url = build_proxy_url(config)

        # 验证 URL 格式
        if proxy_type == "socks5":
            assert url.startswith("socks5h://")
        else:
            assert url.startswith(f"{proxy_type}://")

        # 验证包含正确的 host 和 port
        assert "202.160.84.39:443" in url

        # 验证包含认证信息（URL 编码）
        assert "litong" in url
        assert "litong318" in url

    @pytest.mark.real_proxy
    @pytest.mark.parametrize("proxy_type", ["socks5", "http", "https"])
    def test_uk_proxy_all_protocols(self, real_proxy_uk, proxy_type):
        """测试英国代理（86.53.45.246:443）- 三种协议"""
        config = {**real_proxy_uk, "type": proxy_type}
        url = build_proxy_url(config)

        # 验证 URL 格式
        if proxy_type == "socks5":
            assert url.startswith("socks5h://")
        else:
            assert url.startswith(f"{proxy_type}://")

        # 验证包含正确的 host 和 port
        assert "86.53.45.246:443" in url

        # 验证包含认证信息（URL 编码）
        assert "mfpw93061" in url
        assert "UKzxquCR" in url

    @pytest.mark.real_proxy
    def test_taiwan_proxy_socks5_exact_url(self, real_proxy_taiwan):
        """测试台湾代理 SOCKS5 URL 精确匹配"""
        config = {**real_proxy_taiwan, "type": "socks5"}
        url = build_proxy_url(config)
        expected = "socks5h://litong:litong318@202.160.84.39:443"
        assert url == expected

    @pytest.mark.real_proxy
    def test_uk_proxy_http_exact_url(self, real_proxy_uk):
        """测试英国代理 HTTP URL 精确匹配"""
        config = {**real_proxy_uk, "type": "http"}
        url = build_proxy_url(config)
        expected = "http://mfpw93061:UKzxquCR@86.53.45.246:443"
        assert url == expected


# ============================================================
# build_httpx_proxies() 测试
# ============================================================

class TestBuildHttpxProxies:
    """测试 httpx 代理配置构建函数"""

    @pytest.mark.unit
    def test_valid_proxy_returns_dict(self, valid_socks5_proxy):
        """测试有效代理返回字典"""
        proxies = build_httpx_proxies(valid_socks5_proxy)
        assert isinstance(proxies, dict)
        assert "https://" in proxies
        assert "http://" in proxies

    @pytest.mark.unit
    def test_socks5_proxy_format(self, valid_socks5_proxy):
        """测试 SOCKS5 代理格式"""
        proxies = build_httpx_proxies(valid_socks5_proxy)
        assert proxies["https://"] == "socks5h://127.0.0.1:1080"
        assert proxies["http://"] == "socks5h://127.0.0.1:1080"

    @pytest.mark.unit
    def test_http_proxy_format(self, valid_http_proxy):
        """测试 HTTP 代理格式"""
        proxies = build_httpx_proxies(valid_http_proxy)
        assert proxies["https://"] == "http://127.0.0.1:8080"
        assert proxies["http://"] == "http://127.0.0.1:8080"

    @pytest.mark.unit
    def test_none_config_returns_none(self):
        """测试 None 配置返回 None"""
        assert build_httpx_proxies(None) is None

    @pytest.mark.unit
    def test_invalid_config_returns_none(self, invalid_proxy_missing_fields):
        """测试无效配置返回 None"""
        assert build_httpx_proxies(invalid_proxy_missing_fields) is None


# ============================================================
# mask_proxy_info() 测试
# ============================================================

class TestMaskProxyInfo:
    """测试代理信息脱敏函数"""

    @pytest.mark.unit
    def test_proxy_without_auth(self, valid_socks5_proxy):
        """测试无认证代理的脱敏信息"""
        masked = mask_proxy_info(valid_socks5_proxy)
        assert "socks5://127.0.0.1:1080" == masked
        assert "(auth:" not in masked

    @pytest.mark.unit
    def test_proxy_with_auth(self, socks5_proxy_with_auth):
        """测试带认证代理的脱敏信息"""
        masked = mask_proxy_info(socks5_proxy_with_auth)
        assert "socks5://proxy.example.com:1080" in masked
        assert "(auth:" in masked
        # 用户名脱敏：testuser -> t******r
        assert "t******r" in masked
        # 密码脱敏：全部星号
        assert "********" in masked

    @pytest.mark.unit
    def test_short_username_no_masking(self):
        """测试短用户名不脱敏"""
        config = {
            "type": "http",
            "host": "127.0.0.1",
            "port": 8080,
            "username": "ab",  # 长度 <= 2
            "password": "pass",
        }
        masked = mask_proxy_info(config)
        assert "ab:" in masked  # 短用户名不脱敏

    @pytest.mark.unit
    def test_long_password_max_asterisks(self):
        """测试长密码最多显示 8 个星号"""
        config = {
            "type": "http",
            "host": "127.0.0.1",
            "port": 8080,
            "username": "user",
            "password": "verylongpassword123456",  # 超过 8 位
        }
        masked = mask_proxy_info(config)
        # 密码应该显示 8 个星号（而不是 22 个）
        assert "********" in masked
        assert "*********" not in masked  # 不应超过 8 个

    @pytest.mark.unit
    def test_none_config(self):
        """测试 None 配置"""
        assert mask_proxy_info(None) == "No proxy"

    @pytest.mark.unit
    def test_invalid_config(self, invalid_proxy_missing_fields):
        """测试无效配置"""
        assert mask_proxy_info(invalid_proxy_missing_fields) == "Invalid proxy config"


# ============================================================
# get_proxy_description() 测试
# ============================================================

class TestGetProxyDescription:
    """测试代理描述获取函数"""

    @pytest.mark.unit
    def test_proxy_without_auth(self, valid_socks5_proxy):
        """测试无认证代理的描述"""
        desc = get_proxy_description(valid_socks5_proxy)
        assert desc == "socks5://127.0.0.1:1080"

    @pytest.mark.unit
    def test_proxy_with_auth(self, socks5_proxy_with_auth):
        """测试带认证代理的描述"""
        desc = get_proxy_description(socks5_proxy_with_auth)
        assert desc == "socks5://proxy.example.com:1080 (with auth)"

    @pytest.mark.unit
    def test_none_config(self):
        """测试 None 配置"""
        assert get_proxy_description(None) == "No proxy"

    @pytest.mark.unit
    def test_invalid_config(self, invalid_proxy_missing_fields):
        """测试无效配置"""
        assert get_proxy_description(invalid_proxy_missing_fields) == "Invalid proxy config"
