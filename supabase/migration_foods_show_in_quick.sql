-- 标记食物是否显示在首页常用食物/食物库中。
-- false 的食物仍可被 entries 引用，用于保存“仅加入今日”的临时食物。
alter table public.foods
add column if not exists show_in_quick boolean not null default true;

grant update (show_in_quick) on public.foods to anon, authenticated;
