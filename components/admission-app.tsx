"use client";

import React, { useEffect, useMemo, useState } from "react";
import { buildRoadmap, formatMoney, matchPrograms, profileReadiness, categorizeProgram } from "@/lib/matching";
import type {
  City,
  Interest,
  Match,
  Program,
  RoadmapTask,
  StudentProfile,
  ShortlistItem,
  ApplicationItem,
  ApplicationStage,
  UntCombination,
  CareerFocus,
} from "@/lib/types";
import { programs } from "@/lib/programs";
import { loadLocalState, saveLocalState, syncToCloud, supabase } from "@/lib/supabase";

import { ScoreRing } from "@/components/ui/score-ring";
import { ConfidenceBadge, CategoryBadge } from "@/components/ui/confidence-badge";
import {
  Chevron,
  CheckIcon,
  SparkIcon,
  BookmarkIcon,
  SearchIcon,
  SlidersIcon,
  ExternalLinkIcon,
  MapPinIcon,
  FilterIcon,
} from "@/components/ui/icons";

import { UniversityModal } from "@/components/screens/university-modal";
import { WhatIfView } from "@/components/screens/what-if-view";
import { ExploreView } from "@/components/screens/explore-view";
import { ShortlistView } from "@/components/screens/shortlist-view";
import { DashboardView } from "@/components/screens/dashboard-view";
import { LandingPage } from "@/components/landing-page";
import { LanguageSwitcher, useI18n } from "@/components/i18n-provider";

export type Screen =
  | "landing"
  | "onboarding"
  | "dashboard"
  | "results"
  | "explore"
  | "compare"
  | "shortlist"
  | "roadmap"
  | "what-if";

export type InterestCategory =
  | "it-ai"
  | "business-finance"
  | "engineering"
  | "medicine-health"
  | "law-social"
  | "design-creative"
  | "natural-sciences"
  | "languages-pedagogy";

export const interestCategories: { id: "all" | InterestCategory; label: string; icon: string }[] = [
  { id: "all", label: "Все направления", icon: "✨" },
  { id: "it-ai", label: "IT & ИИ", icon: "💻" },
  { id: "business-finance", label: "Бизнес & Финансы", icon: "📊" },
  { id: "engineering", label: "Инженерия", icon: "⚙" },
  { id: "medicine-health", label: "Медицина", icon: "🩺" },
  { id: "law-social", label: "Право & Дипломатия", icon: "⚖" },
  { id: "design-creative", label: "Дизайн & Медиа", icon: "🎨" },
  { id: "natural-sciences", label: "Естественные науки", icon: "🔬" },
  { id: "languages-pedagogy", label: "Языки & Педагогика", icon: "🌍" },
];

export const interestLabels: Record<
  Interest,
  { title: string; description: string; icon: string; category: InterestCategory }
> = {
  // IT & AI
  "computer-science": { title: "Computer Science", description: "Фундаментальные алгоритмы, структуры данных и ОС", icon: "⌘", category: "it-ai" },
  "software-engineering": { title: "Software Engineering", description: "Разработка продуктов, архитектура и веб-сервисы", icon: "</>", category: "it-ai" },
  "data-science": { title: "Data Science & AI", description: "Машинное обучение, нейросети, Big Data и прикладная математика", icon: "◫", category: "it-ai" },
  cybersecurity: { title: "Cybersecurity & InfoSec", description: "Защита сетей, этичный хакинг, безопасность инфраструктуры", icon: "◇", category: "it-ai" },
  "ai-robotics": { title: "AI & Robotics", description: "Робототехника, встраиваемые системы, сенсоры и компьютерное зрение", icon: "⚙", category: "it-ai" },
  "cloud-devops": { title: "Cloud & DevOps", description: "Kubernetes, CI/CD, облачные кластеры и системная надежность", icon: "☁", category: "it-ai" },
  "information-systems": { title: "Information Systems", description: "Информационные системы, базы данных и цифровизация бизнеса", icon: "🏢", category: "it-ai" },

  // Business & Finance
  "finance-fintech": { title: "Финансы & Финтех", description: "Инвестиционный банкинг, финтех-продукты, казначейство и крипто", icon: "💳", category: "business-finance" },
  fintech: { title: "Финтех & Банкинг", description: "Платёжные системы, смарт-контракты и необанкинг", icon: "💳", category: "business-finance" },
  "business-mgmt": { title: "Международный бизнес & Менеджмент", description: "Управление компаниями, предпринимательство и стратегия", icon: "📈", category: "business-finance" },
  "marketing-digital": { title: "Digital Маркетинг & Продажи", description: "Продуктовый маркетинг, аналитика воронок и перформанс", icon: "🎯", category: "business-finance" },
  economics: { title: "Экономика & Аналитика", description: "Макроэкономика, эконометрика, финансовые рынки и аудит", icon: "📉", category: "business-finance" },

  // Engineering & Tech
  "engineering-tech": { title: "Общая инженерия & Технологии", description: "Промышленное проектирование, материаловедение и производство", icon: "🛠", category: "engineering" },
  "petroleum-mining": { title: "Нефтегазовое дело & Геология", description: "Бурение, разработка месторождений, энергетика и недра", icon: "🛢", category: "engineering" },
  "robotics-mechatronics": { title: "Мехатроника & Робототехника", description: "Автоматизация линий, манипуляторы, дроны и сенсорика", icon: "🤖", category: "engineering" },
  "architecture-civil": { title: "Архитектура & Строительство", description: "BIM-проектирование, градостроительство, урбанистика и конструкции", icon: "🏛", category: "engineering" },

  // Medicine & Healthcare
  "medicine-general": { title: "Общая медицина & Хирургия", description: "Лечебное дело, диагностика, клиническая практика и хирургия", icon: "🩺", category: "medicine-health" },
  "biomedicine-pharma": { title: "Фармация & Биомедицина", description: "Разработка фармпрепаратов, клинические исследования и биотехнологии", icon: "💊", category: "medicine-health" },
  dentistry: { title: "Стоматология & Челюстная хирургия", description: "Терапевтическая, ортопедическая и хирургическая стоматология", icon: "🦷", category: "medicine-health" },

  // Law & Social Sciences
  "law-jurisprudence": { title: "Юриспруденция & Международное право", description: "Корпоративное право, судебные процессы, арбитраж и M&A", icon: "⚖", category: "law-social" },
  "international-relations": { title: "Международные отношения & Дипломатия", description: "Геополитика, внешняя политика, международные организации и МИД", icon: "🌐", category: "law-social" },
  "psychology-hr": { title: "Психология & Организационный HR", description: "Консультирование, оценка персонала, коучинг и поведенческий анализ", icon: "🧠", category: "law-social" },

  // Design, Media & Creative
  "ui-ux-product": { title: "UI/UX & Product Design", description: "Дизайн интерфейсов, пользовательский опыт и дизайн-системы", icon: "🎨", category: "design-creative" },
  gamedev: { title: "Game Development & 3D", description: "Разработка игр на Unreal Engine/Unity, шейдеры и геймдизайн", icon: "🎮", category: "design-creative" },
  "design-multimedia": { title: "Графический дизайн & Мультимедиа", description: "Брендинг, моушн-дизайн, визуальные коммуникации и типографика", icon: "🖌", category: "design-creative" },
  "journalism-media": { title: "Медиа, Журналистика & PR", description: "Цифровой медиаконтент, подкасты, связи с общественностью и блогинг", icon: "🎙", category: "design-creative" },

  // Natural Sciences & Math
  "applied-math": { title: "Прикладная математика & Статистика", description: "Математическое моделирование, криптография и алгоритмы", icon: "📐", category: "natural-sciences" },
  "biotech-chemistry": { title: "Биотехнологии & Химические технологии", description: "Генетическая инженерия, лабораторный синтез и экотехнологии", icon: "🧪", category: "natural-sciences" },

  // Languages & Education
  "linguistics-translation": { title: "Переводческое дело & Лингвистика", description: "Синхронный перевод, иностранные языки и межкультурная коммуникация", icon: "🗣", category: "languages-pedagogy" },
  pedagogy: { title: "Педагогика & Образовательные технологии", description: "STEM-образование, методика преподавания и EdTech продукты", icon: "📚", category: "languages-pedagogy" },
};

export const kazakhstanHometowns = [
  "Астана",
  "Алматы",
  "Шымкент",
  "Караганда",
  "Актобе",
  "Тараз",
  "Павлодар",
  "Усть-Каменогорск",
  "Семей",
  "Атырау",
  "Костанай",
  "Кызылорда",
  "Уральск",
  "Петропавловск",
  "Актау",
  "Темиртау",
  "Туркестан",
  "Кокшетау",
  "Талдыкорган",
  "Экибастуз",
  "Рудный",
  "Жезказган",
  "Каскелен",
];

