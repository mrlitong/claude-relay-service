#!/usr/bin/env python3
"""
Claude CRS CLI - 命令行版本
基于 CLAUDE_CRS_CLI_PRD.md v1.0

轻量级的 Claude OAuth 授权和 Messages API 调用工具
"""

import asyncio
import os
import webbrowser
import time
from datetime import datetime
from pathlib import Path
from typing import Optional

import typer
import questionary
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich.spinner import Spinner
from rich import print as rprint

from src.auth import (
    generate_oauth_params,
    parse_callback_url,
    exchange_code_for_tokens,
    fetch_profile_info,
)
from src.storage import load_auth, save_auth, get_auth_file_path
from src.proxy import mask_proxy_info

# 版本号
__version__ = "1.0.0"

# 创建主应用和子命令组
app = typer.Typer(
    name="claude-crs-cli",
    help="Claude Relay Service - CLI 版本",
    add_completion=False,
)

auth_app = typer.Typer(help="OAuth 授权管理命令")
chat_app = typer.Typer(help="消息发送命令")

# 注册子命令
app.add_typer(auth_app, name="auth")
app.add_typer(chat_app, name="chat")

# Rich Console 用于美化输出
console = Console()


def version_callback(value: bool):
    """显示版本信息"""
    if value:
        console.print(f"[cyan]Claude CRS CLI[/cyan] version [bold]{__version__}[/bold]")
        raise typer.Exit()


@app.callback()
def main(
    version: Optional[bool] = typer.Option(
        None,
        "--version",
        "-v",
        help="显示版本号",
        callback=version_callback,
        is_eager=True,
    )
):
    """
    Claude CRS CLI - 命令行版 Claude API 中转工具

    功能特性：
    • OAuth 2.0 PKCE 授权流程
    • 自动 Token 刷新机制
    • SOCKS5/HTTP 代理支持
    • Messages API 流式响应

    使用示例：
        $ python3 cli.py auth login    # OAuth 授权
        $ python3 cli.py auth status   # 查看授权状态
        $ python3 cli.py chat send "Hello Claude"  # 发送消息
    """
    pass


# ============================================================
# Auth 命令组：OAuth 授权管理
# ============================================================


