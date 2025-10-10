"""
存储模块测试
测试 src/storage.py 中的所有函数
"""

import pytest
import json
import os
from pathlib import Path
from unittest.mock import patch

from src.storage import (
    get_auth_file_path,
    auth_exists,
    load_auth,
    save_auth,
    clear_auth,
    update_tokens,
)


# ============================================================
# get_auth_file_path() 测试
# ============================================================

class TestGetAuthFilePath:
    """测试认证文件路径获取函数"""

    @pytest.mark.unit
    def test_returns_path_object(self):
        """测试返回 Path 对象"""
        path = get_auth_file_path()
        assert isinstance(path, Path)

    @pytest.mark.unit
    def test_path_ends_with_auth_json(self):
        """测试路径以 auth.json 结尾"""
        path = get_auth_file_path()
        assert path.name == "auth.json"

    @pytest.mark.unit
    def test_path_contains_data_directory(self):
        """测试路径包含 data 目录"""
        path = get_auth_file_path()
        assert "data" in str(path)

    @pytest.mark.unit
    def test_creates_data_directory_if_not_exists(self, tmp_path, monkeypatch):
        """测试自动创建 data 目录"""
        # 修改函数中的项目根目录为临时目录
        with patch('src.storage.Path') as mock_path:
            mock_path.return_value.parent.parent = tmp_path
            mock_path.return_value.__truediv__ = lambda self, other: tmp_path / other

            # 确保 data 目录不存在
            data_dir = tmp_path / "data"
            if data_dir.exists():
                data_dir.rmdir()

            # 调用函数应该创建目录
            result = get_auth_file_path()

            # 验证目录已创建
            assert data_dir.exists()


# ============================================================
# save_auth() 和 load_auth() 测试
# ============================================================

class TestSaveAndLoadAuth:
    """测试认证信息保存和加载函数"""

    @pytest.mark.unit
    def test_save_and_load_auth_data(self, tmp_path, mock_auth_data, monkeypatch):
        """测试保存和加载完整流程"""
        auth_file = tmp_path / "test_auth.json"

        # Mock get_auth_file_path 返回临时文件路径
        monkeypatch.setattr('src.storage.get_auth_file_path', lambda: auth_file)

        # 保存数据
        result = save_auth(mock_auth_data)
        assert result is True
        assert auth_file.exists()

        # 加载数据
        loaded_data = load_auth()
        assert loaded_data is not None
        assert loaded_data["accessToken"] == mock_auth_data["accessToken"]
        assert loaded_data["email"] == mock_auth_data["email"]

    @pytest.mark.unit
    def test_save_auth_creates_directory(self, tmp_path, mock_auth_data, monkeypatch):
        """测试保存时自动创建目录"""
        auth_file = tmp_path / "new_dir" / "auth.json"

        # 确保父目录不存在
        assert not auth_file.parent.exists()

        monkeypatch.setattr('src.storage.get_auth_file_path', lambda: auth_file)

        # 保存应该自动创建目录
        result = save_auth(mock_auth_data)
        assert result is True
        assert auth_file.parent.exists()
        assert auth_file.exists()

    @pytest.mark.unit
    def test_save_auth_with_chinese_characters(self, tmp_path, monkeypatch):
        """测试保存包含中文字符的数据"""
        auth_file = tmp_path / "auth.json"
        monkeypatch.setattr('src.storage.get_auth_file_path', lambda: auth_file)

        data_with_chinese = {
            "accessToken": "token123",
            "email": "测试@example.com",
            "description": "这是中文描述",
        }

        result = save_auth(data_with_chinese)
        assert result is True

        # 验证可以正确加载
        loaded = load_auth()
        assert loaded["email"] == "测试@example.com"
        assert loaded["description"] == "这是中文描述"

    @pytest.mark.unit
    def test_save_auth_sets_file_permissions(self, tmp_path, mock_auth_data, monkeypatch):
        """测试保存时设置文件权限为 600"""
        auth_file = tmp_path / "auth.json"
        monkeypatch.setattr('src.storage.get_auth_file_path', lambda: auth_file)

        save_auth(mock_auth_data)

        # 获取文件权限（八进制）
        file_stat = auth_file.stat()
        file_mode = oct(file_stat.st_mode)[-3:]

        # 验证权限为 600（仅所有者可读写）
        assert file_mode == "600"

    @pytest.mark.unit
    def test_load_auth_file_not_exists(self, tmp_path, monkeypatch):
        """测试加载不存在的文件"""
        auth_file = tmp_path / "nonexistent.json"
        monkeypatch.setattr('src.storage.get_auth_file_path', lambda: auth_file)

        result = load_auth()
        assert result is None

    @pytest.mark.unit
    def test_load_auth_invalid_json(self, tmp_path, monkeypatch):
        """测试加载无效的 JSON 文件"""
        auth_file = tmp_path / "invalid.json"
        auth_file.write_text("{ invalid json }")

        monkeypatch.setattr('src.storage.get_auth_file_path', lambda: auth_file)

        result = load_auth()
        assert result is None

    @pytest.mark.unit
    def test_save_auth_overwrites_existing_file(self, tmp_path, mock_auth_data, monkeypatch):
        """测试保存覆盖已存在的文件"""
        auth_file = tmp_path / "auth.json"
        monkeypatch.setattr('src.storage.get_auth_file_path', lambda: auth_file)

        # 保存第一次
        save_auth(mock_auth_data)
        first_load = load_auth()
        assert first_load["email"] == "test@example.com"

        # 修改并保存第二次
        new_data = mock_auth_data.copy()
        new_data["email"] = "new@example.com"
        save_auth(new_data)

        # 验证已覆盖
        second_load = load_auth()
        assert second_load["email"] == "new@example.com"


