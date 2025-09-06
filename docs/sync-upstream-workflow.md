# Fork 项目的上游同步工作流程

## 初始设置（已完成）

```bash
# 添加上游仓库
git remote add upstream https://github.com/Wei-Shaw/claude-relay-service.git

# 验证远程仓库
git remote -v
```

## 推荐的分支策略

### 1. 三分支模式（推荐）

- **main**: 保持与上游同步，不做任何修改
- **dev-custom**: 你的所有自定义修改都在这个分支
- **production**: 合并了上游更新和你的修改的生产分支

```bash
# 创建自定义开发分支
git checkout -b dev-custom

# 创建生产分支
git checkout -b production
```

## 日常工作流程

### 1. 同步上游更新

```bash
# 切换到 main 分支
git checkout main

# 获取上游最新代码
git fetch upstream

# 合并上游的 main 到本地 main（保持纯净）
git merge upstream/main

# 推送到你的 fork
git push origin main
```

### 2. 将上游更新合并到你的开发分支

```bash
# 切换到你的自定义分支
git checkout dev-custom

# 合并上游的更新
git merge main

# 解决冲突（如果有）
# 手动编辑冲突文件
git add .
git commit -m "Merge upstream updates"

# 推送你的开发分支
git push origin dev-custom
```

### 3. 准备生产版本

```bash
# 切换到生产分支
git checkout production

# 合并上游更新
git merge main

# 合并你的自定义修改
git merge dev-custom

# 解决冲突并测试
git push origin production
```

## 自动化脚本

创建一个同步脚本 `sync-upstream.sh`:

```bash
#!/bin/bash

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}开始同步上游仓库...${NC}"

# 保存当前分支
CURRENT_BRANCH=$(git branch --show-current)

# 获取上游更新
echo -e "${GREEN}获取上游更新...${NC}"
git fetch upstream

# 同步 main 分支
echo -e "${GREEN}同步 main 分支...${NC}"
git checkout main
git merge upstream/main
git push origin main

# 更新自定义分支
echo -e "${GREEN}更新自定义分支...${NC}"
git checkout dev-custom
git merge main

# 检查是否有冲突
if [ $? -ne 0 ]; then
    echo -e "${RED}发现冲突！请手动解决冲突后继续。${NC}"
    echo "解决冲突后运行："
    echo "  git add ."
    echo "  git commit -m 'Merge upstream updates'"
    echo "  git push origin dev-custom"
    exit 1
fi

git push origin dev-custom

# 返回原分支
git checkout $CURRENT_BRANCH

echo -e "${GREEN}同步完成！${NC}"
```

## 最佳实践

### 1. 定期同步
- 建议每周至少同步一次上游代码
- 在开始新功能开发前先同步

### 2. 提交规范
- 在你的自定义分支使用清晰的提交信息
- 标记哪些是你的自定义修改：`[CUSTOM] 添加xxx功能`

### 3. 冲突处理
- 保留一个配置文件记录你的所有自定义修改点
- 使用 `.gitattributes` 处理特定文件的合并策略

创建 `.gitattributes`:
```
# 保持你的自定义配置文件
config/custom-config.js merge=ours
.env merge=ours
```

### 4. 版本标签管理
```bash
# 为你的自定义版本创建标签
git tag -a custom-v1.0.0 -m "基于上游 v1.1.128 的自定义版本"
git push origin custom-v1.0.0
```

### 5. 快速检查差异
```bash
# 查看你的修改与上游的差异
git diff upstream/main..dev-custom

# 查看文件级别的差异
git diff --name-only upstream/main..dev-custom

# 查看提交历史差异
git log --oneline upstream/main..dev-custom
```

## 紧急情况处理

### 如果不小心在 main 分支做了修改

```bash
# 创建备份分支
git checkout -b backup-changes

# 重置 main 到上游状态
git checkout main
git reset --hard upstream/main
git push origin main --force

# 将修改应用到正确的分支
git checkout dev-custom
git merge backup-changes
```

### 如果需要特定的上游提交

```bash
# Cherry-pick 特定提交
git checkout dev-custom
git cherry-pick <commit-hash>
```

## 自动化 GitHub Actions（可选）

创建 `.github/workflows/sync-upstream.yml`:

```yaml
name: Sync upstream

on:
  schedule:
    # 每天凌晨 2 点自动同步
    - cron: '0 2 * * *'
  workflow_dispatch:

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0
          
      - name: Sync upstream
        run: |
          git config user.name github-actions
          git config user.email github-actions@github.com
          git remote add upstream https://github.com/Wei-Shaw/claude-relay-service.git
          git fetch upstream
          git checkout main
          git merge upstream/main
          git push origin main
```

## 注意事项

1. **开源协议合规**：确保你的使用符合项目的开源协议（MIT/Apache 2.0 等）
2. **保留原作者信息**：不要删除原作者的版权声明
3. **贡献回馈**：如果你的修改对社区有价值，考虑提 PR 回馈上游
4. **文档记录**：记录你的所有自定义修改，方便后续维护