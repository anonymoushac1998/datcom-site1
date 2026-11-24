import { useEffect, useState } from "react"
import { Plus, Save, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { FaqItem } from "@/lib/data"
import { supabase } from "@/lib/supabase"

type Draft = FaqItem & { key: string }

export function FaqPage() {
  const [rows, setRows] = useState<Draft[]>([])

  useEffect(() => {
    supabase!
      .from("faq")
      .select("*")
      .order("sort")
      .then(({ data, error }) => (error ? toast.error("Не удалось загрузить") : setRows((data as FaqItem[]).map((f) => ({ ...f, key: String(f.id) })))))
  }, [])

  const set = (k: string, patch: Partial<Draft>) => setRows((r) => r.map((x) => (x.key === k ? { ...x, ...patch } : x)))

  async function save(d: Draft) {
    if (!d.q.trim() || !d.a.trim()) return toast.error("Заполните вопрос и ответ")
    const row = { q: d.q, a: d.a, sort: Number(d.sort) || 0 }
    const res = d.id
      ? await supabase!.from("faq").update(row).eq("id", d.id).select().single()
      : await supabase!.from("faq").insert(row).select().single()
    if (res.error) return toast.error("Не сохранилось")
    set(d.key, { id: (res.data as FaqItem).id })
    toast.success("Сохранено")
  }

  async function remove(d: Draft) {
    if (!confirm("Удалить этот вопрос?")) return
    if (d.id) {
      const { error } = await supabase!.from("faq").delete().eq("id", d.id)
      if (error) return toast.error("Не удалилось")
    }
    setRows((r) => r.filter((x) => x.key !== d.key))
    toast.success("Удалено")
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Частые вопросы</h1>
        <Button size="sm" onClick={() => setRows((r) => [...r, { key: crypto.randomUUID(), q: "", a: "", sort: r.length + 1 }])}>
          <Plus /> Добавить
        </Button>
      </div>
      {rows.map((d) => (
        <div key={d.key} className="space-y-3 rounded-2xl border bg-card p-5">
          <div className="grid gap-3 md:grid-cols-[1fr_120px]">
            <div className="space-y-2">
              <Label>Вопрос</Label>
              <Input value={d.q} onChange={(e) => set(d.key, { q: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Порядок</Label>
              <Input type="number" value={d.sort ?? 0} onChange={(e) => set(d.key, { sort: Number(e.target.value) })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Ответ</Label>
            <Textarea rows={3} value={d.a} onChange={(e) => set(d.key, { a: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" className="text-destructive" onClick={() => remove(d)}>
              <Trash2 /> Удалить
            </Button>
            <Button onClick={() => save(d)}>
              <Save /> Сохранить
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
