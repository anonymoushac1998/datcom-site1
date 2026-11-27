-- Datcom: раздел «Университеты».
-- Запустите в Supabase → SQL Editor → New query → Run (после schema.sql). Повторный запуск безопасен.

create table if not exists public.universities (
  id bigint generated always as identity primary key,
  name text not null,
  kind text not null default 'university' check (kind in ('university', 'college')),
  city text not null default '',
  province text not null default '',
  programs text not null default '',
  cost text not null default '',
  conditions text not null default '',
  image text not null default '',
  video_url text not null default '',
  featured boolean not null default false,
  published boolean not null default true,
  sort int not null default 0
);

-- Права для API сайта (в новых проектах Supabase их нужно выдавать явно).
grant select on public.universities to anon, authenticated;
grant insert, update, delete on public.universities to authenticated;

alter table public.universities enable row level security;
drop policy if exists "public read published" on public.universities;
create policy "public read published" on public.universities for select to anon, authenticated using (published or public.is_admin());
drop policy if exists "admins write" on public.universities;
create policy "admins write" on public.universities for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Начальные данные: колледжи, названные в презентации Datcom.
insert into public.universities (name, kind, city, province, programs, cost, conditions, image, featured, sort)
select * from (values
  ('Jiangxi Fenglin College of Foreign Economy & Trade', 'college', 'Наньчан', 'Цзянси', 'Digital Media, E-commerce. На базе 9 класса, 50 мест.', '$1 500 в год — обучение и проживание', 'С 15–16 лет. Студенты из Кыргызстана поступают только через Datcom.', '/img/jiangxi.jpg', true, 1),
  ('Колледж в Янчэне', 'college', 'Янчэн', 'Цзянсу', 'Программа 1+2, E-commerce. До 20 студентов в год.', 'Депозит $800 в год, возвращается в декабре при соблюдении правил', 'От 16,5 лет, интервью', '', false, 2),
  ('Колледж в Хуайане', 'college', 'Хуайань', 'Цзянсу', 'Программа 1+2, International Business и E-commerce.', 'Обучение бесплатно, проживание до $300 в год', 'От 16,5 лет, интервью', '', false, 3),
  ('Колледж в Цзинане', 'college', 'Цзинань', 'Шаньдун', 'На базе 9 класса, E-commerce.', 'Обучение и проживание бесплатно; возможный депозит 1 000 юаней', 'От 16,5 лет', '', false, 4),
  ('Колледж в Суйнине', 'college', 'Суйнин (рядом с Чэнду)', 'Сычуань', 'Программа 1+2, аттестат 9 классов.', '$600 в год, не возвращается', 'От 17 лет, интервью', '', false, 5)
) v(name, kind, city, province, programs, cost, conditions, image, featured, sort)
where not exists (select 1 from public.universities);

-- Чтобы API сразу увидел таблицу.
notify pgrst, 'reload schema';
