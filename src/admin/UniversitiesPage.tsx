import { useEffect, useRef, useState } from "react"
import { ImagePlus, Plus, Save, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { University } from "@/content"
import { supabase, supabaseHost } from "@/lib/supabase"

type Draft = University & { key: string }

const MAX_MB = 8
const empty = (sort: number): Draft => ({
  key: crypto.randomUUID(),
  name: "",
  kind: "university",
  city: "",
  province: "",
  programs: "",
  cost: "",
  conditions: "",
  image: "",
  video_url: "",
  featured: false,
  published: true,
  sort,
})

export function UniversitiesPage() {
  const [rows, setRows] = useState<Draft[]>([])
  const [missing, setMissing] = useState<null | { table: boolean; text: string }>(null)
  const [uploading, setUploading] = useState<string | null>(null)
  const file = useRef<HTMLInputElement>(null)
  const target = useRef<string | null>(null)

  useEffect(() => {
    supabase!
      .from("universities")
      .select("*")
      .order("sort")
      .then(({ data, error }) => {
        if (error) {
          const table = error.code === "42P01" || error.code === "PGRST205" || /does not exist|schema cache/i.test(error.message)
          setMissing({ table, text: [error.code, error.message].filter(Boolean).join(": ") })
          return
        }
        setRows((data as University[]).map((u) => ({ ...u, video_url: u.video_url ?? "", key: String(u.id) })))
      })
  }, [])

  const set = (k: string, patch: Partial<Draft>) => setRows((r) => r.map((x) => (x.key === k ? { ...x, ...patch } : x)))

  async function upload(k: string, f: File) {
    if (!f.type.startsWith("image/")) return toast.error("Нужен файл с картинкой")
    if (f.size > MAX_MB * 1024 * 1024) return toast.error(`Фото больше ${MAX_MB} МБ, уменьшите его`)
    setUploading(k)
    const ext = (f.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "")
    const path = `universities/${crypto.randomUUID()}.${ext}`
    const up = await supabase!.storage.from("media").upload(path, f, { contentType: f.type })
    setUploading(null)
    if (up.error) return toast.error("Фото не загрузилось")
    set(k, { image: supabase!.storage.from("media").getPublicUrl(path).data.publicUrl })
    toast.success("Фото загружено. Нажмите «Сохранить».")
  }

  async function save(d: Draft) {
    if (!d.name.trim()) return toast.error("Укажите название")
    const row = {
      name: d.name.trim(),
      kind: d.kind,
      city: d.city,
      province: d.province,
      programs: d.programs,
      cost: d.cost,
      conditions: d.conditions,
      image: d.image,
      video_url: d.video_url ?? "",
      featured: Boolean(d.featured),
      published: d.published !== false,
      sort: Number(d.sort) || 0,
    }
    const res = d.id
      ? await supabase!.from("universities").update(row).eq("id", d.id).select().single()
      : await supabase!.from("universities").insert(row).select().single()
    if (res.error) return toast.error("Не сохранилось")
    set(d.key, { id: (res.data as University).id })
    toast.success("Сохранено")
  }

  async function remove(d: Draft) {
    if (!confirm(`Удалить «${d.name || "без названия"}»?`)) return
    if (d.id) {
      const { error } = await supabase!.from("universities").delete().eq("id", d.id)
      if (error) return toast.error("Не удалилось")
    }
    setRows((r) => r.filter((x) => x.key !== d.key))
    toast.success("Удалено")
  }

  if (missing)
    return (
      <div className="max-w-2xl space-y-3 rounded-2xl border bg-card p-6">
        <h1 className="text-2xl font-bold">Университеты</h1>
        {missing.table ? (
          <p>
            В базе ещё нет таблицы университетов. Откройте Supabase → SQL Editor, вставьте файл <code>supabase/002_universities.sql</code> из
            репозитория и нажмите Run, затем обновите эту страницу.
          </p>
        ) : (
          <p>
            Таблица есть, но Supabase не отдаёт данные. Запустите в SQL Editor файл <code>supabase/002_universities.sql</code> ещё раз (в нём
            есть нужные права доступа) и обновите страницу.
          </p>
        )}
        <p className="text-sm text-muted-foreground">
          Проект: {supabaseHost}. Ответ Supabase: <code>{missing.text}</code>
        </p>
      </div>
    )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Университеты и колледжи</h1>
        <Button size="sm" onClick={() => setRows((r) => [empty(r.length + 1), ...r])}>
          <Plus /> Добавить
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">Скрытые (без галочки «Показывать на сайте») видны только здесь.</p>
      <input
        ref={file}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f && target.current) upload(target.current, f)
          e.target.value = ""
        }}
      />
      {rows.map((d) => (
        <div key={d.key} className="grid gap-4 rounded-2xl border bg-card p-5 md:grid-cols-[220px_1fr]">
          <div className="space-y-2">
            <div className="aspect-[16/10] overflow-hidden rounded-xl bg-muted">
              {d.image ? <img src={d.image} alt="" className="size-full object-cover" /> : <div className="flex size-full items-center justify-center text-sm text-muted-foreground">Нет фото</div>}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              disabled={uploading === d.key}
              onClick={() => {
                target.current = d.key
                file.current?.click()
              }}
            >
              <ImagePlus /> {uploading === d.key ? "Загружаем…" : "Загрузить фото"}
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Название</Label>
              <Input value={d.name} onChange={(e) => set(d.key, { name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Тип</Label>
              <select value={d.kind} onChange={(e) => set(d.key, { kind: e.target.value as University["kind"] })} className="h-9 w-full rounded-lg border bg-background px-3 text-sm">
                <option value="university">Университет</option>
                <option value="college">Колледж</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Город</Label>
                <Input value={d.city} onChange={(e) => set(d.key, { city: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Провинция</Label>
                <Input value={d.province} onChange={(e) => set(d.key, { province: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Программы и факультеты</Label>
              <Textarea rows={2} value={d.programs} onChange={(e) => set(d.key, { programs: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Условия поступления</Label>
              <Input value={d.conditions} onChange={(e) => set(d.key, { conditions: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Стоимость</Label>
              <Input value={d.cost} onChange={(e) => set(d.key, { cost: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Ссылка на видео (YouTube)</Label>
              <Input value={d.video_url ?? ""} placeholder="https://youtube.com/…" onChange={(e) => set(d.key, { video_url: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Порядок</Label>
              <Input type="number" value={d.sort ?? 0} onChange={(e) => set(d.key, { sort: Number(e.target.value) })} />
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm sm:col-span-2">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={d.published !== false} onChange={(e) => set(d.key, { published: e.target.checked })} /> Показывать на сайте
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={Boolean(d.featured)} onChange={(e) => set(d.key, { featured: e.target.checked })} /> Отметка «Только через Datcom»
              </label>
            </div>
            <div className="flex justify-end gap-2 sm:col-span-2">
              <Button variant="ghost" className="text-destructive" onClick={() => remove(d)}>
                <Trash2 /> Удалить
              </Button>
              <Button onClick={() => save(d)}>
                <Save /> Сохранить
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