# ============================================================
# auth_exists() 测试
# ============================================================

class TestAuthExists:
    """测试认证状态检查函数"""

    @pytest.mark.unit
    def test_auth_exists_with_valid_token(self, tmp_path, mock_auth_data, monkeypatch):
        """测试有效的 Token 文件"""
        auth_file = tmp_path / "auth.json"
        monkeypatch.setattr('src.storage.get_auth_file_path', lambda: auth_file)

        save_auth(mock_auth_data)
        assert auth_exists() is True

    @pytest.mark.unit
    def test_auth_exists_file_not_exists(self, tmp_path, monkeypatch):
        """测试文件不存在"""
        auth_file = tmp_path / "nonexistent.json"
        monkeypatch.setattr('src.storage.get_auth_file_path', lambda: auth_file)

        assert auth_exists() is False

    @pytest.mark.unit
    def test_auth_exists_missing_access_token(self, tmp_path, monkeypatch):
        """测试缺少 accessToken 字段"""
        auth_file = tmp_path / "auth.json"
        monkeypatch.setattr('src.storage.get_auth_file_path', lambda: auth_file)

        # 保存不包含 accessToken 的数据
        invalid_data = {
            "refreshToken": "refresh123",
            "email": "test@example.com",
        }
        save_auth(invalid_data)

        assert auth_exists() is False

    @pytest.mark.unit
    def test_auth_exists_empty_access_token(self, tmp_path, mock_auth_data, monkeypatch):
        """测试 accessToken 为空字符串"""
        auth_file = tmp_path / "auth.json"
        monkeypatch.setattr('src.storage.get_auth_file_path', lambda: auth_file)

        # 保存空 accessToken
        empty_token_data = mock_auth_data.copy()
        empty_token_data["accessToken"] = ""
        save_auth(empty_token_data)

        assert auth_exists() is False

    @pytest.mark.unit
    def test_auth_exists_invalid_json(self, tmp_path, monkeypatch):
        """测试无效的 JSON 文件"""
        auth_file = tmp_path / "auth.json"
        auth_file.write_text("{ invalid json }")

        monkeypatch.setattr('src.storage.get_auth_file_path', lambda: auth_file)

        assert auth_exists() is False


# ============================================================
# clear_auth() 测试
# ============================================================

