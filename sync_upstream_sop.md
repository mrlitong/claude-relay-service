# 同步上游仓库 SOP (Standard Operating Procedure)

## 概述
本文档描述了如何手动同步上游仓库（upstream）的更新到你的 fork 仓库的 main 分支。

## 前置条件
- 已经配置了 upstream 远程仓库
- 确认 upstream 配置：`git remote -v`

## 手动同步步骤

### 1. 获取上游最新代码
```bash
git fetch upstream
```
此命令会从上游仓库获取所有最新的分支和标签信息，但不会自动合并到你的本地分支。

### 2. 切换到 main 分支
```bash
git checkout main
```
切换到你要同步的目标分支（通常是 main）。

### 3. 合并上游的 main 分支

#### 方式一：使用 merge（推荐新手）
```bash
git merge upstream/main
```
这会创建一个合并提交，保留所有提交历史。

#### 方式二：使用 rebase（保持线性历史）
```bash
git rebase upstream/main
```
这会将你的提交重新应用在上游最新提交之后，保持提交历史的线性。

### 4. 推送到你的远程仓库
```bash
git push origin main
```
如果使用了 rebase，可能需要强制推送：
```bash
git push origin main --force-with-lease
```

### 5. 切回你的工作分支
```bash
git checkout dev-custom
```
完成同步后，切回到你的日常工作分支。

## 处理冲突

如果在合并或 rebase 过程中出现冲突：

### Merge 冲突处理
1. 编辑冲突文件，解决冲突
2. 添加解决后的文件：`git add <冲突文件>`
3. 完成合并：`git commit`
4. 推送：`git push origin main`

### Rebase 冲突处理
1. 编辑冲突文件，解决冲突
2. 添加解决后的文件：`git add <冲突文件>`
3. 继续 rebase：`git rebase --continue`
4. 如需放弃 rebase：`git rebase --abort`
5. 完成后推送：`git push origin main --force-with-lease`

## 快捷命令

### 一行命令完成同步（merge 方式）
```bash
git fetch upstream && git checkout main && git merge upstream/main && git push origin main && git checkout dev-custom
```

### 一行命令完成同步（rebase 方式）
```bash
git fetch upstream && git checkout main && git rebase upstream/main && git push origin main --force-with-lease && git checkout dev-custom
```

## 最佳实践

1. **定期同步**：建议每周至少同步一次，避免累积过多更改
2. **同步前检查**：执行同步前，确保本地没有未提交的更改
3. **备份重要分支**：在执行 rebase 操作前，可以创建备份分支：`git branch backup-main`
4. **保持 main 分支干净**：不要在 main 分支上直接开发，使用 dev-custom 或其他功能分支
5. **检查同步结果**：同步后使用 `git log --oneline -10` 查看最近提交，确认同步成功

## 常见问题

### Q: 如何添加 upstream 远程仓库？
```bash
git remote add upstream <上游仓库URL>
```

### Q: 如何查看当前远程仓库配置？
```bash
git remote -v
```

### Q: 如何查看本地和远程的差异？
```bash
git log main..upstream/main --oneline
```

### Q: 如何只获取特定分支的更新？
```bash
git fetch upstream main:upstream-main
```

## 注意事项

- 如果你的 main 分支有自定义修改，建议使用单独的分支（如 dev-custom）保存你的更改
- 使用 `--force-with-lease` 而不是 `--force`，这样更安全
- 在团队协作时，避免在共享分支上使用 rebase
- 始终在同步前确认当前分支状态：`git status`

## 更新记录
- 2025-09-14：初始版本创建