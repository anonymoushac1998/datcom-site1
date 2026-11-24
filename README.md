# Datcom — лендинг

Одностраничный сайт Datcom (учёба в Китае): Vite + React + TypeScript, Tailwind v4, shadcn/ui, Motion, Anime.js.

```bash
npm install
npm run dev     # локально
npm run build   # сборка в dist/
```

Деплой: Vercel определяет Vite автоматически (Build: `npm run build`, Output: `dist`).
Тексты: `src/content.ts` и `src/App.tsx`. Фото: `public/img/`. Заявки с формы открывают WhatsApp +996 706 718 888.

## Админ-панель (`/admin`) и Supabase

Без Supabase сайт работает на встроенных текстах (`src/content.ts`), форма открывает WhatsApp, а `/admin` показывает «База не подключена».

Подключение:
1. Supabase → New project.
2. SQL Editor → вставить `supabase/schema.sql` целиком → Run (таблицы, права доступа, хранилище фото `media`, начальные данные).
3. Authentication → Users → Add user → почта и пароль администратора (галочка Auto Confirm).
4. SQL Editor: `insert into public.admins (user_id) select id from auth.users where email = 'ПОЧТА_АДМИНА';`
5. Vercel → Settings → Environment Variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (Supabase → Project Settings → API) → Redeploy.
6. Открыть `https://ваш-сайт/admin`.

В админке: заявки (статусы, заметки, звонок/WhatsApp, выгрузка CSV), программы, частые вопросы, фото «Жизнь в Китае», цифры.
Заявка с формы сохраняется в базу и одновременно открывает WhatsApp. Права проверяет сама база (RLS): посетитель может только отправить заявку и читать контент, менять что-либо может только пользователь из таблицы `admins`.
