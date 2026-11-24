import { useEffect, useState } from "react"
import { Plus, Save, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { ProgramRow } from "@/lib/data"
import { supabase } from "@/lib/supabase"

type Draft = ProgramRow & { pointsText: string; isNew?: boolean }

const toDraft = (p: ProgramRow): Draft => ({ ...p, pointsText: p.points.join("\n") })

export function ProgramsPage() {
  const [rows, setRows] = useState<Draft[]>([])

  useEffect(() => {
    supabase!
      .from("programs")
      .select("*")
      .order("sort")
      .then(({ data, error }) => (error ? toast.error("Не удалось загрузить") : setRows((data as ProgramRow[]).map(toDraft))))
  }, [])

  const set = (i: number, patch: Partial<Draft>) => setRows((r) => r.map((x, j) => (j === i ? { ...x, ...patch } : x)))

  async function save(d: Draft) {
    if (!d.id.trim() || !d.title.trim()) return toast.error("Заполните код и название")
    const row = {
      id: d.id.trim(),
      title: d.title,
      duration: d.duration,
      language: d.language,
      requirements: d.requirements,
      points: d.pointsText.split("\n").map((s) => s.trim()).filter(Boolean),
      sort: Number(d.sort) || 0,
    }
    const { error } = await supabase!.from("programs").upsert(row)
    if (error) return toast.error("Не сохранилось")
    setRows((r) => r.map((x) => (x === d ? { ...toDraft(row) } : x)))
    toast.success("Программа сохранена")
  }

  async function remove(d: Draft) {
    if (!confirm(`Удалить программу «${d.title}»?`)) return
    if (!d.isNew) {
      const { error } = await supabase!.from("programs").delete().eq("id", d.id)
      if (error) return toast.error("Не удалилось")
    }
    setRows((r) => r.filter((x) => x !== d))
    toast.success("Удалено")
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Программы</h1>
        <Button
          size="sm"
          onClick={() =>
            setRows((r) => [...r, { id: "", title: "", duration: "", language: "", requirements: "", points: [], pointsText: "", sort: r.length + 1, isNew: true }])
          }
        >
          <Plus /> Добавить
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">Программы показываются на сайте вкладками в порядке поля «Порядок».</p>
      {rows.map((d, i) => (
        <div key={d.isNew ? `new-${i}` : d.id} className="grid gap-4 rounded-2xl border bg-card p-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Название</Label>
            <Input value={d.title} onChange={(e) => set(i, { title: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Код (латиницей)</Label>
              <Input value={d.id} disabled={!d.isNew} onChange={(e) => set(i, { id: e.target.value.replace(/[^a-z0-9-]/gi, "").toLowerCase() })} />
            </div>
            <div className="space-y-2">
              <Label>Порядок</Label>
              <Input type="number" value={d.sort ?? 0} onChange={(e) => set(i, { sort: Number(e.target.value) })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Срок</Label>
            <Input value={d.duration} onChange={(e) => set(i, { duration: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Язык обучения</Label>
            <Input value={d.language} onChange={(e) => set(i, { language: e.target.value })} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Условия</Label>
            <Input value={d.requirements} onChange={(e) => set(i, { requirements: e.target.value })} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Пункты (каждый с новой строки)</Label>
            <Textarea rows={4} value={d.pointsText} onChange={(e) => set(i, { pointsText: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 md:col-span-2">
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
