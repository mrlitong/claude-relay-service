"""
本地存储管理模块
使用 JSON 文件存储 OAuth Token 和代理配置
"""

import json
import os
from pathlib import Path
from typing import Optional, Dict, Any

from .constants import DATA_DIR, AUTH_FILE


def get_auth_file_path() -> Path:
    """
    获取认证文件的完整路径

    Returns:
        Path: data/auth.json 的完整路径
    """
    # 获取项目根目录（cli.py 所在目录）
    project_root = Path(__file__).parent.parent
    data_path = project_root / DATA_DIR

    # 确保 data 目录存在
    data_path.mkdir(parents=True, exist_ok=True)

    return data_path / AUTH_FILE


def auth_exists() -> bool:
    """
    检查是否存在有效的授权信息

    Returns:
        bool: 如果 auth.json 存在且可读取返回 True
    """
    auth_path = get_auth_file_path()

    if not auth_path.exists():
        return False

    try:
        with open(auth_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            # 基本验证：必须包含 accessToken 且不为空
            return 'accessToken' in data and bool(data['accessToken'])
    except (json.JSONDecodeError, IOError):
        return False


def load_auth() -> Optional[Dict[str, Any]]:
    """
    从本地文件加载认证信息

    Returns:
        Optional[Dict]: 认证数据字典，如果不存在或解析失败返回 None

    数据结构：
        {
            "accessToken": str,
            "refreshToken": str,
            "expiresAt": int (毫秒时间戳),
            "email": str,
            "codeVerifier": str,
            "proxy": {
                "type": str,
                "host": str,
                "port": int,
                "username": str (可选),
                "password": str (可选)
            }
        }
    """
    auth_path = get_auth_file_path()

    if not auth_path.exists():
        return None

    try:
        with open(auth_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError) as e:
        print(f"⚠️  读取认证文件失败: {e}")
        return None


def save_auth(auth_data: Dict[str, Any]) -> bool:
    """
    保存认证信息到本地文件

    Args:
        auth_data: 认证数据字典

    Returns:
        bool: 保存成功返回 True，失败返回 False
    """
    auth_path = get_auth_file_path()

    try:
        # 确保 data 目录存在
        auth_path.parent.mkdir(parents=True, exist_ok=True)

        # 写入 JSON 文件（格式化输出，便于调试）
        with open(auth_path, 'w', encoding='utf-8') as f:
            json.dump(auth_data, f, indent=2, ensure_ascii=False)

        # 设置文件权限为仅当前用户可读写（安全考虑）
        os.chmod(auth_path, 0o600)

        return True
    except (IOError, OSError) as e:
        print(f"❌ 保存认证文件失败: {e}")
        return False


def clear_auth() -> bool:
    """
    清除本地存储的认证信息

    Returns:
        bool: 清除成功返回 True
    """
    auth_path = get_auth_file_path()

    try:
        if auth_path.exists():
            auth_path.unlink()
        return True
    except OSError as e:
        print(f"❌ 清除认证文件失败: {e}")
        return False


def update_tokens(access_token: str, refresh_token: str, expires_at: int) -> bool:
    """
    更新存储的 Token 信息（用于 Token 刷新场景）

    Args:
        access_token: 新的访问令牌
        refresh_token: 新的刷新令牌
        expires_at: 过期时间戳（毫秒）

    Returns:
        bool: 更新成功返回 True
    """
    auth_data = load_auth()

    if not auth_data:
        print("❌ 未找到现有认证信息，无法更新 Token")
        return False

    # 更新 Token 字段
    auth_data['accessToken'] = access_token
    auth_data['refreshToken'] = refresh_token
    auth_data['expiresAt'] = expires_at

    return save_auth(auth_data)
