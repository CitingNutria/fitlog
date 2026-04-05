-- Users are managed by Supabase Auth

create table if not exists public.foods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  name text not null,
  carbs numeric not null default 0,       -- per 100g
  protein numeric not null default 0,     -- per 100g
  fat numeric not null default 0,         -- per 100g
  calories numeric,                       -- per 100g, optional
  created_at timestamp with time zone default now(),
  unique(user_id, name)
);

create table if not exists public.food_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  food_id uuid references public.foods(id) on delete cascade not null,
  sort_order integer default 0,
  created_at timestamp with time zone default now()
);

create table if not exists public.entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  food_id uuid references public.foods(id),
  grams numeric not null,
  date date not null default now(),
  created_at timestamp with time zone default now()
);

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  phase text check (phase in ('cut','bulk','maintain')) not null default 'maintain',
  training_day boolean not null default false,
  weight_kg numeric not null default 70,
  height_cm numeric not null default 170,
  age integer not null default 25,
  sex text check (sex in ('m','f')) not null default 'm',
  activity_level text check (activity_level in ('sedentary','light','moderate','active','very_active')) not null default 'moderate',
  protein_g_per_kg numeric default 1.8,
  fat_g_per_kg numeric default 0.8,
  carb_strategy text check (carb_strategy in ('fill_rest','fixed')) default 'fill_rest',
  carb_fixed_g numeric,
  updated_at timestamp with time zone default now()
);

alter table public.foods enable row level security;
alter table public.food_favorites enable row level security;
alter table public.entries enable row level security;
alter table public.user_settings enable row level security;

create policy "allow read public foods"
  on public.foods for select
  using (user_id is null or user_id = auth.uid());

create policy "allow manage own foods"
  on public.foods for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "favorites rw own"
  on public.food_favorites for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "entries rw own"
  on public.entries for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "settings rw own"
  on public.user_settings for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