export const untCombinationsList: UntCombination[] = [
  "Математика + Информатика",
  "Математика + Физика",
  "Математика + География",
  "Биология + Химия",
  "Иностранный язык + Всемирная история",
  "Всемирная история + Основы права",
  "Творческий экзамен",
  "Ещё не определился",
];

export const careerFocusesList: CareerFocus[] = [
  "Big Tech & Релокейт",
  "Стартапы & Предпринимательство",
  "Финтех & Банки (Kaspi/Halyk)",
  "Наука & R&D (ИИ лаборатории)",
  "Кибербезопасность & SOC",
  "Медицина & Здравоохранение",
  "Юриспруденция & Международное право",
  "Геймдев & Креатив",
  "Корпоративный сектор & Big 4",
  "Удалёнка на США/Европу",
  "Неважно",
];

const defaultProfile: StudentProfile = {
  name: "Алия",
  grade: "11",
  homeCity: "Шымкент",
  enrollmentYear: 2027,
  interests: ["data-science", "computer-science"],
  interest: "data-science",
  untCombination: "Математика + Информатика",
  favoriteSubjects: ["Математика", "Информатика", "Английский язык"],
  gpa: 3.85, // 4.0 scale
  unt: 108,
  ielts: 6.0,
  preferredCities: ["Астана", "Алматы"],
  preferredCountries: ["Казахстан"],
  budget: 2_500_000,
  onlyGrant: false,
  scholarshipImportant: true,
  language: "Казахский / русский",
  careerFocus: "Big Tech & Релокейт",
  dormitoryNeeded: true,
  militaryDepartment: false,
};

const demoProfiles: Record<string, StudentProfile> = {
  aliya: defaultProfile,
  sanzhar: {
    name: "Санжар",
    grade: "11",
    homeCity: "Алматы",
    enrollmentYear: 2027,
    interests: ["cybersecurity", "software-engineering"],
    interest: "cybersecurity",
    untCombination: "Математика + Информатика",
    favoriteSubjects: ["Информатика", "Физика"],
    gpa: 3.65,
    unt: 92,
    ielts: 5.5,
    preferredCities: ["Алматы", "Каскелен"],
    budget: 1_600_000,
    onlyGrant: true,
    scholarshipImportant: true,
    language: "Казахский / русский",
    careerFocus: "Кибербезопасность & SOC",
    dormitoryNeeded: true,
  },
  damir: {
    name: "Дамир",
    grade: "10",
    homeCity: "Астана",
    enrollmentYear: 2028,
    interests: ["software-engineering", "robotics-mechatronics"],
    interest: "software-engineering",
    untCombination: "Математика + Физика",
    favoriteSubjects: ["Математика", "Информатика", "Английский язык"],
    gpa: 3.95,
    unt: undefined,
    ielts: undefined,
    preferredCities: ["Астана", "Алматы"],
    budget: 3_500_000,
    onlyGrant: false,
    scholarshipImportant: false,
    language: "Английский",
    careerFocus: "Стартапы & Astana Hub",
    dormitoryNeeded: false,
  },
};

const subjects = [
  "Математика",
  "Информатика",
  "Физика",
  "Английский язык",
  "Биология",
  "Химия",
  "Всемирная история",
  "География",
  "Экономика",
  "Обществознание / Право",
  "Литература / Языки",
  "Рисунок / Графика",
];
const studyCities: City[] = [
  "Астана",
  "Алматы",
  "Каскелен",
  "Караганда",
  "Шымкент",
  "Актобе",
  "Любой город Казахстана",
];

function diversified(matches: Match[], count = 4) {
  const result: Match[] = [];
  const seen = new Set<string>();
  for (const match of matches) {
    if (!seen.has(match.program.university)) {
      result.push(match);
      seen.add(match.program.university);
    }
    if (result.length === count) break;
  }
  return result;
}

function Logo() {
  return (
    <div style={{ display: "flex", alignItems: "center", textDecoration: "none" }} aria-label="UniFlow">
      <span style={{ fontSize: "24px", fontWeight: 900, color: "#040915", letterSpacing: "-0.5px" }}>
        UniFlow<span style={{ color: "#FE7505" }}>.</span>
      </span>
    </div>
  );
}

