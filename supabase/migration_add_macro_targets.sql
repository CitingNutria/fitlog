-- 为 entries 追加快照字段：记录当时的期与是否训练日
alter table public.entries add column if not exists phase text check (phase in ('cut','bulk','maintain'));
alter table public.entries add column if not exists training_day boolean;

-- 新增用户宏目标表：按相位 + 日类型存储 g 值，热量由 4/4/9 推导
create table if not exists public.macro_targets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  phase text not null check (phase in ('cut','bulk','maintain')),
  day_type text not null check (day_type in ('training','rest')),
  protein_g numeric not null default 0,
  fat_g numeric not null default 0,
  carbs_g numeric not null default 0,
  updated_at timestamp with time zone default now(),
  unique(user_id, phase, day_type)
);

-- 单人无登录模式：关闭 RLS 或仅放行 user_id 为 null
alter table public.macro_targets disable row level security;

-- 基本权限（无登录模式）
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.macro_targets to anon, authenticated;

