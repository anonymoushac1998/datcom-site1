import { useEffect, useState } from "react"
import { Save } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { defaultStats, type Stats } from "@/lib/data"
import { supabase } from "@/lib/supabase"

const fields: { key: keyof Stats; label: string }[] = [
  { key: "students_total", label: "Всего студентов (2 100+)" },
  { key: "students_2025", label: "Уехали в 2025 году" },
  { key: "students_2026", label: "Поступили на 2026 год" },
  { key: "recommend_pct", label: "% по рекомендациям" },
  { key: "years", label: "Лет работы" },
  { key: "countries", label: "Стран, откуда студенты" },
]

export function StatsPage() {
  const [stats, setStats] = useState<Stats>(defaultStats)

  useEffect(() => {
    supabase!
      .from("settings")
      .select("value")
      .eq("key", "stats")
      .maybeSingle()
      .then(({ data }) => data && setStats({ ...defaultStats, ...(data.value as Partial<Stats>) }))
  }, [])

  async function save() {
    const { error } = await supabase!.from("settings").upsert({ key: "stats", value: stats })
    if (error) return toast.error("Не сохранилось")
    toast.success("Цифры обновлены на сайте")
  }

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">Цифры на сайте</h1>
      <div className="grid gap-4 rounded-2xl border bg-card p-5 sm:grid-cols-2">
        {fields.map((f) => (
          <div key={f.key} className="space-y-2">
            <Label htmlFor={f.key}>{f.label}</Label>
            <Input id={f.key} type="number" min={0} value={stats[f.key]} onChange={(e) => setStats((s) => ({ ...s, [f.key]: Number(e.target.value) }))} />
          </div>
        ))}
        <div className="sm:col-span-2">
          <Button onClick={save}>
            <Save /> Сохранить
          </Button>
        </div>
      </div>
    </div>
  )
}
