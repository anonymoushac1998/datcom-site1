import { useCallback, useEffect, useState } from "react"
import { Download, MessageCircle, Phone, RefreshCw } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"

type Lead = {
  id: number
  created_at: string
  name: string
  phone: string
  message: string | null
  program: string | null
  status: "new" | "in_progress" | "enrolled" | "rejected"
  note: string | null
}

export const STATUSES: Record<Lead["status"], { label: string; cls: string }> = {
  new: { label: "Новая", cls: "bg-sky-100 text-sky-800" },
  in_progress: { label: "В работе", cls: "bg-amber-100 text-amber-800" },
  enrolled: { label: "Поступил", cls: "bg-emerald-100 text-emerald-800" },
  rejected: { label: "Отказ", cls: "bg-zinc-200 text-zinc-700" },
}

function digits(s: string) {
  return s.replace(/\D/g, "")
}

function csv(rows: Lead[]) {
  const head = ["Дата", "Имя", "Телефон", "Интересует", "Статус", "Заметка"]
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`
  const lines = rows.map((r) =>
    [new Date(r.created_at).toLocaleString("ru-RU"), r.name, r.phone, r.message ?? "", STATUSES[r.status].label, r.note ?? ""].map(esc).join(";"),
  )
  const blob = new Blob(["﻿" + [head.join(";"), ...lines].join("\n")], { type: "text/csv;charset=utf-8" })
  const a = document.createElement("a")
  a.href = URL.createObjectURL(blob)
  a.download = `datcom-zayavki-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
}

export function LeadsPage() {
  const [rows, setRows] = useState<Lead[]>([])
  const [filter, setFilter] = useState<Lead["status"] | "all">("all")
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase!.from("leads").select("*").order("created_at", { ascending: false }).limit(1000)
    setLoading(false)
    if (error) return toast.error("Не удалось загрузить заявки")
    setRows(data as Lead[])
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function update(id: number, patch: Partial<Lead>) {
    const { error } = await supabase!.from("leads").update(patch).eq("id", id)
    if (error) return toast.error("Не сохранилось")
    setRows((r) => r.map((x) => (x.id === id ? { ...x, ...patch } : x)))
    toast.success("Сохранено")
  }

  const shown = filter === "all" ? rows : rows.filter((r) => r.status === filter)
  const count = (s: Lead["status"]) => rows.filter((r) => r.status === s).length

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Заявки</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className={cn(loading && "animate-spin")} /> Обновить
          </Button>
          <Button variant="outline" size="sm" onClick={() => csv(shown)} disabled={!shown.length}>
            <Download /> Excel (CSV)
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => setFilter("all")} className={cn("rounded-full border px-3 py-1 text-sm", filter === "all" && "border-primary bg-primary text-primary-foreground")}>
          Все · {rows.length}
        </button>
        {(Object.keys(STATUSES) as Lead["status"][]).map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={cn("rounded-full border px-3 py-1 text-sm", filter === s && "border-primary bg-primary text-primary-foreground")}>
            {STATUSES[s].label} · {count(s)}
          </button>
        ))}
      </div>

      {!loading && !shown.length && <p className="rounded-2xl border bg-card p-10 text-center text-muted-foreground">Заявок пока нет.</p>}

      <div className="grid gap-3">
        {shown.map((r) => (
          <div key={r.id} className="rounded-2xl border bg-card p-4 md:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-semibold">{r.name}</p>
                  <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", STATUSES[r.status].cls)}>{STATUSES[r.status].label}</span>
                </div>
                <p className="text-sm text-muted-foreground">{new Date(r.created_at).toLocaleString("ru-RU")}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild size="sm" variant="outline">
                  <a href={`tel:+${digits(r.phone)}`}>
                    <Phone /> {r.phone}
                  </a>
                </Button>
                <Button asChild size="sm" className="bg-[#25D366] text-white hover:bg-[#1ebe5a]">
                  <a href={`https://wa.me/${digits(r.phone)}`} target="_blank" rel="noreferrer">
                    <MessageCircle /> WhatsApp
                  </a>
                </Button>
              </div>
            </div>
            {r.message && <p className="mt-3 rounded-xl bg-muted/60 p-3 text-sm">{r.message}</p>}
            <div className="mt-3 grid gap-3 md:grid-cols-[200px_1fr]">
              <select
                value={r.status}
                onChange={(e) => update(r.id, { status: e.target.value as Lead["status"] })}
                className="h-9 rounded-lg border bg-background px-3 text-sm"
                aria-label="Статус"
              >
                {(Object.keys(STATUSES) as Lead["status"][]).map((s) => (
                  <option key={s} value={s}>
                    {STATUSES[s].label}
                  </option>
                ))}
              </select>
              <Textarea
                defaultValue={r.note ?? ""}
                placeholder="Заметка менеджера (сохраняется, когда убираете курсор)"
                className="min-h-9"
                onBlur={(e) => e.target.value !== (r.note ?? "") && update(r.id, { note: e.target.value || null })}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