@auth_app.command("login")
def auth_login(
    no_browser: bool = typer.Option(False, "--no-browser", help="不自动打开浏览器"),
):
    """
    交互式 OAuth 2.0 授权流程（强制要求配置代理）

    ⚠️ 重要提示：为避免触发 Anthropic 风控策略，必须配置代理进行授权。

    完成授权后，Token 将保存到本地 data/auth.json 文件
    """
    try:
        console.print("\n[bold cyan]═══════════════════════════════════════════════[/bold cyan]")
        console.print("[bold cyan]        Claude OAuth 2.0 授权流程[/bold cyan]")
        console.print("[bold cyan]═══════════════════════════════════════════════[/bold cyan]\n")

        # ========================================
        # 步骤 1: 强制配置代理
        # ========================================
        console.print("[bold yellow]⚠️  安全提示[/bold yellow]")
        console.print("[yellow]为避免触发 Anthropic 风控策略，必须配置代理进行授权。[/yellow]\n")

        console.print("[bold]步骤 1: 代理配置[/bold]")
        console.print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")

        # 询问代理类型
        proxy_type = questionary.select(
            "请选择代理类型:",
            choices=["SOCKS5", "HTTP"],
            default="SOCKS5",
        ).ask()

        if not proxy_type:
            console.print("[red]✗[/red] 已取消授权流程")
            raise typer.Exit(1)

        proxy_type = proxy_type.lower()

        # 询问代理地址
        proxy_host = questionary.text(
            "代理地址:",
            default="127.0.0.1",
            validate=lambda x: bool(x.strip()),
        ).ask()

        if not proxy_host:
            console.print("[red]✗[/red] 已取消授权流程")
            raise typer.Exit(1)

        # 询问代理端口
        proxy_port = questionary.text(
            "代理端口:",
            default="1080" if proxy_type == "socks5" else "8080",
            validate=lambda x: x.strip().isdigit() and 1 <= int(x.strip()) <= 65535,
        ).ask()

        if not proxy_port:
            console.print("[red]✗[/red] 已取消授权流程")
            raise typer.Exit(1)

        proxy_port = int(proxy_port)

        # 询问用户名（可选）
        proxy_username = questionary.text(
            "用户名（可选，直接回车跳过）:",
            default="",
        ).ask()

        # 询问密码（可选）
        proxy_password = None
        if proxy_username:
            proxy_password = questionary.password(
                "密码（可选，直接回车跳过）:",
            ).ask()

        # 构建代理配置对象
        proxy_config = {
            "type": proxy_type,
            "host": proxy_host.strip(),
            "port": proxy_port,
        }

        if proxy_username and proxy_username.strip():
            proxy_config["username"] = proxy_username.strip()
            if proxy_password and proxy_password.strip():
                proxy_config["password"] = proxy_password.strip()

        console.print(f"\n[green]✓[/green] 代理配置完成: {mask_proxy_info(proxy_config)}\n")

        # ========================================
        # 步骤 2: 生成授权 URL
        # ========================================
        console.print("[bold]步骤 2: 生成授权 URL[/bold]")
        console.print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")

        with console.status("[yellow]⚡ 正在生成授权链接...[/yellow]"):
            oauth_params = generate_oauth_params()
            auth_url = oauth_params['authUrl']
            code_verifier = oauth_params['codeVerifier']
            state = oauth_params['state']

        console.print("\n[bold]请在浏览器中打开以下链接进行授权：[/bold]\n")

        # 使用 Panel 显示授权 URL
        url_panel = Panel(
            f"[link={auth_url}]{auth_url}[/link]",
            border_style="cyan",
            padding=(1, 2),
        )
        console.print(url_panel)

        # 尝试自动打开浏览器
        if not no_browser:
            try:
                webbrowser.open(auth_url)
                console.print("\n[green]✓[/green] 已在默认浏览器中打开授权页面\n")
            except Exception as e:
                console.print(f"\n[yellow]⚠[/yellow]  无法自动打开浏览器: {e}\n")
                console.print("[yellow]请手动复制上方链接到浏览器打开[/yellow]\n")
        else:
            console.print()

        # ========================================
        # 步骤 3: 等待用户输入授权码
        # ========================================
        console.print("[bold]步骤 3: 输入授权码[/bold]")
        console.print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")

        console.print("[dim]授权完成后，浏览器会跳转到回调页面。[/dim]")
        console.print("[dim]请复制完整的回调 URL 或其中的 Authorization Code。[/dim]\n")

        # 等待用户输入
        callback_input = questionary.text(
            "请粘贴内容:",
            validate=lambda x: bool(x.strip()),
        ).ask()

        if not callback_input:
            console.print("[red]✗[/red] 已取消授权流程")
            raise typer.Exit(1)

        # 解析授权码
        try:
            authorization_code = parse_callback_url(callback_input.strip())
        except ValueError as e:
            console.print(f"\n[red]✗ 错误：{e}[/red]")
            raise typer.Exit(1)

        # ========================================
        # 步骤 4: 交换 Token
        # ========================================
        console.print("\n[bold]步骤 4: 交换 Token[/bold]")
        console.print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")

        # 使用 asyncio 运行异步函数
        async def do_token_exchange():
            with console.status("[yellow]⠋ 正在获取访问令牌...[/yellow]"):
                token_data = await exchange_code_for_tokens(
                    authorization_code,
                    code_verifier,
                    state,
                    proxy_config,
                )
            return token_data

        try:
            token_data = asyncio.run(do_token_exchange())
        except Exception as e:
            console.print(f"\n[red]✗ Token 交换失败：{e}[/red]")
            raise typer.Exit(1)

        console.print("[green]✓[/green] Token 获取成功\n")

        # 查询用户信息
        async def do_fetch_profile():
            with console.status("[yellow]⠋ 正在查询账户信息...[/yellow]"):
                profile_info = await fetch_profile_info(
                    token_data['accessToken'],
                    proxy_config,
                )
            return profile_info

        try:
            profile_info = asyncio.run(do_fetch_profile())
        except Exception as e:
            console.print(f"[yellow]⚠[/yellow]  无法查询账户信息: {e}")
            profile_info = {"email": "未知", "accountType": "未知"}

        console.print("[green]✓[/green] 授权完成！\n")

        # ========================================
        # 显示账户信息
        # ========================================
        console.print("[bold]账户信息[/bold]")
        console.print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")

        # 创建信息表格
        info_table = Table(show_header=False, box=None, padding=(0, 2))
        info_table.add_column("Key", style="bold")
        info_table.add_column("Value")

        info_table.add_row("邮箱:", f"[cyan]{profile_info.get('email', '未知')}[/cyan]")
        info_table.add_row("套餐:", f"[green]{profile_info.get('accountType', '未知')}[/green]")

        # 计算过期时间
        expires_at = token_data['expiresAt']
        expires_dt = datetime.fromtimestamp(expires_at / 1000)
        remaining_seconds = int((expires_at - time.time() * 1000) / 1000)

        info_table.add_row(
            "Token 有效期:",
            f"{expires_dt.strftime('%Y-%m-%d %H:%M:%S')} (剩余 {remaining_seconds} 秒)",
        )

        info_table.add_row("代理:", f"[yellow]{mask_proxy_info(proxy_config)}[/yellow]")

        console.print(info_table)
        console.print()

        # ========================================
        # 保存授权信息
        # ========================================
        auth_data = {
            "accessToken": token_data['accessToken'],
            "refreshToken": token_data['refreshToken'],
            "expiresAt": token_data['expiresAt'],
            "email": profile_info.get('email', ''),
            "codeVerifier": code_verifier,  # 保存 code_verifier 用于 token 刷新
            "proxy": proxy_config,
            "scopes": token_data.get('scopes', []),
            "accountType": profile_info.get('accountType', '未知'),
        }

        save_auth(auth_data)

        auth_file_path = get_auth_file_path()
        console.print(f"[green]授权信息已保存到: {auth_file_path}[/green]\n")

    except KeyboardInterrupt:
        console.print("\n\n[yellow]已取消授权流程[/yellow]")
        raise typer.Exit(1)
    except Exception as e:
        console.print(f"\n[red]✗ 发生错误：{e}[/red]")
        raise typer.Exit(1)


