-- 每 100g 食物含钠量，单位 mg。
alter table public.foods
add column if not exists sodium_mg numeric not null default 0;

grant update (sodium_mg) on public.foods to anon, authenticated;
