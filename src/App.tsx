import { useEffect, useRef, useState, type ReactNode } from "react"
import { animate, stagger } from "animejs"
import {
  AnimatePresence,
  MotionConfig,
  motion,
  useInView,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react"
import { ArrowRight, ArrowUpRight, MapPin, MessageCircle, Phone, Plane, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { achievements, steps } from "@/content"
import { saveLead, useSiteContent, type SiteContent } from "@/lib/data"
import { cn } from "@/lib/utils"

const EASE = [0.22, 1, 0.36, 1] as const
const WA = "https://wa.me/996706718888"

function Instagram({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
    </svg>
  )
}

/* ───────────── общие анимации ───────────── */

function Reveal({ children, className, delay = 0, y = 40 }: { children: ReactNode; className?: string; delay?: number; y?: number }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y, filter: "blur(8px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.8, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  )
}

/* Заголовок: слова выезжают из-под маски при появлении на экране */
function MaskHeading({ text, className, as: Tag = "h2" }: { text: string; className?: string; as?: "h1" | "h2" }) {
  const ref = useRef<HTMLHeadingElement>(null)
  const inView = useInView(ref, { once: true, margin: "-60px" })
  return (
    <Tag ref={ref} className={className}>
      {text.split(" ").map((w, i) => (
        <span key={i} className="inline-block overflow-hidden pb-[0.12em] align-bottom">
          <motion.span
            className="inline-block"
            initial={{ y: "110%" }}
            animate={inView ? { y: "0%" } : {}}
            transition={{ duration: 0.9, ease: EASE, delay: i * 0.06 }}
          >
            {w}&nbsp;
          </motion.span>
        </span>
      ))}
    </Tag>
  )
}

function Eyebrow({ children, dark }: { children: ReactNode; dark?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold tracking-widest uppercase",
        dark ? "border-white/15 bg-white/5 text-sky-200" : "border-primary/15 bg-primary/5 text-primary",
      )}
    >
      <span className={cn("size-1.5 rounded-full", dark ? "bg-sky-300" : "bg-primary")} />
      {children}
    </span>
  )
}

/* Anime.js: счётчик */
function Counter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  useEffect(() => {
    if (!inView || !ref.current) return
    const el = ref.current
    const o = { v: 0 }
    animate(o, {
      v: value,
      duration: 2200,
      ease: "outExpo",
      onUpdate: () => {
        el.textContent = Math.round(o.v).toLocaleString("ru-RU") + suffix
      },
    })
  }, [inView, value, suffix])
  return <span ref={ref}>0{suffix}</span>
}

/* Anime.js: живой градиентный фон (плавающие световые пятна) */
function Aurora() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!ref.current || matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const blobs = ref.current.querySelectorAll(".blob")
    const anims = Array.from(blobs).map((b, i) =>
      animate(b, {
        translateX: [0, i % 2 ? -120 : 140, 0],
        translateY: [0, i % 2 ? 90 : -80, 0],
        scale: [1, 1.25, 1],
        duration: 14000 + i * 3000,
        ease: "inOutSine",
        loop: true,
      }),
    )
    return () => anims.forEach((a) => a.pause())
  }, [])
  return (
    <div ref={ref} className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="blob absolute -top-40 -left-32 size-[38rem] rounded-full bg-[#1e6bff]/40 blur-[120px]" />
      <div className="blob absolute top-20 right-[-10rem] size-[34rem] rounded-full bg-[#00c2ff]/25 blur-[120px]" />
      <div className="blob absolute bottom-[-12rem] left-1/3 size-[30rem] rounded-full bg-[#7c5cff]/25 blur-[120px]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,.04)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
    </div>
  )
}

/* ───────────── навигация ───────────── */

