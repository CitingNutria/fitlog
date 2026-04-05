-- 切换为“无登录单人使用”模式
-- 1) 允许 entries.user_id 为空（使用 null 作为你的专属数据标记）
alter table public.entries alter column user_id drop not null;

-- 2) 简化：关闭 entries 与 foods 的 RLS（匿名 key 即可读写）
alter table public.entries disable row level security;
alter table public.foods disable row level security;

-- 如需保留 RLS 而只放行 user_id 为 null 的行，可使用下列策略替代（可选）：
-- 注意：使用策略时请保证 RLS 是 enable 的，并删掉上面的 disable。
-- 
-- alter table public.entries enable row level security;
-- create policy "entries allow null-user"
--   on public.entries for all
--   using (user_id is null)
--   with check (user_id is null);
-- 
-- alter table public.foods enable row level security;
-- create policy "foods allow null-user"
--   on public.foods for all
--   using (user_id is null)
--   with check (user_id is null);

-- 3) 确保匿名与认证角色有基本 DML 权限（在 RLS 关闭时生效）
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.entries to anon, authenticated;
grant select, insert, update, delete on public.foods to anon, authenticated;


