import { useEffect, useRef, useState } from "react"
import { Save, Trash2, Upload } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { GalleryItem } from "@/lib/data"
import { supabase } from "@/lib/supabase"

const MAX_MB = 8

export function GalleryPage() {
  const [rows, setRows] = useState<GalleryItem[]>([])
  const [busy, setBusy] = useState(false)
  const file = useRef<HTMLInputElement>(null)

  useEffect(() => {
    supabase!
      .from("gallery")
      .select("*")
      .order("sort")
      .then(({ data, error }) => (error ? toast.error("Не удалось загрузить") : setRows(data as GalleryItem[])))
  }, [])

  const set = (id: number, patch: Partial<GalleryItem>) => setRows((r) => r.map((x) => (x.id === id ? { ...x, ...patch } : x)))

  async function upload(f: File) {
    if (!f.type.startsWith("image/")) return toast.error("Нужен файл с картинкой")
    if (f.size > MAX_MB * 1024 * 1024) return toast.error(`Фото больше ${MAX_MB} МБ, уменьшите его`)
    setBusy(true)
    const ext = (f.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "")
    const path = `gallery/${crypto.randomUUID()}.${ext}`
    const up = await supabase!.storage.from("media").upload(path, f, { contentType: f.type })
    if (up.error) {
      setBusy(false)
      return toast.error("Фото не загрузилось")
    }
    const src = supabase!.storage.from("media").getPublicUrl(path).data.publicUrl
    const sort = (rows.at(-1)?.sort ?? rows.length) + 1
    const ins = await supabase!.from("gallery").insert({ src, caption: "", sort }).select().single()
    setBusy(false)
    if (ins.error) return toast.error("Не сохранилось")
    setRows((r) => [...r, ins.data as GalleryItem])
    toast.success("Фото добавлено. Добавьте подпись и сохраните.")
  }

  async function save(g: GalleryItem) {
    const { error } = await supabase!.from("gallery").update({ caption: g.caption, sort: Number(g.sort) || 0 }).eq("id", g.id!)
    if (error) return toast.error("Не сохранилось")
    toast.success("Сохранено")
  }

  async function remove(g: GalleryItem) {
    if (!confirm("Удалить это фото с сайта?")) return
    const { error } = await supabase!.from("gallery").delete().eq("id", g.id!)
    if (error) return toast.error("Не удалилось")
    const marker = "/storage/v1/object/public/media/"
    if (g.src.includes(marker)) await supabase!.storage.from("media").remove([g.src.split(marker)[1]])
    setRows((r) => r.filter((x) => x.id !== g.id))
    toast.success("Удалено")
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Фото «Жизнь в Китае»</h1>
        <Button size="sm" disabled={busy} onClick={() => file.current?.click()}>
          <Upload /> {busy ? "Загружаем…" : "Загрузить фото"}
        </Button>
        <input
          ref={file}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) upload(f)
            e.target.value = ""
          }}
        />
      </div>
      <p className="text-sm text-muted-foreground">Лучше вертикальные фото (3:4), до {MAX_MB} МБ. Порядок — номер в ленте слева направо.</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((g) => (
          <div key={g.id} className="overflow-hidden rounded-2xl border bg-card">
            <img src={g.src} alt={g.caption} className="aspect-[4/3] w-full object-cover" />
            <div className="space-y-2 p-3">
              <Input placeholder="Подпись" value={g.caption} onChange={(e) => set(g.id!, { caption: e.target.value })} />
              <div className="flex items-center gap-2">
                <Input type="number" className="w-20" value={g.sort ?? 0} onChange={(e) => set(g.id!, { sort: Number(e.target.value) })} aria-label="Порядок" />
                <Button size="sm" className="flex-1" onClick={() => save(g)}>
                  <Save /> Сохранить
                </Button>
                <Button size="icon-sm" variant="ghost" className="text-destructive" onClick={() => remove(g)} aria-label="Удалить">
                  <Trash2 />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