function Nav() {
  const { scrollY } = useScroll()
  const [scrolled, setScrolled] = useState(false)
  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 40))
  const links = [
    ["О нас", "#about"],
    ["Программы", "#programs"],
    ["Путь", "#path"],
    ["Жизнь", "#life"],
    ["FAQ", "#faq"],
  ]
  return (
    <motion.header
      className="fixed inset-x-0 top-3 z-50 px-3"
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: EASE, delay: 0.2 }}
    >
      <div
        className={cn(
          "mx-auto flex h-14 max-w-6xl items-center justify-between rounded-full border px-2 pl-5 transition-all duration-500",
          scrolled ? "border-black/5 bg-white/75 shadow-lg shadow-black/5 backdrop-blur-xl" : "border-white/10 bg-white/5 backdrop-blur-md",
        )}
      >
        <a href="#" aria-label="Datcom — учёба за границей">
          <img src={scrolled ? "/logo.png" : "/logo-white.png"} alt="Datcom" className="h-8 w-auto" />
        </a>
        <nav className={cn("hidden gap-1 text-sm font-medium lg:flex", scrolled ? "text-foreground/70" : "text-white/75")}>
          {links.map(([label, href]) => (
            <a key={href} href={href} className={cn("rounded-full px-4 py-2 transition-colors", scrolled ? "hover:bg-black/5 hover:text-foreground" : "hover:bg-white/10 hover:text-white")}>
              {label}
            </a>
          ))}
        </nav>
        <Button asChild size="lg" className="rounded-full">
          <a href="#contact">
            Консультация <ArrowUpRight />
          </a>
        </Button>
      </div>
    </motion.header>
  )
}

function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30 })
  return <motion.div style={{ scaleX }} className="fixed inset-x-0 top-0 z-[60] h-1 origin-left bg-gradient-to-r from-primary via-sky-400 to-violet-400" />
}

/* ───────────── главный экран ───────────── */

function Hero() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] })
  const imgY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"])
  const imgScale = useTransform(scrollYProgress, [0, 1], [1, 1.12])
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "-30%"])
  const chips = useRef<HTMLDivElement>(null)

  /* Anime.js: стеклянные плашки «выпрыгивают» с пружиной */
  useEffect(() => {
    if (!chips.current) return
    animate(chips.current.querySelectorAll(".chip"), {
      opacity: [0, 1],
      translateY: [30, 0],
      scale: [0.9, 1],
      delay: stagger(140, { start: 1200 }),
      duration: 900,
      ease: "outBack(1.4)",
    })
  }, [])

  return (
    <section ref={ref} className="relative overflow-hidden bg-[#020a1c] text-white">
      <Aurora />
      <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-4 pt-32 pb-20 md:pt-40 lg:grid-cols-[1.1fr_1fr] lg:pb-28">
        <motion.div style={{ y: textY }}>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.6 }}>
            <Eyebrow dark>№ 1 в Кыргызстане по учёбе в Китае</Eyebrow>
          </motion.div>
          <MaskHeading
            as="h1"
            text="Учёба в Китае без стресса"
            className="mt-6 text-5xl leading-[0.95] font-extrabold tracking-[-0.04em] sm:text-6xl lg:text-[5.5rem]"
          />
          <motion.p
            className="mt-6 max-w-lg text-lg text-white/65"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8, ease: EASE }}
          >
            Университет, документы, приглашение, виза, встреча в аэропорту и общежитие. Ведём студента от первой
            консультации до первого дня учёбы.
          </motion.p>
          <motion.div
            className="mt-10 flex flex-wrap gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.8, ease: EASE }}
          >
            <Button asChild size="lg" className="h-13 rounded-full bg-white px-7 text-base text-[#01214a] hover:bg-sky-100">
              <a href="#contact">
                Бесплатная консультация <ArrowRight />
              </a>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-13 rounded-full border-white/20 bg-white/5 px-7 text-base text-white hover:bg-white/10 hover:text-white">
              <a href="#programs">Программы</a>
            </Button>
          </motion.div>
        </motion.div>

        <div ref={chips} className="relative">
          <motion.div
            className="relative overflow-hidden rounded-[2rem] border border-white/10"
            initial={{ clipPath: "inset(100% 0% 0% 0% round 2rem)" }}
            animate={{ clipPath: "inset(0% 0% 0% 0% round 2rem)" }}
            transition={{ duration: 1.3, ease: EASE, delay: 0.3 }}
          >
            <motion.img
              style={{ y: imgY, scale: imgScale }}
              src="/img/team.jpg"
              alt="Команда и студенты Datcom"
              className="aspect-[4/5] w-full object-cover sm:aspect-[4/3] lg:aspect-[4/5]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#020a1c]/70 via-transparent" />
          </motion.div>
          <div className="chip absolute -bottom-6 -left-2 rounded-2xl border border-white/15 bg-white/10 p-4 opacity-0 shadow-2xl backdrop-blur-xl sm:-left-8">
            <p className="text-3xl font-extrabold">2 100+</p>
            <p className="text-sm text-white/70">студентов за 5 лет</p>
          </div>
          <div className="chip absolute top-6 -right-2 flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 p-3 pr-4 opacity-0 shadow-2xl backdrop-blur-xl sm:-right-6">
            <span className="flex size-10 items-center justify-center rounded-xl bg-sky-400/20">
              <Plane className="size-5 text-sky-200" />
            </span>
            <div>
              <p className="text-sm font-semibold">Встреча в Китае</p>
              <p className="text-xs text-white/60">аэропорт → кампус</p>
            </div>
          </div>
        </div>
      </div>
      <Marquee />
    </section>
  )
}

