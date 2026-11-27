import { useEffect, useState } from "react"

import { faq as faqStatic, gallery as galleryStatic, programs as programsStatic, universities as universitiesStatic, type Program, type University } from "@/content"
import { supabase } from "@/lib/supabase"

export type FaqItem = { id?: number; q: string; a: string; sort?: number }
export type GalleryItem = { id?: number; src: string; caption: string; sort?: number }
export type Stats = {
  students_total: number
  students_2025: number
  students_2026: number
  recommend_pct: number
  years: number
  countries: number
}
export type ProgramRow = Program & { sort?: number }

export const defaultStats: Stats = {
  students_total: 2100,
  students_2025: 650,
  students_2026: 700,
  recommend_pct: 80,
  years: 5,
  countries: 3,
}

export type SiteContent = {
  programs: ProgramRow[]
  faq: FaqItem[]
  gallery: GalleryItem[]
  stats: Stats
  universities: University[]
}

const fallback: SiteContent = { programs: programsStatic, faq: faqStatic, gallery: galleryStatic, stats: defaultStats, universities: universitiesStatic }

/** Контент сайта: сразу встроенные тексты, затем данные из базы (если Supabase подключён). */
export function useSiteContent(): SiteContent {
  const [content, setContent] = useState(fallback)
  useEffect(() => {
    if (!supabase) return
    const sb = supabase
    let alive = true
    ;(async () => {
      const [p, f, g, s, u] = await Promise.all([
        sb.from("programs").select("*").order("sort"),
        sb.from("faq").select("*").order("sort"),
        sb.from("gallery").select("*").order("sort"),
        sb.from("settings").select("value").eq("key", "stats").maybeSingle(),
        sb.from("universities").select("*").eq("published", true).order("sort"),
      ])
      if (!alive) return
      setContent({
        programs: p.data?.length ? (p.data as ProgramRow[]) : fallback.programs,
        faq: f.data?.length ? (f.data as FaqItem[]) : fallback.faq,
        gallery: g.data?.length ? (g.data as GalleryItem[]) : fallback.gallery,
        stats: { ...defaultStats, ...((s.data?.value as Partial<Stats>) ?? {}) },
        // таблицы может ещё не быть (002_universities.sql не запущен) — тогда встроенный список
        universities: u.error ? fallback.universities : (u.data as University[]),
      })
    })().catch(() => {})
    return () => {
      alive = false
    }
  }, [])
  return content
}

/** Сохраняет заявку в базу. Ошибку не показываем посетителю: заявка всё равно уходит в WhatsApp. */
export async function saveLead(lead: { name: string; phone: string; message: string; program?: string }) {
  if (!supabase) return
  try {
    await supabase.from("leads").insert({
      name: lead.name.slice(0, 120),
      phone: lead.phone.slice(0, 40),
      message: lead.message.slice(0, 2000) || null,
      program: lead.program?.slice(0, 120) || null,
    })
  } catch {
    /* сеть недоступна — заявка всё равно уйдёт в WhatsApp */
  }
}
