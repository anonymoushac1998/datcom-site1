-- Datcom: база для сайта и админ-панели.
-- Запустите целиком в Supabase → SQL Editor → New query → Run. Повторный запуск безопасен.

-- ───────── Администраторы ─────────
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

drop policy if exists "admins read self" on public.admins;
create policy "admins read self" on public.admins for select to authenticated using (user_id = auth.uid());

-- ───────── Заявки ─────────
create table if not exists public.leads (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  name text not null check (char_length(name) between 1 and 120),
  phone text not null check (char_length(phone) between 3 and 40),
  message text check (char_length(message) <= 2000),
  program text check (char_length(program) <= 120),
  status text not null default 'new' check (status in ('new', 'in_progress', 'enrolled', 'rejected')),
  note text
);
alter table public.leads enable row level security;

drop policy if exists "anyone can submit a lead" on public.leads;
create policy "anyone can submit a lead" on public.leads for insert to anon, authenticated
  with check (status = 'new' and note is null);
drop policy if exists "admins manage leads" on public.leads;
create policy "admins manage leads" on public.leads for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ───────── Контент ─────────
create table if not exists public.programs (
  id text primary key,
  title text not null,
  duration text not null default '',
  language text not null default '',
  requirements text not null default '',
  points text[] not null default '{}',
  sort int not null default 0
);

create table if not exists public.faq (
  id bigint generated always as identity primary key,
  q text not null,
  a text not null,
  sort int not null default 0
);

create table if not exists public.gallery (
  id bigint generated always as identity primary key,
  src text not null,
  caption text not null default '',
  sort int not null default 0
);

create table if not exists public.settings (
  key text primary key,
  value jsonb not null
);

do $$
declare t text;
begin
  foreach t in array array['programs', 'faq', 'gallery', 'settings'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "public read" on public.%I', t);
    execute format('create policy "public read" on public.%I for select to anon, authenticated using (true)', t);
    execute format('drop policy if exists "admins write" on public.%I', t);
    execute format('create policy "admins write" on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

-- ───────── Хранилище фото ─────────
insert into storage.buckets (id, name, public) values ('media', 'media', true)
on conflict (id) do nothing;

drop policy if exists "media public read" on storage.objects;
create policy "media public read" on storage.objects for select to anon, authenticated using (bucket_id = 'media');
drop policy if exists "media admin write" on storage.objects;
create policy "media admin write" on storage.objects for all to authenticated
  using (bucket_id = 'media' and public.is_admin()) with check (bucket_id = 'media' and public.is_admin());

-- ───────── Начальные данные (из презентации) ─────────
insert into public.settings (key, value) values
  ('stats', '{"students_total": 2100, "students_2025": 650, "students_2026": 700, "recommend_pct": 80, "years": 5, "countries": 3}')
on conflict (key) do nothing;

insert into public.programs (id, title, duration, language, requirements, points, sort) values
  ('lang', 'Языковые курсы', '1 семестр (4,5–5 мес.) или 2 семестра (9 мес.)', 'Китайский с нуля, преподавание на английском', 'Возраст 16–34 года',
    array['Рекомендуемый уровень английского перед отъездом — B1', 'Занятия на территории университетов и колледжей Китая', 'Можно на гранте: Центральный, Южный и Северный Китай'], 1),
  ('college', 'Колледж 1+2', '3 года', 'Первый год — китайский, затем специальность', 'От 16,5–17 лет, база 9 классов',
    array['По окончании — диплом о среднем специальном образовании', 'Направления: E-commerce, International Business, Digital Media', 'На некоторых программах обязательно интервью'], 2),
  ('bach-en', 'Бакалавриат на английском', '4 года', 'Английский', 'Аттестат 11 классов, с 17 лет; IELTS, TOEFL или Duolingo по требованиям вуза',
    array['Профильные дисциплины с первого курса', 'Бизнес и экономика, IT и ИИ, инженерия, архитектура, туризм, дизайн', 'Подбираем программу в разных городах и провинциях'], 3),
  ('bach-cn', 'Бакалавриат на китайском', '4 года', 'Китайский', 'Аттестат 11 классов, с 17 лет',
    array['Для гранта: HSK 4 от 250 баллов, HSKK от 60, CSCA от 80', 'IT, компьютерные науки, ИИ, бизнес, финансы, логистика, дизайн', 'Полный грант, грант с проживанием или частичный грант'], 4)
on conflict (id) do nothing;

insert into public.faq (q, a, sort)
select * from (values
  ('Сколько стоит обучение?', 'От $1 500 до $5 500 в год за обучение и проживание. Цена зависит от университета, специальности, общежития и размера гранта или скидки. На грантовых программах обучение может быть бесплатным.', 1),
  ('Можно ли поступить после 9 класса?', 'Да. Есть колледжи по программе 1+2 и на базе 9 класса, принимаем с 15–16 лет. Например, колледж в Наньчане (провинция Цзянси): обучение и проживание $1 500 в год, студенты из Кыргызстана поступают туда только через Datcom.', 2),
  ('Нужно ли знать китайский язык?', 'Нет. Языковые курсы начинаются с нуля, а бакалавриат можно пройти на английском. Для бакалавриата на китайском на грант нужны HSK 4, HSKK и экзамен CSCA.', 3),
  ('Что такое CSCA?', 'Стандартизированный экзамен для иностранцев, которые поступают на бакалавриат в Китае. Каждый предмет сдаётся отдельно по шкале 0–100. Стоимость: 450 юаней за один предмет, 700 юаней за два и больше. Набор предметов зависит от вуза и специальности.', 4),
  ('Признаётся ли китайский диплом в Кыргызстане?', 'Между Кыргызстаном и Китаем действует соглашение о взаимном признании документов об образовании. Порядок зависит от программы.', 5),
  ('Вы встречаете студентов в Китае?', 'Да. Встречаем в аэропорту, довозим до университета, помогаем пройти регистрацию, заселиться и поддерживаем в первые дни учёбы.', 6)
) v(q, a, sort)
where not exists (select 1 from public.faq);

insert into public.gallery (src, caption, sort)
select * from (values
  ('/img/campus.jpg', 'Современные кампусы', 1),
  ('/img/dorm.jpg', 'Общежития', 2),
  ('/img/library.jpg', 'Библиотеки и читальные залы', 3),
  ('/img/canteen.jpg', 'Студенческая столовая', 4),
  ('/img/culture.jpg', 'Национальные дни Кыргызстана', 5),
  ('/img/wall.jpg', 'Поездки и путешествия', 6)
) v(src, caption, sort)
where not exists (select 1 from public.gallery);
