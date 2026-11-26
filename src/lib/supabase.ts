import { createClient } from "@supabase/supabase-js"

// trim(): лишний пробел или перенос строки в переменной Vercel ломает адрес и ключ
const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim().replace(/\/+$/, "")
const key = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim()

/** null, если Supabase не настроен: тогда сайт показывает встроенные тексты, а админка недоступна. */
export const supabase = url && key ? createClient(url, key) : null

/** Адрес проекта Supabase без протокола: показываем в админке, чтобы сверить с нужным проектом. */
export const supabaseHost = url ? url.replace(/^https?:\/\//, "") : ""