@auth_app.command("status")
def auth_status():
    """
    查看当前授权状态

    显示 Token 有效期、用户邮箱、代理配置等信息
    """
    try:
        console.print("\n[bold cyan]═══════════════════════════════════════════════[/bold cyan]")
        console.print("[bold cyan]           授权状态查询[/bold cyan]")
        console.print("[bold cyan]═══════════════════════════════════════════════[/bold cyan]\n")

        # 加载授权数据
        try:
            auth_data = load_auth()
            if not auth_data:
                raise FileNotFoundError()
        except FileNotFoundError:
            console.print("[yellow]⚠[/yellow]  尚未进行 OAuth 授权")
            console.print("\n请先运行以下命令进行授权：")
            console.print("  [cyan]python3 cli.py auth login[/cyan]\n")
            raise typer.Exit(1)
        except Exception as e:
            console.print(f"[red]✗ 无法读取授权数据：{e}[/red]\n")
            raise typer.Exit(1)

        # 检查必要字段
        if not auth_data.get('accessToken') or not auth_data.get('expiresAt'):
            console.print("[red]✗ 授权数据不完整，请重新授权[/red]\n")
            raise typer.Exit(1)

        # 计算 Token 状态
        expires_at = auth_data['expiresAt']
        current_time_ms = int(time.time() * 1000)
        remaining_ms = expires_at - current_time_ms
        remaining_seconds = int(remaining_ms / 1000)

        is_valid = remaining_ms > 0

        # 格式化过期时间
        expires_dt = datetime.fromtimestamp(expires_at / 1000)
        expires_str = expires_dt.strftime('%Y-%m-%d %H:%M:%S')

        # 创建状态表格
        status_table = Table(
            show_header=False,
            box=None,
            padding=(0, 2),
            title="[bold]授权状态[/bold]",
            title_style="bold cyan",
        )
        status_table.add_column("Key", style="bold")
        status_table.add_column("Value")

        # 状态行
        if is_valid:
            status_table.add_row("状态:", "[green]✓ 有效[/green]")
        else:
            status_table.add_row("状态:", "[red]✗ 已过期[/red]")

        # 邮箱
        email = auth_data.get('email', '未知')
        status_table.add_row("邮箱:", f"[cyan]{email}[/cyan]")

        # 套餐类型
        account_type = auth_data.get('accountType', '未知')
        status_table.add_row("套餐:", f"[green]{account_type}[/green]")

        # 过期时间
        status_table.add_row("过期时间:", expires_str)

        # 剩余时间
        if is_valid:
            remaining_time_str = f"{remaining_seconds} 秒"
            if remaining_seconds > 3600:
                hours = remaining_seconds // 3600
                minutes = (remaining_seconds % 3600) // 60
                remaining_time_str = f"{hours} 小时 {minutes} 分钟"
            elif remaining_seconds > 60:
                minutes = remaining_seconds // 60
                seconds = remaining_seconds % 60
                remaining_time_str = f"{minutes} 分钟 {seconds} 秒"

            status_table.add_row("剩余时间:", remaining_time_str)
        else:
            expired_seconds = abs(remaining_seconds)
            status_table.add_row("已过期:", f"{expired_seconds} 秒")

        # 代理配置
        proxy_config = auth_data.get('proxy')
        if proxy_config:
            proxy_display = mask_proxy_info(proxy_config)
            status_table.add_row("代理:", f"[yellow]{proxy_display}[/yellow]")
        else:
            status_table.add_row("代理:", "[dim]未配置[/dim]")

        console.print(status_table)
        console.print()

        # 如果 Token 即将过期，给出提示
        if is_valid and remaining_seconds < 300:  # 小于 5 分钟
            console.print("[yellow]⚠[/yellow]  Token 即将过期，建议重新授权\n")

    except typer.Exit:
        raise
    except Exception as e:
        console.print(f"\n[red]✗ 发生错误：{e}[/red]")
        raise typer.Exit(1)


