## FitLog

一个 0 成本、可部署到 Vercel 的饮食记录 PWA。支持目标计算（减脂/增肌/维持 + 训练日）、常用食物快捷添加、食物库管理（演示版），可接入 Supabase 实现登录与云同步。

### 本地运行
1. 安装依赖：
   ```bash
   npm install
   ```
2. 本地开发：
   ```bash
   npm run dev
   ```

### 环境变量
复制 `env.example` 为 `.env.local`，并填入 Supabase 项目参数：
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### Supabase 数据库
在 Supabase SQL 控制台执行 `supabase/schema.sql`，并为四张表开启 RLS（脚本已包含策略）。

### PWA
- 已配置 `next-pwa` 与 `public/manifest.json`
- 请将 `public/icons/icon-192.png` 与 `public/icons/icon-512.png` 替换为真实 PNG 图标

### 部署
1. 推送到 GitHub
2. 在 Vercel 导入仓库，配置与 `.env.local` 同名的环境变量
3. 部署完成后，用 Safari 打开并“添加到主屏幕”