export function AdmissionApp() {
  const { t } = useI18n();
  const [mounted, setMounted] = useState(false);
  const [screen, setScreen] = useState<Screen>("landing");
  const [profile, setProfile] = useState<StudentProfile>(defaultProfile);
  const [targetId, setTargetId] = useState<string>("aitu-big-data");
  const [completed, setCompleted] = useState<string[]>(["shortlist"]);
  const [shortlist, setShortlist] = useState<ShortlistItem[]>([
    { programId: "aitu-big-data", category: "target", addedAt: new Date().toISOString() },
    { programId: "kbtu-se", category: "reach", addedAt: new Date().toISOString() },
    { programId: "iitu-is", category: "safety", addedAt: new Date().toISOString() },
  ]);
  const [applications, setApplications] = useState<ApplicationItem[]>([
    { programId: "aitu-big-data", stage: "documents", updatedAt: new Date().toISOString(), completedTasks: [] },
  ]);

  const [notice, setNotice] = useState("");
  const [cloudStatus, setCloudStatus] = useState<string>("Подключено к Supabase");
  const [editingFrom, setEditingFrom] = useState<string>("");
  const [modalProgramId, setModalProgramId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Load from local/saved state on mount + listen to Supabase Auth state (e.g. Google OAuth redirect)
  useEffect(() => {
    setMounted(true);
    const saved = loadLocalState();
    if (saved.profile) setProfile(saved.profile);
    if (saved.targetId) setTargetId(saved.targetId);
    if (saved.completed) setCompleted(saved.completed);
    if (saved.shortlist) setShortlist(saved.shortlist);
    if (saved.applications) setApplications(saved.applications);

    // Supabase auth state listener
    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event: string, session: any) => {
      if (session?.user) {
        const u = session.user;
        const name = u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split("@")[0] || "Пользователь";
        setProfile((prev) => ({
          ...prev,
          name: name.charAt(0).toUpperCase() + name.slice(1),
        }));
        setCloudStatus("Supabase Auth: Авторизован");
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // Save changes and sync to Supabase
  useEffect(() => {
    if (!mounted) return;
    saveLocalState({ profile, targetId, completed, shortlist, applications });
    syncToCloud({ profile, targetId, completed, shortlist, applications }).then((res) => {
      setCloudStatus(res.message);
    });
  }, [mounted, profile, targetId, completed, shortlist, applications]);

  // Matches calculation
  const allMatches = useMemo(() => matchPrograms(profile), [profile]);
  const topMatches = useMemo(() => diversified(allMatches, 4), [allMatches]);
  const target = allMatches.find((item) => item.program.id === targetId) ?? topMatches[0] ?? allMatches[0];

  const modalProgram = modalProgramId ? programs.find((p) => p.id === modalProgramId) : null;
  const modalMatch = modalProgramId ? allMatches.find((m) => m.program.id === modalProgramId) : undefined;

  const navigate = (next: Screen) => {
    setScreen(next);
    setMobileMenuOpen(false);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleToggleShortlist = (programId: string) => {
    setShortlist((prev) => {
      const exists = prev.some((item) => item.programId === programId);
      if (exists) {
        return prev.filter((item) => item.programId !== programId);
      } else {
        const match = allMatches.find((m) => m.program.id === programId);
        const cat = match ? categorizeProgram(profile, match) : "target";
        return [...prev, { programId, category: cat, addedAt: new Date().toISOString() }];
      }
    });
  };

  const handleUpdateShortlistCategory = (programId: string, category: ShortlistItem["category"]) => {
    setShortlist((prev) =>
      prev.map((item) => (item.programId === programId ? { ...item, category } : item))
    );
  };

  const handleUpdateApplicationStage = (programId: string, stage: ApplicationStage) => {
    setApplications((prev) => {
      const exists = prev.find((a) => a.programId === programId);
      if (exists) {
        return prev.map((a) => (a.programId === programId ? { ...a, stage, updatedAt: new Date().toISOString() } : a));
      } else {
        return [...prev, { programId, stage, updatedAt: new Date().toISOString(), completedTasks: [] }];
      }
    });
  };

  const handleToggleCompleted = (id: string) => {
    setCompleted((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  };

  const editProfile = () => {
    setEditingFrom(topMatches[0]?.program.id ?? "");
    navigate("onboarding");
  };

  const completeProfile = () => {
    const nextTop = diversified(matchPrograms(profile), 1)[0];
    if (editingFrom) {
      const previous = allMatches.find((item) => item.program.id === editingFrom)?.program.shortName;
      setNotice(
        previous && nextTop && previous !== nextTop.program.shortName
          ? `Лидер изменился: ${previous} → ${nextTop.program.shortName}. Обновлены баллы и дорожная карта.`
          : "Обновлены баллы совместимости, рекомендации и пошаговый маршрут."
      );
    }
    setTargetId(nextTop?.program.id ?? targetId);
    setEditingFrom("");
    navigate("dashboard");
  };

  const loadDemo = (key: string = "aliya") => {
    const selected = demoProfiles[key] ?? defaultProfile;
    setProfile(selected);
    const m = matchPrograms(selected);
    setTargetId(m[0]?.program.id ?? "aitu-big-data");
    setNotice(`Загружен демонстрационный профиль: ${selected.name} (${selected.interest})`);
    navigate("dashboard");
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn("SignOut error:", e);
    }
    const emptyProfile: StudentProfile = { ...defaultProfile, name: "" };
    setProfile(emptyProfile);
    saveLocalState({ profile: emptyProfile, targetId: "aitu-big-data", completed: [], shortlist: [], applications: [] });
    setNotice("Вы вышли из аккаунта");
    navigate("landing");
  };

  const inProduct = screen !== "landing" && screen !== "onboarding";

  return (
    <div className="app-shell">
      <LanguageSwitcher />
      {/* Top Navigation Bar (Active only in App Screens) */}
      {screen !== "landing" && (
        <header className="topbar">
          <div className="topbar-inner container">
            <div style={{ display: "flex", alignItems: "center" }}>
              <button className="logo-button" onClick={() => navigate("landing")}>
                <Logo />
              </button>
            </div>

            {inProduct ? (
              <nav className={`product-nav ${mobileMenuOpen ? "mobile-open" : ""}`} aria-label="Разделы навигатора">
                <button className={screen === "dashboard" ? "active" : ""} onClick={() => navigate("dashboard")}>
                  {t("nav.overview")}
                </button>
                <button className={screen === "results" ? "active" : ""} onClick={() => navigate("results")}>
                  {t("nav.recommendations")}
                </button>
                <button className={screen === "explore" ? "active" : ""} onClick={() => navigate("explore")}>
                  {t("nav.catalog")}
                </button>
                <button className={screen === "compare" ? "active" : ""} onClick={() => navigate("compare")}>
                  {t("nav.compare")}
                </button>
                <button className={screen === "shortlist" ? "active" : ""} onClick={() => navigate("shortlist")}>
                  {t("nav.shortlist")} {shortlist.length > 0 && <span className="nav-badge">{shortlist.length}</span>}
                </button>
                <button className={screen === "roadmap" ? "active" : ""} onClick={() => navigate("roadmap")}>
                  {t("nav.roadmap")}
                </button>
                <button className={screen === "what-if" ? "active" : ""} onClick={() => navigate("what-if")}>
                  ⚡ {t("nav.whatIf")}
                </button>
              </nav>
            ) : (
              <nav className={`landing-nav ${mobileMenuOpen ? "mobile-open" : ""}`} aria-label="Навигация">
                <button className="navlink" onClick={() => navigate("explore")}>{t("nav.catalog")}</button>
                <button className="navlink" onClick={() => navigate("what-if")}>{t("nav.whatIf")}</button>
              </nav>
            )}

            <div className="header-meta">
              {!inProduct ? (
                <div className="landing-topbar-actions">
                  <button className="btn nav-ghost" onClick={() => loadDemo("aliya")}>
                    {t("nav.demo")}
                  </button>
                  <button
                    className="btn btn-gradient nav-cta"
                    onClick={() => {
                      if (!profile.name) setProfile({ ...defaultProfile, name: "" });
                      navigate(profile.name ? "dashboard" : "onboarding");
                    }}
                  >
                    {profile.name ? t("nav.account") : t("nav.choose")}
                  </button>
                </div>
              ) : (
                <>

                  <button className="button subtle small profile-pill-btn" onClick={editProfile}>
                    {profile.name || "Профиль"}
                  </button>
                  <button
                    className="button subtle small"
                    onClick={handleLogout}
                    style={{ fontSize: "12px", color: "#EF4444", padding: "4px 8px" }}
                    title="Выйти из аккаунта"
                  >
                    {t("nav.logout")}
                  </button>
                </>
              )}
              <button
                className="mobile-menu-toggle"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Меню"
              >
                ☰
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Screen Views */}
      {screen === "landing" && (
        <LandingPage
          profile={profile}
          onLogout={handleLogout}
          onStart={() => {
            if (profile.name && profile.name.trim().length > 0) {
              navigate("dashboard");
            } else {
              setProfile({ ...defaultProfile, name: "" });
              navigate("onboarding");
            }
          }}
          onNavigate={(s) => navigate(s as any)}
          onDemo={(p) => loadDemo(p)}
          onAuthSuccess={(authProfile) => {
            const updated = { ...profile, ...authProfile };
            setProfile(updated);
            const m = matchPrograms(updated);
            setTargetId(m[0]?.program.id ?? "aitu-big-data");
            setNotice(`Вход выполнен: ${updated.name || "Пользователь"}`);
            navigate("dashboard");
          }}
        />
      )}

      {screen === "onboarding" && (
        <OnboardingScreen
          profile={profile}
          setProfile={setProfile}
          onCancel={() => navigate(editingFrom ? "dashboard" : "landing")}
          onComplete={completeProfile}
        />
      )}

      {screen === "dashboard" && (
        <DashboardView
          profile={profile}
          topMatches={topMatches}
          targetMatch={target}
          shortlist={shortlist}
          completedTasks={completed}
          onNavigate={navigate}
          onToggleTask={handleToggleCompleted}
          onViewProgram={(id) => setModalProgramId(id)}
          onEditProfile={editProfile}
        />
      )}

      {screen === "results" && (
        <ResultsScreen
          profile={profile}
          matches={topMatches}
          notice={notice}
          shortlistIds={shortlist.map((s) => s.programId)}
          onToggleShortlist={handleToggleShortlist}
          onEdit={editProfile}
          onCompare={() => navigate("compare")}
          onRoadmap={() => navigate("roadmap")}
          onTarget={(id) => {
            setTargetId(id);
            navigate("roadmap");
          }}
          onViewProgram={(id) => setModalProgramId(id)}
          onOpenWhatIf={() => navigate("what-if")}
        />
      )}

      {screen === "explore" && (
        <ExploreView
          matches={allMatches}
          profile={profile}
          shortlistIds={shortlist.map((s) => s.programId)}
          onToggleShortlist={handleToggleShortlist}
          onViewProgram={(id) => setModalProgramId(id)}
          onCompareProgram={(id) => {
            setTargetId(id);
            navigate("compare");
          }}
        />
      )}

      {screen === "compare" && (
        <CompareScreen
          matches={allMatches}
          profile={profile}
          defaultLeftId={targetId}
          onEdit={editProfile}
          onRoadmap={() => navigate("roadmap")}
          onTarget={(id) => {
            setTargetId(id);
            navigate("roadmap");
          }}
          onViewProgram={(id) => setModalProgramId(id)}
        />
      )}

      {screen === "shortlist" && (
        <ShortlistView
          shortlist={shortlist}
          applications={applications}
          allMatches={allMatches}
          profile={profile}
          currentTargetId={targetId}
          onRemoveShortlist={handleToggleShortlist}
          onUpdateCategory={handleUpdateShortlistCategory}
          onUpdateStage={handleUpdateApplicationStage}
          onSetTarget={(id) => {
            setTargetId(id);
            navigate("roadmap");
          }}
          onViewProgram={(id) => setModalProgramId(id)}
          onExploreMore={() => navigate("explore")}
        />
      )}

      {screen === "roadmap" && target && (
        <RoadmapScreen
          profile={profile}
          match={target}
          completed={completed}
          onToggle={handleToggleCompleted}
          onEdit={editProfile}
          onChangeTarget={() => navigate("results")}
          onViewDetails={() => setModalProgramId(target.program.id)}
        />
      )}

      {screen === "what-if" && (
        <WhatIfView
          profile={profile}
          onApplyProfile={(updated) => {
            setProfile(updated);
            setNotice("Параметры из симулятора сохранены в основной профиль абитуриента!");
            navigate("dashboard");
          }}
          onViewProgram={(id) => setModalProgramId(id)}
        />
      )}

      {/* Deep-dive University Modal */}
      {modalProgram && (
        <UniversityModal
          program={modalProgram}
          match={modalMatch}
          profile={profile}
          isShortlisted={shortlist.some((s) => s.programId === modalProgram.id)}
          isTarget={targetId === modalProgram.id}
          onClose={() => setModalProgramId(null)}
          onToggleShortlist={() => handleToggleShortlist(modalProgram.id)}
          onSetTarget={() => {
            setTargetId(modalProgram.id);
            navigate("roadmap");
          }}
        />
      )}

    </div>
  );
}

/* =========================================================================
   ONBOARDING WIZARD WITH ENHANCED REAL-WORLD KZ LOGIC
   ========================================================================= */

function OnboardingScreen({
  profile,
  setProfile,
  onCancel,
  onComplete,
}: {
  profile: StudentProfile;
  setProfile: (p: StudentProfile) => void;
  onCancel: () => void;
  onComplete: () => void;
}) {
  const { t } = useI18n();
  const [step, setStep] = useState(0);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const wizardSteps = [
    t("wizard.step.about"),
    t("wizard.step.direction"),
    t("wizard.step.academic"),
    t("wizard.step.preferences"),
    t("wizard.step.review"),
  ];

  const patch = (values: Partial<StudentProfile>) => setProfile({ ...profile, ...values });

  const selectedInterests: Interest[] =
    profile.interests && profile.interests.length > 0
      ? profile.interests
      : profile.interest
      ? [profile.interest]
      : [];

  const toggleInterest = (key: Interest) => {
    if (selectedInterests.includes(key)) {
      if (selectedInterests.length > 1) {
        const next = selectedInterests.filter((i) => i !== key);
        patch({ interests: next, interest: next[0] });
      }
    } else {
      if (selectedInterests.length < 3) {
        const next = [...selectedInterests, key];
        patch({ interests: next, interest: next[0] });
      } else {
        const next = [selectedInterests[0], selectedInterests[1], key];
        patch({ interests: next, interest: next[0] });
      }
    }
  };

  // Intelligent grade-to-enrollment-year calculation
  const handleGradeChange = (grade: StudentProfile["grade"]) => {
    let year: StudentProfile["enrollmentYear"] = 2027;
    if (grade === "9") year = 2029;
    else if (grade === "10") year = 2028;
    else if (grade === "11" || grade === "Выпускник школы" || grade === "Студент колледжа") year = 2027;

    patch({ grade, enrollmentYear: year });
  };

  const next = () => (step < 4 ? setStep(step + 1) : onComplete());
  const back = () => (step > 0 ? setStep(step - 1) : onCancel());
  const canContinue = step !== 0 || profile.homeCity.trim().length > 1;

  return (
    <main className="onboarding container">
      {/* Step Progress bar */}
      <div className="wizard-progress" aria-label={t("wizard.counter", { current: step + 1, total: wizardSteps.length })}>
        {wizardSteps.map((label, index) => (
          <div
            className={`wizard-progress-item ${index < step ? "done" : ""} ${index === step ? "active" : ""}`}
            key={label}
          >
            <span>{index < step ? <CheckIcon size={12} /> : index + 1}</span>
            <b>{label}</b>
            {index < wizardSteps.length - 1 && <i />}
          </div>
        ))}
      </div>

      <div className="wizard-shell">
        <aside className="wizard-aside card-glass">
          <div className="aside-number">0{step + 1}</div>
          <p>{t(`wizard.kicker.${step}`)}</p>
          <h2>{t(`wizard.heading.${step}`)}</h2>
          <div className="aside-tip">
            <SparkIcon size={16} />
            <span>
              {step === 0
                ? "Выбор класса автоматически настраивает расчётный год выпуска и начала приёмной кампании."
                : step === 1
                ? "Ты можешь выбрать до 3 направлений. Система учтет профильные предметы ЕНТ и подберёт междисциплинарные вузы."
                : step === 2
                ? "В школах и лицеях РК стандартом является шкала GPA 4.0. Если ещё не сдавал ЕНТ/IELTS — оставь поле пустым."
                : "Все параметры можно будет смоделировать в симуляторе «Что если?»."}
            </span>
          </div>
        </aside>

        <section className="wizard-card card-glass">
          {/* STEP 0: О тебе, класс, родной город */}
          {step === 0 && (
            <div className="form-stack">
              <div className="question-block">
                <label htmlFor="name">
                  {t("wizard.name")} <small>для персонализации маршрута</small>
                </label>
                <input
                  id="name"
                  className="text-input"
                  placeholder="Например, Алия"
                  value={profile.name}
                  onChange={(e) => patch({ name: e.target.value })}
                />
              </div>

              <div className="question-block">
                <label>{t("wizard.status")}</label>
                <div className="segmented-grid">
                  {(["9", "10", "11", "Выпускник школы", "Студент колледжа"] as const).map((val) => (
                    <button
                      key={val}
                      type="button"
                      className={profile.grade === val ? "selected" : ""}
                      onClick={() => handleGradeChange(val)}
                    >
                      {val.includes("класс") || val.length > 2 ? val : `${val} класс`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-row">
                <div className="question-block">
                  <label htmlFor="city-select">{t("wizard.homeCity")}</label>
                  <div className="city-input-select-group">
                    <select
                      id="city-select"
                      className="text-input"
                      value={kazakhstanHometowns.includes(profile.homeCity) ? profile.homeCity : "other"}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "other") {
                          patch({ homeCity: "" });
                        } else {
                          patch({ homeCity: val });
                        }
                      }}
                    >
                      {kazakhstanHometowns.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                      <option value="other">Другой город / посёлок...</option>
                    </select>

                    {/* ONLY SHOW CUSTOM INPUT WHEN "other" IS SELECTED */}
                    {!kazakhstanHometowns.includes(profile.homeCity) && (
                      <div className="custom-city-wrapper" style={{ marginTop: "8px" }}>
                        <input
                          id="city-custom"
                          className="text-input"
                          placeholder="Введи название своего города или посёлка..."
                          value={profile.homeCity}
                          autoFocus
                          onChange={(e) => patch({ homeCity: e.target.value })}
                        />
                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
                          <small className="field-hint">
                            Укажи населённый пункт (для расчёта региональных квот МОН РК).
                          </small>
                          <button
                            type="button"
                            className="text-button"
                            style={{ fontSize: "12px", color: "var(--accent-primary, #10b981)" }}
                            onClick={() => patch({ homeCity: "Астана" })}
                          >
                            ← Выбрать из списка
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="question-block">
                  <label htmlFor="year">
                    {t("wizard.enrollmentYear")} <small>(авторасчёт)</small>
                  </label>
                  <select
                    id="year"
                    className="text-input"
                    value={profile.enrollmentYear}
                    onChange={(e) => patch({ enrollmentYear: Number(e.target.value) as any })}
                  >
                    <option value={2027}>2027 год (набор следующего лета)</option>
                    <option value={2028}>2028 год</option>
                    <option value={2029}>2029 год</option>
                    <option value={2030}>2030 год</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 1: Направления (до 3) и профильная комбинация ЕНТ */}
          {step === 1 && (
            <div className="form-stack">
              <div className="question-block">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", flexWrap: "wrap", gap: "8px" }}>
                  <label style={{ margin: 0 }}>
                    {t("wizard.directions")} <small>(до 3)</small>
                  </label>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      background: selectedInterests.length === 3 ? "rgba(16, 185, 129, 0.15)" : "rgba(255, 255, 255, 0.08)",
                      border: selectedInterests.length === 3 ? "1px solid rgba(16, 185, 129, 0.4)" : "1px solid rgba(255, 255, 255, 0.12)",
                      borderRadius: "999px",
                      padding: "3px 10px",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: selectedInterests.length === 3 ? "#10b981" : "inherit",
                    }}
                  >
                    {t("wizard.selected", { current: selectedInterests.length })}
                  </span>
                </div>
                <p className="field-hint">
                  Каталог направлений по стандартам <b>Niche</b>: отметь от 1 до 3 направлений, чтобы система подобрала программы казахстанских и зарубежных вузов.
                </p>

                {/* CATEGORY TABS LIKE NICHE */}
                <div
                  className="category-tabs-bar"
                  style={{
                    display: "flex",
                    gap: "6px",
                    overflowX: "auto",
                    paddingBottom: "8px",
                    marginBottom: "12px",
                  }}
                >
                  {interestCategories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      style={{
                        padding: "6px 12px",
                        fontSize: "12px",
                        borderRadius: "8px",
                        whiteSpace: "nowrap",
                        border: activeCategory === cat.id ? "1px solid var(--accent-primary, #10b981)" : "1px solid rgba(255, 255, 255, 0.1)",
                        background: activeCategory === cat.id ? "rgba(16, 185, 129, 0.12)" : "rgba(255, 255, 255, 0.03)",
                        color: activeCategory === cat.id ? "#10b981" : "inherit",
                        cursor: "pointer",
                        fontWeight: activeCategory === cat.id ? 600 : 400,
                      }}
                      onClick={() => setActiveCategory(cat.id)}
                    >
                      <span>{cat.icon}</span> {cat.label}
                    </button>
                  ))}
                </div>

                {/* INTEREST CARDS GRID */}
                <div className="interest-grid-expanded">
                  {Object.entries(interestLabels)
                    .filter(([_, item]) => activeCategory === "all" || item.category === activeCategory)
                    .map(([key, item]) => {
                      const isSelected = selectedInterests.includes(key as Interest);
                      return (
                        <button
                          key={key}
                          type="button"
                          className={`interest-card ${isSelected ? "selected" : ""}`}
                          onClick={() => toggleInterest(key as Interest)}
                        >
                          <span className="interest-icon">{item.icon}</span>
                          <span className="interest-text">
                            <strong>{item.title}</strong>
                            <small>{item.description}</small>
                          </span>
                          <i>{isSelected && <CheckIcon size={14} />}</i>
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* UNT SUBJECT COMBINATION */}
              <div className="question-block" style={{ marginTop: "20px" }}>
                <label>
                  {t("wizard.untCombination")} <small>критично для конкурса грантов РК</small>
                </label>
                <div className="unt-comb-picker-grid">
                  {untCombinationsList.map((comb) => (
                    <button
                      key={comb}
                      type="button"
                      className={`unt-comb-btn ${profile.untCombination === comb ? "active" : ""}`}
                      onClick={() => patch({ untCombination: comb })}
                    >
                      <span>{comb}</span>
                      {profile.untCombination === comb && <CheckIcon size={14} />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="question-block">
                <label>
                  {t("wizard.subjects")} <small>до 3</small>
                </label>
                <div className="chip-list">
                  {subjects.map((sub) => {
                    const active = profile.favoriteSubjects.includes(sub);
                    return (
                      <button
                        key={sub}
                        type="button"
                        className={`chip ${active ? "active" : ""}`}
                        onClick={() =>
                          patch({
                            favoriteSubjects: active
                              ? profile.favoriteSubjects.filter((s) => s !== sub)
                              : profile.favoriteSubjects.length < 3
                              ? [...profile.favoriteSubjects, sub]
                              : profile.favoriteSubjects,
                          })
                        }
                      >
                        {active && <CheckIcon size={12} />} {sub}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Академика (GPA 4.0, ЕНТ, IELTS, SAT) */}
          {step === 2 && (
            <div className="form-stack">
              <div className="metric-input">
                <div>
                  <label htmlFor="gpa">
                    {t("wizard.gpa")} <small>(4.0)</small>
                  </label>
                  <p>Стандарт НИШ, БИЛ, лицеев и аттестатов РК (3.8–4.0 — отлично; 3.3–3.7 — хорошо)</p>
                </div>
                <div className="number-field">
                  <input
                    id="gpa"
                    type="number"
                    min="2.0"
                    max="4.0"
                    step="0.05"
                    value={profile.gpa}
                    onChange={(e) => patch({ gpa: Number(e.target.value) })}
                  />
                  <span>/ 4.0</span>
                </div>
              </div>

              <div className="metric-input">
                <div>
                  <label htmlFor="unt">{t("wizard.unt")}</label>
                  <p>Максимум 140 баллов. Если ещё не сдавал, оставь пустым — включим в план.</p>
                </div>
                <div className="number-field">
                  <input
                    id="unt"
                    type="number"
                    min="0"
                    max="140"
                    placeholder="—"
                    value={profile.unt ?? ""}
                    onChange={(e) => patch({ unt: e.target.value ? Number(e.target.value) : undefined })}
                  />
                  <span>/ 140</span>
                </div>
              </div>

              <div className="metric-input">
                <div>
                  <label htmlFor="ielts">{t("wizard.ielts")}</label>
                  <p>Большинство казахстанских вузов проводят также внутренний экзамен AET/KEET.</p>
                </div>
                <div className="number-field">
                  <input
                    id="ielts"
                    type="number"
                    min="0"
                    max="9.0"
                    step="0.5"
                    placeholder="—"
                    value={profile.ielts ?? ""}
                    onChange={(e) => patch({ ielts: e.target.value ? Number(e.target.value) : undefined })}
                  />
                  <span>/ 9.0</span>
                </div>
              </div>

              <div className="metric-input">
                <div>
                  <label htmlFor="sat">{t("wizard.sat")}</label>
                  <p>Шкала SAT от 400 до 1600. Полезно для Назарбаев Университета и вузов Европы/США.</p>
                </div>
                <div className="number-field">
                  <input
                    id="sat"
                    type="number"
                    min="400"
                    max="1600"
                    step="10"
                    placeholder="—"
                    value={profile.sat ?? ""}
                    onChange={(e) => patch({ sat: e.target.value ? Number(e.target.value) : undefined })}
                  />
                  <span>/ 1600</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Города, бюджет, язык и карьерный фокус */}
          {step === 3 && (
            <div className="form-stack compact">
              <div className="question-block">
                <label>{t("wizard.cities")}</label>
                <div className="chip-list">
                  {studyCities.map((city) => {
                    const active = profile.preferredCities.includes(city);
                    return (
                      <button
                        key={city}
                        type="button"
                        className={`chip ${active ? "active" : ""}`}
                        onClick={() =>
                          patch({
                            preferredCities:
                              city === "Любой город Казахстана"
                                ? [city]
                                : active
                                ? profile.preferredCities.filter((c) => c !== city)
                                : [...profile.preferredCities.filter((c) => c !== "Любой город Казахстана"), city],
                          })
                        }
                      >
                        {active && <CheckIcon size={12} />} {city}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* BUDGET WITH ONLY-GRANT TOGGLE */}
              <div className="question-block">
                <div className="grant-first-row">
                  <label className="toggle-row">
                    <span>
                      <strong>{t("wizard.grantOnly")}</strong>
                      <small>Фокус исключительно на траекториях бесплатного обучения</small>
                    </span>
                    <input
                      type="checkbox"
                      checked={profile.onlyGrant}
                      onChange={(e) => patch({ onlyGrant: e.target.checked, scholarshipImportant: true })}
                    />
                    <i />
                  </label>
                </div>

                {!profile.onlyGrant && (
                  <>
                    <label style={{ marginTop: "12px", display: "block" }}>
                      {t("wizard.budget")}:
                    </label>
                    <div className="budget-grid">
                      {[1_200_000, 1_600_000, 2_500_000, 3_500_000, 7_500_000].map((b) => (
                        <button
                          key={b}
                          type="button"
                          className={`budget-option ${profile.budget === b ? "selected" : ""}`}
                          onClick={() => patch({ budget: b })}
                        >
                          <span>{b >= 5_000_000 ? "свыше 4 млн ₸" : `до ${(b / 1_000_000).toFixed(1)} млн ₸`}</span>
                          {b === 2_500_000 && <small>Средний тариф</small>}
                          {b === 1_600_000 && <small>КазНУ/Satbayev/МУИТ</small>}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="form-row">
                <div className="question-block">
                  <label htmlFor="lang">{t("wizard.studyLanguage")}</label>
                  <select
                    id="lang"
                    className="text-input"
                    value={profile.language}
                    onChange={(e) => patch({ language: e.target.value as any })}
                  >
                    <option value="Казахский / русский">Казахский / русский (госстандарт)</option>
                    <option value="Английский">Английский</option>
                    <option value="Неважно">Неважно (любой)</option>
                  </select>
                </div>

                <div className="question-block">
                  <label htmlFor="focus">{t("wizard.career")}</label>
                  <select
                    id="focus"
                    className="text-input"
                    value={profile.careerFocus}
                    onChange={(e) => patch({ careerFocus: e.target.value as any })}
                  >
                    {careerFocusesList.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* ADDITIONAL CONSTRAINTS */}
              <div className="question-block" style={{ marginTop: "12px" }}>
                <label>{t("wizard.infrastructure")}:</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "10px", marginTop: "8px" }}>
                  <label className="toggle-row" style={{ padding: "10px", borderRadius: "10px", background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
                    <span>
                      <strong>Нужно общежитие в кампусе</strong>
                      <small>Важно для иногородних абитуриентов</small>
                    </span>
                    <input
                      type="checkbox"
                      checked={profile.dormitoryNeeded ?? true}
                      onChange={(e) => patch({ dormitoryNeeded: e.target.checked })}
                    />
                    <i />
                  </label>
                  <label className="toggle-row" style={{ padding: "10px", borderRadius: "10px", background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
                    <span>
                      <strong>Военная кафедра при вузе</strong>
                      <small>Освобождение от срочной службы</small>
                    </span>
                    <input
                      type="checkbox"
                      checked={profile.militaryDepartment ?? false}
                      onChange={(e) => patch({ militaryDepartment: e.target.checked })}
                    />
                    <i />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Проверка анкеты */}
          {step === 4 && (
            <div className="summary-grid">
              <article>
                <span>Выбранные направления ({selectedInterests.length})</span>
                <strong>
                  {selectedInterests.map((k) => interestLabels[k]?.title || k).join(" • ")}
                </strong>
                <button type="button" onClick={() => setStep(1)}>
                  {t("wizard.edit")}
                </button>
              </article>
              <article>
                <span>Предметы ЕНТ</span>
                <strong>{profile.untCombination}</strong>
                <button type="button" onClick={() => setStep(1)}>
                  {t("wizard.edit")}
                </button>
              </article>
              <article>
                <span>Академика (GPA 4.0)</span>
                <strong>
                  {profile.grade.includes("класс") || profile.grade.length > 2 ? profile.grade : `${profile.grade} класс`} • GPA {profile.gpa.toFixed(2)}/4.0 • ЕНТ {profile.unt ?? "не сдан"} {profile.sat ? `• SAT ${profile.sat}` : ""}
                </strong>
                <button type="button" onClick={() => setStep(2)}>
                  {t("wizard.edit")}
                </button>
              </article>
              <article>
                <span>Финансы и города</span>
                <strong>
                  {profile.onlyGrant ? "Только госгрант (0 ₸)" : `${formatMoney(profile.budget)} / год`} • {profile.preferredCities.join(", ")}
                </strong>
                <button type="button" onClick={() => setStep(3)}>
                  {t("wizard.edit")}
                </button>
              </article>
              <article>
                <span>Язык и инфраструктура</span>
                <strong>
                  {profile.language} • {profile.dormitoryNeeded ? "С общежитием" : "Без общежития"} {profile.militaryDepartment ? "• Воен. кафедра" : ""}
                </strong>
                <button type="button" onClick={() => setStep(3)}>
                  {t("wizard.edit")}
                </button>
              </article>
              <article>
                <span>Выпуск и приём</span>
                <strong>Лето {profile.enrollmentYear} года</strong>
                <button type="button" onClick={() => setStep(0)}>
                  {t("wizard.edit")}
                </button>
              </article>
            </div>
          )}

          <div className="wizard-footer">
            <button type="button" className="button subtle" onClick={back}>
              <Chevron direction="left" /> {t("wizard.back")}
            </button>
            <span>{t("wizard.counter", { current: step + 1, total: 5 })}</span>
            <button type="button" className="button primary" disabled={!canContinue} onClick={next}>
              {step === 4 ? (
                <>
                  <SparkIcon /> {t("wizard.build")}
                </>
              ) : (
                <>
                  {t("wizard.continue")} <Chevron />
                </>
              )}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

/* =========================================================================
   RESULTS SCREEN WITH ENHANCED DIAGNOSTICS
   ========================================================================= */

function ResultsScreen({
  profile,
  matches,
  notice,
  shortlistIds,
  onToggleShortlist,
  onEdit,
  onCompare,
  onRoadmap,
  onTarget,
  onViewProgram,
  onOpenWhatIf,
}: {
  profile: StudentProfile;
  matches: Match[];
  notice: string;
  shortlistIds: string[];
  onToggleShortlist: (id: string) => void;
  onEdit: () => void;
  onCompare: () => void;
  onRoadmap: () => void;
  onTarget: (id: string) => void;
  onViewProgram: (id: string) => void;
  onOpenWhatIf: () => void;
}) {
  const { t, locale } = useI18n();
  const readiness = profileReadiness(profile);
  const [expandedId, setExpandedId] = useState<string | null>(matches[0]?.program.id ?? null);
  const [aiRecommendation, setAiRecommendation] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const requestAiRecommendation = async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      const response = await fetch("/api/ai-advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-uniflow-locale": locale },
        body: JSON.stringify({ taskType: "recommendations", studentProfile: profile, locale }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || t("results.aiError"));
      setAiRecommendation(data.response);
    } catch (error) {
      setAiError(error instanceof Error ? error.message : t("results.aiError"));
    } finally {
      setAiLoading(false);
    }
  };

  const profileInterests: Interest[] =
    profile.interests && profile.interests.length > 0
      ? profile.interests
      : profile.interest
      ? [profile.interest]
      : [];

  const strengths = [
    profile.gpa >= 3.6 ? `Высокий средний балл GPA — ${profile.gpa.toFixed(2)} из 4.0` : `GPA ${profile.gpa.toFixed(2)}/4.0 принят к расчёту`,
    profile.unt
      ? `Текущий ЕНТ ${profile.unt} даёт допуск в аккредитованные вузы`
      : "ЕНТ добавлен в персональный таймлайн подготовки",
    profile.untCombination !== "Ещё не определился"
      ? `Профильная комбинация ЕНТ «${profile.untCombination}» точно подходит для выбранных направлений`
      : "Рекомендуется зафиксировать комбинацию предметов ЕНТ",
    profile.ielts
      ? `IELTS ${profile.ielts} снимает языковой барьер при поступлении`
      : "Вузы принимают вступительный тест AET/KEET вместо IELTS",
    ...(profile.sat ? [`Балл SAT ${profile.sat} даёт преимущество для Назарбаев Университета и зарубежных вузов`] : []),
  ];

  const constraints = [
    profile.onlyGrant
      ? "Выбрана траектория ТОЛЬКО ГРАНТ — конкуренция на конкурсе МОН/Минздрава потребует высокого ЕНТ"
      : profile.scholarshipImportant
      ? "Грант в приоритете — ключевой фактор успеха на конкурсе ЕНТ"
      : "Бюджет достаточен для выбранных программ",
    profile.budget < 2_000_000 && !profile.onlyGrant
      ? "Часть столичных англоязычных программ (КБТУ, КИМЭП) выше текущего лимита"
      : "Финансовый лимит покрывает большинство образовательных программ",
    ...(profile.dormitoryNeeded ? ["Важно наличие студенческого общежития в кампусе"] : []),
  ];

  return (
    <main className="dashboard container">
      {notice && (
        <div className="change-banner card-glass">
          <span>↻</span>
          <div>
            <strong>Маршрут пересчитан в реальном времени</strong>
            <p>{notice}</p>
          </div>
        </div>
      )}

      {/* Intro & Diagnostics */}
      <section className="results-intro">
        <div>
          <div className="eyebrow-pill">
            <SparkIcon size={14} /> {t("results.kicker")}
          </div>
          <h1>
            {t("results.title", { name: profile.name ? `${profile.name}, ` : "" })}
          </h1>
          <p className="subtitle">
            Мы сопоставили твои направления ({profileInterests.map((k) => interestLabels[k]?.title || k).join(", ")}), комбинацию предметов ЕНТ ({profile.untCombination}), GPA {profile.gpa.toFixed(2)}/4.0 и
            финансовую траекторию с официальными данными вузов.
          </p>
        </div>

        <div className="readiness-card card-glass">
          <ScoreRing value={readiness} size="large" />
          <div>
            <span>Готовность профиля</span>
            <strong>{readiness >= 80 ? "Сильная база поступления" : "Есть понятные точки роста"}</strong>
            <small>Полнота данных и соответствие критериям отбора.</small>
          </div>
        </div>
      </section>

      {/* Diagnosis Grid */}
      <section className="diagnosis-grid">
        <article className="card-glass">
          <div className="diagnosis-title good">
            <span>↑</span>
            <div>
              <small>Сильные сигналы</small>
              <strong>{strengths.length} преимущества</strong>
            </div>
          </div>
          <ul>
            {strengths.map((item) => (
              <li key={item}>
                <CheckIcon size={14} /> {item}
              </li>
            ))}
          </ul>
        </article>

        <article className="card-glass">
          <div className="diagnosis-title attention">
            <span>!</span>
            <div>
              <small>Точки внимания и риски</small>
              <strong>{constraints.length} фактора</strong>
            </div>
          </div>
          <ul>
            {constraints.map((item) => (
              <li key={item}>
                <b>—</b> {item}
              </li>
            ))}
          </ul>
        </article>

        <article className="goal-card card-glass">
          <small>Выбранные сферы ({profileInterests.length})</small>
          <strong>
            {profileInterests.map((k) => interestLabels[k]?.title || k).join(" • ")}
          </strong>
          <span>
            {profile.preferredCities.join(" • ")} • Набор {profile.enrollmentYear} года
          </span>
          <div className="goal-tags">
            <i>{profile.onlyGrant ? "Только грант (0 ₸)" : `${formatMoney(profile.budget)} / год`}</i>
            <i>{profile.language}</i>
            <i>{profile.careerFocus}</i>
            {profile.dormitoryNeeded && <i>Общежитие</i>}
            {profile.militaryDepartment && <i>Воен. кафедра</i>}
          </div>
          <button className="button subtle small edit-btn" onClick={onEdit}>
            ✎ {t("results.edit")}
          </button>
        </article>
      </section>

      {/* Matches List */}
      <section className="matches-section">
        <div className="section-heading">
          <div>
            <p className="section-kicker">{t("results.topKicker")}</p>
            <h2>{t("results.topTitle")}</h2>
            <p>{t("results.topDescription")}</p>
          </div>
          <div className="header-actions-group">
            <button className="button ghost small" onClick={onOpenWhatIf}>
              <SlidersIcon size={14} /> {t("results.whatIf")}
            </button>
            <button className="button primary small" onClick={requestAiRecommendation} disabled={aiLoading}>
              <SparkIcon size={14} /> {aiLoading ? t("results.aiLoading") : t("results.aiButton")}
            </button>
            <button className="button outline small" onClick={onCompare}>
              {t("results.compare")} <Chevron size={14} />
            </button>
          </div>
        </div>

        {(aiRecommendation || aiError) && (
          <div className="ai-catalog-panel" role="status">
            <strong>{t("results.aiTitle")}</strong>
            <div>{aiRecommendation ?? aiError}</div>
          </div>
        )}

        <div className="matches-list">
          {matches.map((match, index) => {
            const isExpanded = expandedId === match.program.id;
            const isBookmarked = shortlistIds.includes(match.program.id);

            return (
              <article
                className={`match-card card-glass ${index === 0 ? "featured" : ""}`}
                key={match.program.id}
              >
                <div className="match-rank">
                  <span>0{index + 1}</span>
                  <b>{index === 0 ? "Лучшее совпадение" : index === 1 ? "Сильный вариант" : "Альтернатива"}</b>
                  <button
                    className={`bookmark-btn ${isBookmarked ? "active" : ""}`}
                    onClick={() => onToggleShortlist(match.program.id)}
                    title={isBookmarked ? "В шорт-листе" : "Добавить в шорт-лист"}
                  >
                    <BookmarkIcon filled={isBookmarked} size={16} />
                  </button>
                </div>

                <div className="match-main">
                  <span className="uni-mark">{match.program.shortName.slice(0, 2)}</span>
                  <div className="match-info">
                    <div className="match-meta">
                      <span>{match.program.city}</span>
                      <i>•</i>
                      <span>{match.program.duration}</span>
                      <i>•</i>
                      <span>{match.program.language}</span>
                    </div>
                    <h3>{match.program.university}</h3>
                    <p>
                      {match.program.program} <span>{match.program.code}</span>
                    </p>
                    <div className="tag-row">
                      {match.program.highlights.slice(0, 3).map((tag) => (
                        <span key={tag}>{tag}</span>
                      ))}
                    </div>
                  </div>
                  <ScoreRing value={match.score} size="normal" />
                </div>

                <div className="match-columns">
                  <div className="why">
                    <h4>{t("results.why")}</h4>
                    {match.reasons.slice(0, 3).map((reason) => (
                      <p key={reason}>
                        <i>
                          <CheckIcon size={14} />
                        </i>
                        {reason}
                      </p>
                    ))}
                  </div>
                  <div className="fact-box">
                    <div>
                      <span>{t("results.cost")}</span>
                      <strong>{match.program.tuitionLabel}</strong>
                      <ConfidenceBadge confidence={match.program.tuitionConfidence} />
                    </div>
                    <div>
                      <span>{t("results.funding")}</span>
                      <strong className={match.breakdown.budget >= 70 ? "text-success" : "text-warning"}>
                        {profile.onlyGrant
                          ? match.program.scholarship
                            ? "✓ Доступен грант МОН"
                            : "Только платно"
                          : match.breakdown.budget === 100
                          ? "✓ В рамках бюджета"
                          : "Требуется грант / запас"}
                      </strong>
                    </div>
                  </div>
                </div>

                {match.gaps.length > 0 && (
                  <div className="gap-line">
                    <span>!</span>
                    <p>
                      <strong>Точка роста:</strong> {match.gaps[0]}
                    </p>
                  </div>
                )}

                {/* Expanded Details Breakdown */}
                {isExpanded && (
                  <div className="match-details">
                    <div>
                      <h4>Детализация баллов ({match.score}/100)</h4>
                      {[
                        ["academic", "Академика"],
                        ["program", "Направление"],
                        ["budget", "Бюджет"],
                        ["language", "Язык"],
                        ["location", "Локация"],
                        ["preferences", "Приоритеты"],
                      ].map(([key, label]) => (
                        <div className="score-bar" key={key}>
                          <span>{label}</span>
                          <i>
                            <b style={{ width: `${(match.breakdown as any)[key]}%` }} />
                          </i>
                          <strong>{(match.breakdown as any)[key]}</strong>
                        </div>
                      ))}
                    </div>

                    <div className="requirements">
                      <h4>Требования и источники</h4>
                      <p>
                        <span>Профили ЕНТ</span>
                        <strong>{match.program.untCombinations.join(", ")}</strong>
                      </p>
                      <p>
                        <span>Порог ЕНТ</span>
                        <strong>{match.program.untPaid ? `${match.program.untPaid}+` : "уточнить"}</strong>
                      </p>
                      <p>
                        <span>Ориентир на грант</span>
                        <strong>{match.program.untGrant ? `${match.program.untGrant}+` : "конкурсный отбор"}</strong>
                      </p>
                      <p>
                        <span>Тариф за</span>
                        <strong>{match.program.tuitionYear}</strong>
                      </p>
                      {match.program.dataNote && <small>{match.program.dataNote}</small>}
                      <a href={match.program.source.url} target="_blank" rel="noreferrer">
                        Официальный портал {match.program.shortName} <ExternalLinkIcon size={12} />
                      </a>
                    </div>
                  </div>
                )}

                <div className="match-footer">
                  <div className="footer-left-buttons">
                    <button
                      className="text-button"
                      onClick={() => setExpandedId(isExpanded ? null : match.program.id)}
                    >
                      {isExpanded ? t("results.hideDetails") : t("results.details")}
                      <Chevron direction={isExpanded ? "down" : "right"} size={14} />
                    </button>
                    <button
                      className="button subtle small"
                      onClick={() => onViewProgram(match.program.id)}
                    >
                      Карточка вуза & Отзывы
                    </button>
                  </div>

                  <button className="button primary" onClick={() => onTarget(match.program.id)}>
                    {t("results.target")} <Chevron size={14} />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}

/* =========================================================================
   COMPARE SCREEN
   ========================================================================= */

function CompareScreen({
  matches,
  profile,
  defaultLeftId,
  onEdit,
  onRoadmap,
  onTarget,
  onViewProgram,
}: {
  matches: Match[];
  profile: StudentProfile;
  defaultLeftId: string;
  onEdit: () => void;
  onRoadmap: () => void;
  onTarget: (id: string) => void;
  onViewProgram: (id: string) => void;
}) {
  const { t } = useI18n();
  const [leftId, setLeftId] = useState(defaultLeftId || matches[0]?.program.id || "");
  const [rightId, setRightId] = useState(
    matches.find((m) => m.program.id !== defaultLeftId)?.program.id || matches[1]?.program.id || ""
  );

  const left = matches.find((m) => m.program.id === leftId) ?? matches[0];
  const right = matches.find((m) => m.program.id === rightId) ?? matches[1];

  if (!left || !right) return null;

  const rows: Array<[string, string, string]> = [
    ["Совместимость", `${left.score}/100`, `${right.score}/100`],
    ["Стоимость обучения", left.program.tuitionLabel, right.program.tuitionLabel],
    ["Город кампуса", left.program.city, right.program.city],
    ["Срок программы", left.program.duration, right.program.duration],
    ["Язык обучения", left.program.language, right.program.language],
    ["Профильные предметы ЕНТ", left.program.untCombinations.join(" / "), right.program.untCombinations.join(" / ")],
    [
      "Порог ЕНТ (платно)",
      left.program.untPaid ? `${left.program.untPaid}+` : "уточнить",
      right.program.untPaid ? `${right.program.untPaid}+` : "уточнить",
    ],
    [
      "Ориентир на грант",
      left.program.untGrant ? `${left.program.untGrant}+` : "конкурс",
      right.program.untGrant ? `${right.program.untGrant}+` : "конкурс",
    ],
    [
      "Английский (IELTS)",
      left.program.ielts
        ? `${left.program.ielts}+`
        : left.program.alternativeEnglishExam
        ? "внутренний AET/KEET"
        : "не требуется",
      right.program.ielts
        ? `${right.program.ielts}+`
        : right.program.alternativeEnglishExam
        ? "внутренний AET/KEET"
        : "не требуется",
    ],
    [
      "Трудоустройство выпускников",
      left.program.employmentRate || "уточнить",
      right.program.employmentRate || "уточнить",
    ],
    [
      "Ориентир проживания",
      left.program.livingCostEstimateKzt ? `~${formatMoney(left.program.livingCostEstimateKzt)}/мес` : "уточнить",
      right.program.livingCostEstimateKzt ? `~${formatMoney(right.program.livingCostEstimateKzt)}/мес` : "уточнить",
    ],
  ];

  return (
    <main className="dashboard container">
      <div className="section-heading-block">
        <div className="eyebrow-pill">
          <SparkIcon size={14} /> Инструмент осознанного выбора
        </div>
        <h1>{t("compare.title")}</h1>
        <p className="subtitle">
          Сопоставь требования, академическую нагрузку, финансовые затраты и перспективы трудоустройства.
        </p>
      </div>

      <section className="compare-shell card-glass">
        <div className="compare-head">
          <div className="compare-label">Критерий оценки</div>
          {[left, right].map((match, index) => (
            <div className="compare-program" key={`${match.program.id}-${index}`}>
              <select
                value={index === 0 ? leftId : rightId}
                onChange={(e) => (index === 0 ? setLeftId(e.target.value) : setRightId(e.target.value))}
              >
                {matches
                  .filter((m) => (index === 0 ? m.program.id !== rightId : m.program.id !== leftId))
                  .map((m) => (
                    <option value={m.program.id} key={m.program.id}>
                      {m.program.shortName} • {m.program.program}
                    </option>
                  ))}
              </select>

              <div className="compare-uni-box">
                <span className="uni-mark small">{match.program.shortName.slice(0, 2)}</span>
                <div>
                  <strong>{match.program.shortName}</strong>
                  <small>{match.program.program}</small>
                </div>
                <ScoreRing value={match.score} size="tiny" />
              </div>
            </div>
          ))}
        </div>

        {rows.map(([label, lVal, rVal]) => (
          <div className="compare-row" key={label}>
            <span>{label}</span>
            <strong className={lVal.includes("✓") || lVal.includes("100") ? "positive" : ""}>{lVal}</strong>
            <strong className={rVal.includes("✓") || rVal.includes("100") ? "positive" : ""}>{rVal}</strong>
          </div>
        ))}

        <div className="compare-verdict">
          <span>Персональный вывод</span>
          <div>
            <strong>{left.score >= right.score ? "Лидирует по общему мэтчу" : "Альтернативный вариант"}</strong>
            <p>{left.reasons[0]}</p>
          </div>
          <div>
            <strong>
              {right.program.tuitionKzt < left.program.tuitionKzt
                ? "Выгоднее по стоимости обучения"
                : "Сильный альтернативный профиль"}
            </strong>
            <p>{right.reasons[0]}</p>
          </div>
        </div>

        <div className="compare-actions">
          <span />
          <button
            className="button primary"
            onClick={() => {
              onTarget(left.program.id);
              onRoadmap();
            }}
          >
            Выбрать {left.program.shortName} целью
          </button>
          <button
            className="button outline"
            onClick={() => {
              onTarget(right.program.id);
              onRoadmap();
            }}
          >
            Выбрать {right.program.shortName} целью
          </button>
        </div>
      </section>
    </main>
  );
}

/* =========================================================================
   ROADMAP SCREEN
   ========================================================================= */

function RoadmapScreen({
  profile,
  match,
  completed,
  onToggle,
  onEdit,
  onChangeTarget,
  onViewDetails,
}: {
  profile: StudentProfile;
  match: Match;
  completed: string[];
  onToggle: (id: string) => void;
  onEdit: () => void;
  onChangeTarget: () => void;
  onViewDetails: () => void;
}) {
  const { t } = useI18n();
  const tasks = buildRoadmap(profile, match);
  const next = tasks.find((task) => !completed.includes(task.id));
  const progress = Math.round(
    (completed.filter((id) => tasks.some((t) => t.id === id)).length / Math.max(1, tasks.length)) * 100
  );

  const taskIcons: Record<RoadmapTask["category"], string> = {
    profile: "◎",
    exam: "✦",
    documents: "▤",
    application: "↗",
  };

  return (
    <main className="dashboard roadmap-page container">
      <div className="page-title roadmap-title">
        <div>
          <div className="eyebrow-pill">
            <SparkIcon size={14} /> Персональный пошаговый маршрут
          </div>
          <h1>{t("roadmap.title", { university: match.program.shortName })}</h1>
          <p className="subtitle">
            {match.program.program} • Набор на осень {profile.enrollmentYear} года
          </p>
        </div>

        <div className="route-progress card-glass">
          <ScoreRing value={progress} size="normal" showLabel={false} />
          <div>
            <strong>{progress}% выполнено</strong>
            <span>{completed.length} из {tasks.length} ключевых шагов</span>
          </div>
        </div>
      </div>

      {next ? (
        <section className="next-action card-glass">
          <div className="next-icon">→</div>
          <div>
            <small>СЛЕДУЮЩЕЕ ПРИОРИТЕТНОЕ ДЕЙСТВИЕ</small>
            <h2>{next.title}</h2>
            <p>{next.description}</p>
            <span className="action-date">🗓 {next.dateLabel}</span>
          </div>
          <button className="button light" onClick={() => onToggle(next.id)}>
            <CheckIcon size={14} /> Отметить выполненным
          </button>
        </section>
      ) : (
        <section className="next-action complete card-glass">
          <div className="next-icon">
            <CheckIcon size={20} />
          </div>
          <div>
            <small>ПОЗДРАВЛЯЕМ! МАРШРУТ ПРОЙДЕН</small>
            <h2>Все запланированные шаги отмечены</h2>
            <p>Следи за приказами о зачислении и проверяй личный кабинет абитуриента {match.program.shortName}.</p>
          </div>
        </section>
      )}

      <section className="roadmap-layout">
        <div className="timeline card-glass">
          <div className="timeline-head">
            <div>
              <h2>Хронологический план подготовки</h2>
              <p>Разделяем личные контрольные точки и официальные даты вуза.</p>
            </div>
            <div className="legend">
              <span>
                <i className="personal" /> Личная цель
              </span>
              <span>
                <i className="check" /> Официальная дата МОН РК
              </span>
            </div>
          </div>

          {tasks.map((task, index) => {
            const done = completed.includes(task.id);
            return (
              <article className={`timeline-task ${done ? "done" : ""}`} key={task.id}>
                <div className="timeline-line">
                  <span>{done ? <CheckIcon size={12} /> : taskIcons[task.category]}</span>
                  {index < tasks.length - 1 && <i />}
                </div>

                <div className="task-content">
                  <div className="task-top">
                    <span className={`date-label ${task.dateType}`}>
                      {task.dateType === "personal"
                        ? "Личная цель"
                        : task.dateType === "official"
                        ? "Официально"
                        : "Проверить"}{" "}
                      • {task.dateLabel}
                    </span>
                    <button
                      className={`task-check ${done ? "active" : ""}`}
                      onClick={() => onToggle(task.id)}
                    >
                      {done ? (
                        <>
                          <CheckIcon size={12} /> Выполнено
                        </>
                      ) : (
                        "Отметить"
                      )}
                    </button>
                  </div>

                  <h3>{task.title}</h3>
                  <p>{task.description}</p>
                  <details>
                    <summary>Почему это важно?</summary>
                    <p>{task.reason}</p>
                  </details>
                </div>
              </article>
            );
          })}
        </div>

        <aside className="route-sidebar">
          <div className="route-target card-glass">
            <span>ЦЕЛЕВОЙ УНИВЕРСИТЕТ</span>
            <span className="uni-mark large">{match.program.shortName.slice(0, 2)}</span>
            <strong>{match.program.university}</strong>
            <p>{match.program.program}</p>

            <div className="target-card-btn-group">
              <button className="button outline small full-width" onClick={onViewDetails}>
                Карточка программы & Отзывы
              </button>
              <button className="text-button" onClick={onChangeTarget}>
                Сменить целевой вуз
              </button>
            </div>
          </div>

          <div className="route-warning card-glass">
            <span>!</span>
            <div>
              <strong>Даты набора {profile.enrollmentYear} уточняются</strong>
              <p>
                Мы показываем ориентировочные сроки подготовки. Всегда сверяй официальный календарь приёма на сайте вуза.
              </p>
            </div>
          </div>

          <div className="route-stats card-glass">
            <p>
              <span>Стоимость</span>
              <strong>{match.program.tuitionLabel}</strong>
            </p>
            <p>
              <span>Порог ЕНТ</span>
              <strong>{match.program.untPaid ? `${match.program.untPaid}+` : "уточнить"}</strong>
            </p>
            <p>
              <span>Язык</span>
              <strong>{match.program.language}</strong>
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}