# ============================================================
# Chat 命令组：消息发送
# ============================================================


@chat_app.command("send")
def chat_send(
    message: Optional[str] = typer.Argument(None, help="要发送的消息内容"),
    model: str = typer.Option(
        "claude-sonnet-4-20250514",
        "--model",
        "-m",
        help="指定使用的模型",
    ),
    max_tokens: int = typer.Option(
        4096,
        "--max-tokens",
        help="最大输出 tokens 数量",
    ),
    file: Optional[str] = typer.Option(
        None,
        "--file",
        "-f",
        help="从文件读取消息内容",
    ),
):
    """
    发送消息到 Claude Messages API

    支持流式响应，实时显示 Claude 的回复内容
    """
    console.print("[yellow]⚠️  chat send 命令尚未实现（将在第四阶段开发）[/yellow]")
    console.print("\n预期功能：")
    console.print("• 发送消息到 Messages API")
    console.print("• 实时显示流式响应")
    console.print("• 自动检查和刷新 Token")
    console.print("• 显示 token 使用统计")

    if message:
        console.print(f"\n[dim]收到消息内容: {message}[/dim]")
    if file:
        console.print(f"[dim]从文件读取: {file}[/dim]")


# ============================================================
# 程序入口
# ============================================================


if __name__ == "__main__":
    app()
