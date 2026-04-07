-- 为 foods 增加最近使用时间，用于跨设备同步“最近使用排序”
alter table public.foods add column if not exists last_used_at timestamp with time zone;

-- 无登录模式下授予更新时间字段权限
grant update (last_used_at) on public.foods to anon, authenticated;
