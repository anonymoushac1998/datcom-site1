import { useEffect, useState, type FormEvent } from "react"
import type { Session } from "@supabase/supabase-js"
import { FileQuestion, GraduationCap, Images, Inbox, LayoutGrid, LogOut, Sigma } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Toaster } from "@/components/ui/sonner"
import { supabase, supabaseHost } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import { LeadsPage } from "./LeadsPage"
import { ProgramsPage } from "./ProgramsPage"
import { FaqPage } from "./FaqPage"
import { GalleryPage } from "./GalleryPage"
import { StatsPage } from "./StatsPage"
import { UniversitiesPage } from "./UniversitiesPage"

const pages = [
  { id: "leads", label: "Заявки", icon: Inbox, el: <LeadsPage /> },
  { id: "programs", label: "Программы", icon: LayoutGrid, el: <ProgramsPage /> },
  { id: "universities", label: "Университеты", icon: GraduationCap, el: <UniversitiesPage /> },
  { id: "faq", label: "Вопросы", icon: FileQuestion, el: <FaqPage /> },
  { id: "gallery", label: "Фото", icon: Images, el: <GalleryPage /> },
  { id: "stats", label: "Цифры", icon: Sigma, el: <StatsPage /> },
] as const

type PageId = (typeof pages)[number]["id"]

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-sm rounded-3xl border bg-card p-8 shadow-xl">
        <img src="/logo.png" alt="Datcom" className="mx-auto mb-6 h-10" />
        {children}
      </div>
    </div>
  )
}

/** Понятное объяснение ошибки входа вместо общего «неверный пароль». */
function explain(error: { message?: string; status?: number; code?: string; name?: string }) {
  const m = `${error.code ?? ""} ${error.message ?? ""}`.toLowerCase()
  if (m.includes("email_not_confirmed") || m.includes("not confirmed"))
    return "Почта не подтверждена. В Supabase → Authentication → Users откройте пользователя и подтвердите почту (Confirm email) или создайте его заново с галочкой Auto Confirm."
  if (m.includes("invalid_credentials") || m.includes("invalid login credentials"))
    return `Неверная почта или пароль для проекта ${supabaseHost}. Проверьте, что пользователь создан именно в этом проекте Supabase.`
  if (m.includes("api key") || m.includes("apikey") || error.status === 401)
    return "Ключ Supabase не подходит. Проверьте переменную VITE_SUPABASE_ANON_KEY в Vercel (ключ из того же проекта) и пересоберите сайт."
  if (error.name === "AuthRetryableFetchError" || m.includes("fetch") || m.includes("network") || error.status === 0)
    return `Не удаётся связаться с ${supabaseHost}. Проверьте переменную VITE_SUPABASE_URL в Vercel (вида https://xxxx.supabase.co) и пересоберите сайт.`
  return `Ошибка входа: ${error.message ?? "неизвестная"}${error.status ? ` (код ${error.status})` : ""}`
}

function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError("")
    const { error } = await supabase!.auth.signInWithPassword({ email: email.trim(), password })
    setBusy(false)
    if (error) setError(explain(error))
  }
  return (
    <Shell>
      <h1 className="mb-6 text-center text-xl font-bold">Вход в админ-панель</h1>
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Почта</Label>
          <Input id="email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pw">Пароль</Label>
          <Input id="pw" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error && <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full" size="lg" disabled={busy}>
          {busy ? "Входим…" : "Войти"}
        </Button>
        <p className="text-center text-xs text-muted-foreground">Проект: {supabaseHost}</p>
      </form>
    </Shell>
  )
}

export default function AdminApp() {
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [isAdmin, setIsAdmin] = useState<boolean | undefined>(undefined)
  const [page, setPage] = useState<PageId>("leads")

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!supabase || !session) return
    setIsAdmin(undefined)
    supabase.rpc("is_admin").then(({ data }) => setIsAdmin(Boolean(data)))
  }, [session])

  if (!supabase)
    return (
      <Shell>
        <p className="text-center text-muted-foreground">
          База не подключена. Добавьте VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY в настройках Vercel и пересоберите сайт.
        </p>
      </Shell>
    )
  if (session === undefined) return <Shell><p className="text-center text-muted-foreground">Загрузка…</p></Shell>
  if (!session) return <Login />
  if (isAdmin === undefined) return <Shell><p className="text-center text-muted-foreground">Проверяем доступ…</p></Shell>
  if (!isAdmin)
    return (
      <Shell>
        <p className="text-center">У этой учётной записи нет доступа к админ-панели.</p>
        <p className="mt-3 text-center text-xs break-all text-muted-foreground">ID: {session.user.id}</p>
        <Button variant="outline" className="mt-6 w-full" onClick={() => supabase!.auth.signOut()}>
          Выйти
        </Button>
      </Shell>
    )

  const current = pages.find((p) => p.id === page)!
  return (
    <div className="min-h-svh bg-muted/40">
      <Toaster position="top-center" richColors />
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Datcom" className="h-7" />
            <span className="hidden text-sm text-muted-foreground sm:inline">Админ-панель</span>
          </div>
          <div className="flex items-center gap-2">
            <a href="/" target="_blank" rel="noreferrer" className="text-sm text-muted-foreground hover:text-foreground">
              Открыть сайт
            </a>
            <Button variant="ghost" size="sm" onClick={() => supabase!.auth.signOut()}>
              <LogOut /> Выйти
            </Button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-2">
          {pages.map((p) => (
            <button
              key={p.id}
              onClick={() => setPage(p.id)}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                page === p.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
              )}
            >
              <p.icon className="size-4" /> {p.label}
            </button>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{current.el}</main>
    </div>
  )
}
