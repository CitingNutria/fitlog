-- 为 foods 增加排序列
alter table public.foods add column if not exists sort_order integer default 0;
alter table public.foods add column if not exists updated_at timestamp with time zone default now();

-- 基本权限（无登录模式）
grant update (sort_order, name, carbs, protein, fat, updated_at) on public.foods to anon, authenticated;