class TestClearAuth:
    """测试认证信息清除函数"""

    @pytest.mark.unit
    def test_clear_existing_auth_file(self, tmp_path, mock_auth_data, monkeypatch):
        """测试清除已存在的文件"""
        auth_file = tmp_path / "auth.json"
        monkeypatch.setattr('src.storage.get_auth_file_path', lambda: auth_file)

        # 先保存
        save_auth(mock_auth_data)
        assert auth_file.exists()

        # 清除
        result = clear_auth()
        assert result is True
        assert not auth_file.exists()

    @pytest.mark.unit
    def test_clear_non_existing_file(self, tmp_path, monkeypatch):
        """测试清除不存在的文件（应该成功返回）"""
        auth_file = tmp_path / "nonexistent.json"
        monkeypatch.setattr('src.storage.get_auth_file_path', lambda: auth_file)

        result = clear_auth()
        assert result is True

    @pytest.mark.unit
    def test_clear_auth_and_verify(self, tmp_path, mock_auth_data, monkeypatch):
        """测试清除后 auth_exists 返回 False"""
        auth_file = tmp_path / "auth.json"
        monkeypatch.setattr('src.storage.get_auth_file_path', lambda: auth_file)

        # 保存并验证存在
        save_auth(mock_auth_data)
        assert auth_exists() is True

        # 清除并验证不存在
        clear_auth()
        assert auth_exists() is False


# ============================================================
# update_tokens() 测试
# ============================================================

class TestUpdateTokens:
    """测试 Token 更新函数"""

    @pytest.mark.unit
    def test_update_tokens_with_existing_auth(self, tmp_path, mock_auth_data, monkeypatch):
        """测试更新已存在的认证信息中的 Token"""
        auth_file = tmp_path / "auth.json"
        monkeypatch.setattr('src.storage.get_auth_file_path', lambda: auth_file)

        # 先保存初始数据
        save_auth(mock_auth_data)

        # 更新 Token
        new_access_token = "new_access_token_xyz"
        new_refresh_token = "new_refresh_token_xyz"
        new_expires_at = 9999999999000

        result = update_tokens(new_access_token, new_refresh_token, new_expires_at)
        assert result is True

        # 验证更新成功
        loaded = load_auth()
        assert loaded["accessToken"] == new_access_token
        assert loaded["refreshToken"] == new_refresh_token
        assert loaded["expiresAt"] == new_expires_at

        # 验证其他字段未改变
        assert loaded["email"] == mock_auth_data["email"]
        assert loaded["codeVerifier"] == mock_auth_data["codeVerifier"]

    @pytest.mark.unit
    def test_update_tokens_without_existing_auth(self, tmp_path, monkeypatch):
        """测试在没有现有认证信息时更新 Token（应该失败）"""
        auth_file = tmp_path / "nonexistent.json"
        monkeypatch.setattr('src.storage.get_auth_file_path', lambda: auth_file)

        result = update_tokens("new_token", "new_refresh", 123456)
        assert result is False

    @pytest.mark.unit
    def test_update_tokens_preserves_proxy_config(self, tmp_path, mock_auth_data, monkeypatch):
        """测试更新 Token 保留代理配置"""
        auth_file = tmp_path / "auth.json"
        monkeypatch.setattr('src.storage.get_auth_file_path', lambda: auth_file)

        # 保存包含代理配置的数据
        save_auth(mock_auth_data)

        # 更新 Token
        update_tokens("new_access", "new_refresh", 999999)

        # 验证代理配置未丢失
        loaded = load_auth()
        assert "proxy" in loaded
        assert loaded["proxy"]["type"] == "socks5"
        assert loaded["proxy"]["host"] == "127.0.0.1"


# ============================================================
# 集成测试：完整工作流程
# ============================================================

class TestStorageIntegration:
    """存储模块集成测试"""

    @pytest.mark.integration
    def test_full_auth_lifecycle(self, tmp_path, mock_auth_data, monkeypatch):
        """测试完整的认证生命周期"""
        auth_file = tmp_path / "auth.json"
        monkeypatch.setattr('src.storage.get_auth_file_path', lambda: auth_file)

        # 1. 初始状态：无认证
        assert auth_exists() is False
        assert load_auth() is None

        # 2. 保存认证信息
        result = save_auth(mock_auth_data)
        assert result is True
        assert auth_exists() is True

        # 3. 加载认证信息
        loaded = load_auth()
        assert loaded is not None
        assert loaded["accessToken"] == mock_auth_data["accessToken"]

        # 4. 更新 Token
        new_access = "updated_token"
        new_refresh = "updated_refresh"
        update_tokens(new_access, new_refresh, 888888)

        reloaded = load_auth()
        assert reloaded["accessToken"] == new_access
        assert reloaded["refreshToken"] == new_refresh

        # 5. 清除认证
        clear_auth()
        assert auth_exists() is False
        assert load_auth() is None