const cities = ["Пекин", "Шанхай", "Ухань", "Сиань", "Чэнду", "Нанкин", "Ханчжоу", "Чжэнчжоу", "Наньчан", "Циндао", "Сучжоу", "Чанша", "Тяньцзинь", "Шэньчжэнь"]

function Marquee() {
  return (
    <div className="relative border-t border-white/10 py-6 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
      <motion.div
        className="flex w-max gap-10 text-2xl font-semibold whitespace-nowrap text-white/40 md:text-3xl"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 40, ease: "linear", repeat: Infinity }}
      >
        {[...cities, ...cities].map((c, i) => (
          <span key={i} className="flex items-center gap-10">
            {c}
            <span className="size-2 rounded-full bg-sky-400/60" />
          </span>
        ))}
      </motion.div>
    </div>
  )
}

/* ───────────── бенто: цифры и история ───────────── */

function Bento({ stats }: { stats: SiteContent["stats"] }) {
  const card = "relative overflow-hidden rounded-[1.75rem] border bg-card p-5 md:p-7"
  return (
    <section id="about" className="mx-auto max-w-6xl px-4 py-24 md:py-32">
      <div className="mb-14 max-w-3xl">
        <Eyebrow>Datcom в цифрах</Eyebrow>
        <MaskHeading text="Образование, которому доверяют семьи" className="mt-5 text-4xl font-extrabold tracking-[-0.03em] md:text-6xl" />
      </div>
      <div className="grid auto-rows-[minmax(150px,auto)] grid-cols-2 gap-3 md:auto-rows-[minmax(180px,auto)] md:grid-cols-4 md:gap-4">
        <Reveal className={cn(card, "flex flex-col justify-between border-0 bg-primary text-primary-foreground  col-span-2 md:row-span-2")}>
          <div className="absolute -top-24 -right-24 size-72 rounded-full bg-sky-400/30 blur-3xl" />
          <p className="relative text-sm font-medium opacity-80">Студентов отправили на учёбу</p>
          <div className="relative">
            <p className="text-7xl font-extrabold tracking-tight md:text-8xl">
              <Counter value={stats.students_total} suffix="+" />
            </p>
            <p className="mt-2 max-w-xs opacity-80">за {stats.years} лет. {stats.students_2025} уехали в 2025 году, {stats.students_2026} уже поступили на 2026 год.</p>
          </div>
        </Reveal>
        <Reveal delay={0.05} className={cn(card, "col-span-2")}>
          <p className="text-6xl font-extrabold tracking-tight text-primary">
            <Counter value={stats.recommend_pct} suffix="%" />
          </p>
          <p className="mt-3 text-muted-foreground">клиентов приходят по рекомендациям друзей, знакомых и бывших студентов</p>
        </Reveal>
        <Reveal delay={0.1} className={card}>
          <p className="text-5xl font-extrabold tracking-tight">
            <Counter value={stats.years} />
          </p>
          <p className="mt-3 text-sm text-muted-foreground">лет ни одного студента без приглашения</p>
        </Reveal>
        <Reveal delay={0.15} className={card}>
          <p className="text-5xl font-extrabold tracking-tight">
            <Counter value={stats.countries} />
          </p>
          <p className="mt-3 text-sm text-muted-foreground">страны: Кыргызстан, Казахстан, Россия</p>
        </Reveal>
        <Reveal delay={0.05} className={cn(card, "group p-0  col-span-2 md:row-span-2")}>
          <img src="/img/student.jpg" alt="Студентка Datcom с приглашением" className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
          <div className="relative flex h-full min-h-80 flex-col justify-end p-7 text-white">
            <p className="text-sm text-white/70">Наша история</p>
            <p className="mt-2 text-2xl leading-snug font-bold">
              Основатели учились в Китае и Италии. Datcom назван в честь дочери основателя, Даткайым.
            </p>
          </div>
        </Reveal>
        <Reveal delay={0.1} className={cn(card, "bg-muted/60  col-span-2")}>
          <p className="text-2xl leading-snug font-semibold">
            «Наша задача — помочь поступить на подходящих условиях, а не просто оформить документы.»
          </p>
          <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="size-4 text-primary" /> Бишкек · филиал в Оше
          </p>
        </Reveal>
        {achievements.slice(0, 2).map((a, i) => (
          <Reveal key={a.title} delay={0.1 + i * 0.05} className={card}>
            <p className="text-lg font-bold">{a.title}</p>
            <p className="mt-2 text-sm text-muted-foreground">{a.text}</p>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

/* ───────────── программы ───────────── */

function Programs({ programs }: { programs: SiteContent["programs"] }) {
  const [activeId, setActive] = useState<string | null>(null)
  const p = programs.find((x) => x.id === activeId) ?? programs[0]
  const active = p?.id
  if (!p) return null
  return (
    <section id="programs" className="relative overflow-hidden bg-[#020a1c] py-24 text-white md:py-32">
      <div className="pointer-events-none absolute top-0 left-1/2 h-96 w-[60rem] -translate-x-1/2 rounded-full bg-primary/40 blur-[140px]" />
      <div className="relative mx-auto max-w-6xl px-4">
        <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <Eyebrow dark>Программы</Eyebrow>
            <MaskHeading text="Четыре пути в Китай" className="mt-5 text-4xl font-extrabold tracking-[-0.03em] md:text-6xl" />
          </div>
          <p className="max-w-sm text-white/60">От $1 500 до $5 500 в год за обучение и проживание. Полные и частичные гранты.</p>
        </div>

        <div className="mb-8 flex gap-2 overflow-x-auto rounded-full border border-white/10 bg-white/5 p-1.5 [scrollbar-width:none]">
          {programs.map((x) => (
            <button
              key={x.id}
              onClick={() => setActive(x.id)}
              className={cn("relative shrink-0 rounded-full px-5 py-2.5 text-sm font-medium transition-colors", active === x.id ? "text-[#01214a]" : "text-white/70 hover:text-white")}
            >
              {active === x.id && <motion.span layoutId="tab-pill" className="absolute inset-0 rounded-full bg-white" transition={{ type: "spring", stiffness: 380, damping: 32 }} />}
              <span className="relative">{x.title}</span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 24, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -16, filter: "blur(6px)" }}
            transition={{ duration: 0.45, ease: EASE }}
            className="grid gap-4 md:grid-cols-3"
          >
            {[
              ["Срок", p.duration],
              ["Язык обучения", p.language],
              ["Условия", p.requirements],
            ].map(([k, v]) => (
              <div key={k} className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur">
                <p className="text-sm text-white/50">{k}</p>
                <p className="mt-2 text-lg font-semibold">{v}</p>
              </div>
            ))}
            <div className="rounded-[1.5rem] border border-white/10 bg-gradient-to-br from-primary/60 to-sky-500/20 p-6 md:col-span-3 md:flex md:items-center md:justify-between md:gap-8">
              <ul className="space-y-2">
                {p.points.map((pt) => (
                  <li key={pt} className="flex gap-3">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-sky-300" />
                    {pt}
                  </li>
                ))}
              </ul>
              <Button asChild size="lg" className="mt-6 h-12 shrink-0 rounded-full bg-white px-6 text-[#01214a] hover:bg-sky-100 md:mt-0">
                <a href="#contact">
                  Подходит ли мне? <ArrowRight />
                </a>
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}

/* ───────────── путь студента: линия рисуется при прокрутке ───────────── */

function Path() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 70%", "end 60%"] })
  const scaleY = useSpring(scrollYProgress, { stiffness: 100, damping: 30 })
  return (
    <section id="path" className="mx-auto max-w-6xl px-4 py-24 md:py-32">
      <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr]">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <Eyebrow>Полное сопровождение</Eyebrow>
          <MaskHeading text="Весь путь студента с нами" className="mt-5 text-4xl font-extrabold tracking-[-0.03em] md:text-6xl" />
          <p className="mt-6 max-w-md text-lg text-muted-foreground">
            Встречаем в аэропорту, довозим до университета, помогаем с регистрацией и заселением и поддерживаем в
            первые дни учёбы.
          </p>
          <Reveal className="mt-8 overflow-hidden rounded-[1.75rem]">
            <img src="/img/airport.jpg" alt="Встреча студентов в аэропорту" className="aspect-[16/10] w-full object-cover" />
          </Reveal>
        </div>
        <div ref={ref} className="relative pl-12">
          <div className="absolute top-2 bottom-2 left-[1.1rem] w-0.5 bg-border" />
          <motion.div style={{ scaleY }} className="absolute top-2 bottom-2 left-[1.1rem] w-0.5 origin-top bg-gradient-to-b from-primary to-sky-400" />
          <ol className="space-y-6">
            {steps.map((s, i) => (
              <motion.li
                key={s.n}
                className="relative"
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.7, ease: EASE, delay: i * 0.03 }}
              >
                <span className="absolute top-6 -left-12 flex size-9 items-center justify-center rounded-full border-4 border-background bg-primary text-xs font-bold text-primary-foreground">
                  {i + 1}
                </span>
                <div className="rounded-[1.5rem] border bg-card p-6 transition-shadow hover:shadow-xl hover:shadow-primary/5">
                  <p className="text-xs font-semibold tracking-widest text-primary">ШАГ {s.n}</p>
                  <p className="mt-1 text-xl font-bold">{s.title}</p>
                  <p className="mt-1 text-muted-foreground">{s.text}</p>
                </div>
              </motion.li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}

/* ───────────── жизнь в Китае: перетаскиваемая лента ───────────── */

function Life({ gallery }: { gallery: SiteContent["gallery"] }) {
  const wrap = useRef<HTMLDivElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const [limit, setLimit] = useState(0)
  useEffect(() => {
    const calc = () => {
      if (wrap.current && track.current) setLimit(Math.max(0, track.current.scrollWidth - wrap.current.offsetWidth))
    }
    calc()
    addEventListener("resize", calc)
    return () => removeEventListener("resize", calc)
  }, [gallery])
  return (
    <section id="life" className="overflow-hidden bg-muted/50 py-24 md:py-32">
      <div className="mx-auto mb-12 flex max-w-6xl flex-col justify-between gap-4 px-4 md:flex-row md:items-end">
        <div>
          <Eyebrow>Жизнь в Китае</Eyebrow>
          <MaskHeading text="Кампусы, общежития и друзья" className="mt-5 text-4xl font-extrabold tracking-[-0.03em] md:text-6xl" />
        </div>
        <p className="text-sm text-muted-foreground">← Листайте →</p>
      </div>
      <div ref={wrap} className="mx-auto max-w-6xl px-4">
        <motion.div ref={track} drag="x" dragConstraints={{ left: -limit, right: 0 }} dragElastic={0.08} className="flex w-max cursor-grab gap-4 active:cursor-grabbing">
          {gallery.map((g, i) => (
            <motion.figure
              key={g.src}
              className="group relative w-72 shrink-0 overflow-hidden rounded-[1.75rem] md:w-96"
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: EASE, delay: i * 0.08 }}
            >
              <img src={g.src} alt={g.caption} draggable={false} className="aspect-[3/4] w-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <figcaption className="absolute inset-x-3 bottom-3 rounded-2xl border border-white/20 bg-black/30 px-4 py-3 text-sm font-medium text-white backdrop-blur-md">
                {g.caption}
              </figcaption>
            </motion.figure>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

/* ───────────── FAQ ───────────── */

function Faq({ faq }: { faq: SiteContent["faq"] }) {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <section id="faq" className="mx-auto max-w-4xl px-4 py-24 md:py-32">
      <div className="mb-12 text-center">
        <Eyebrow>Вопросы</Eyebrow>
        <MaskHeading text="Частые вопросы" className="mt-5 text-4xl font-extrabold tracking-[-0.03em] md:text-6xl" />
      </div>
      <div className="space-y-3">
        {faq.map((f, i) => {
          const isOpen = open === i
          return (
            <Reveal key={i} delay={i * 0.04} y={20}>
              <div className={cn("rounded-[1.5rem] border transition-colors", isOpen ? "bg-card shadow-lg shadow-primary/5" : "bg-transparent hover:bg-muted/50")}>
                <button className="flex w-full items-center justify-between gap-4 p-6 text-left text-lg font-semibold" onClick={() => setOpen(isOpen ? null : i)} aria-expanded={isOpen}>
                  {f.q}
                  <motion.span animate={{ rotate: isOpen ? 45 : 0 }} className={cn("flex size-9 shrink-0 items-center justify-center rounded-full", isOpen ? "bg-primary text-primary-foreground" : "bg-muted")}>
                    <Plus className="size-4" />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.4, ease: EASE }} className="overflow-hidden">
                      <p className="px-6 pb-6 text-muted-foreground">{f.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Reveal>
          )
        })}
      </div>
    </section>
  )
}

/* ───────────── контакты ───────────── */

function Contact() {
  return (
    <section id="contact" className="px-3 pb-3">
      <div className="relative mx-auto max-w-[90rem] overflow-hidden rounded-[2.5rem] bg-[#020a1c] text-white">
        <Aurora />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-6 py-20 md:grid-cols-2 md:py-28">
          <div>
            <Eyebrow dark>Бесплатно</Eyebrow>
            <MaskHeading text="Начните путь в Китай сегодня" className="mt-5 text-4xl font-extrabold tracking-[-0.03em] md:text-6xl" />
            <p className="mt-6 max-w-md text-lg text-white/65">Расскажем, какие программы и гранты подходят именно вам, и ответим на вопросы родителей.</p>
            <ul className="mt-10 space-y-3">
              {[
                { href: "tel:+996706718888", icon: <Phone className="size-5" />, label: "+996 706 718 888" },
                { href: WA, icon: <MessageCircle className="size-5" />, label: "Написать в WhatsApp" },
                { href: "https://instagram.com/datcom_edu", icon: <Instagram className="size-5" />, label: "@datcom_edu" },
              ].map((c) => (
                <li key={c.href}>
                  <a href={c.href} target={c.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="group flex items-center gap-4 text-lg">
                    <span className="flex size-11 items-center justify-center rounded-full border border-white/15 bg-white/5 transition-colors group-hover:bg-white group-hover:text-[#01214a]">{c.icon}</span>
                    {c.label}
                  </a>
                </li>
              ))}
              <li className="flex items-start gap-4 text-lg">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5">
                  <MapPin className="size-5" />
                </span>
                <span className="pt-2">
                  Бишкек, ул. Ибраимова 103, БЦ «Виктори», левое крыло, 5 этаж
                  <span className="block text-base text-white/55">Филиал в Оше</span>
                </span>
              </li>
            </ul>
          </div>
          <Reveal>
            <form
              className="space-y-5 rounded-[2rem] border border-white/10 bg-white/[0.06] p-7 backdrop-blur-xl md:p-9"
              onSubmit={(e) => {
                e.preventDefault()
                const f = new FormData(e.currentTarget)
                const name = String(f.get("name") ?? "").trim()
                const phone = String(f.get("phone") ?? "").trim()
                const message = String(f.get("msg") ?? "").trim()
                const text = `Здравствуйте! Хочу консультацию Datcom.\nИмя: ${name}\nТелефон: ${phone}\nИнтересует: ${message}`
                window.open(`${WA}?text=${encodeURIComponent(text)}`, "_blank")
                void saveLead({ name, phone, message })
              }}
            >
              <p className="text-2xl font-bold">Заявка на консультацию</p>
              {[
                { id: "name", label: "Имя", ph: "Как к вам обращаться" },
                { id: "phone", label: "Телефон или WhatsApp", ph: "+996" },
              ].map((f) => (
                <div key={f.id} className="space-y-2">
                  <Label htmlFor={f.id} className="text-white/80">
                    {f.label}
                  </Label>
                  <Input id={f.id} name={f.id} required placeholder={f.ph} className="h-12 rounded-xl border-white/15 bg-white/5 text-white placeholder:text-white/35" />
                </div>
              ))}
              <div className="space-y-2">
                <Label htmlFor="msg" className="text-white/80">
                  Что вас интересует?
                </Label>
                <Textarea id="msg" name="msg" placeholder="Например: бакалавриат на английском, IT, аттестат 11 классов" className="min-h-24 rounded-xl border-white/15 bg-white/5 text-white placeholder:text-white/35" />
              </div>
              <Button type="submit" size="lg" className="h-13 w-full rounded-full bg-[#25D366] text-base text-white hover:bg-[#1ebe5a]">
                <MessageCircle /> Отправить в WhatsApp
              </Button>
              <p className="text-center text-xs text-white/45">Откроется WhatsApp с готовым сообщением</p>
            </form>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-10 text-sm text-muted-foreground md:flex-row">
      <img src="/logo.png" alt="Datcom" className="h-8 w-auto" />
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
        <a href="tel:+996706718888" className="hover:text-foreground">
          +996 706 718 888
        </a>
        <a href="https://instagram.com/datcom_edu" target="_blank" rel="noreferrer" className="hover:text-foreground">
          Instagram
        </a>
        <span>Бишкек · Ош</span>
      </div>
      <span>© {new Date().getFullYear()} Datcom</span>
    </footer>
  )
}

function WhatsAppFab() {
  return (
    <motion.a
      href={WA}
      target="_blank"
      rel="noreferrer"
      aria-label="Написать в WhatsApp"
      className="fixed right-5 bottom-5 z-50 flex size-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xl shadow-[#25D366]/30"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 2, type: "spring", stiffness: 260, damping: 18 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
    >
      <span className="absolute inset-0 animate-ping rounded-full bg-[#25D366] opacity-30" />
      <MessageCircle className="relative size-7" />
    </motion.a>
  )
}

export default function App() {
  const content = useSiteContent()
  return (
    <MotionConfig reducedMotion="user">
      <ScrollProgress />
      <Nav />
      <main>
        <Hero />
        <Bento stats={content.stats} />
        <Programs programs={content.programs} />
        <Path />
        <Life gallery={content.gallery} />
        <Faq faq={content.faq} />
        <Contact />
      </main>
      <Footer />
      <WhatsAppFab />
    </MotionConfig>
  )
}
