"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
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
import { localizeDisplay } from "@/lib/display-localization";
import { loadAccountState, syncToCloud, supabase } from "@/lib/supabase";

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

const appScreens: Screen[] = [
  "landing",
  "onboarding",
  "dashboard",
  "results",
  "explore",
  "compare",
  "shortlist",
  "roadmap",
  "what-if",
];

function isAppScreen(value: unknown): value is Screen {
  return typeof value === "string" && appScreens.includes(value as Screen);
}

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

const blankProfile: StudentProfile = {
  name: "",
  grade: "11",
  homeCity: "",
  enrollmentYear: 2027,
  interests: [],
  interest: undefined,
  untCombination: "Ещё не определился",
  favoriteSubjects: [],
  gpa: 0,
  unt: undefined,
  ielts: undefined,
  preferredCities: [],
  preferredCountries: ["Казахстан"],
  budget: 0,
  onlyGrant: false,
  scholarshipImportant: true,
  language: "Неважно",
  careerFocus: "Неважно",
  dormitoryNeeded: false,
  militaryDepartment: false,
};

function hasCompleteProfile(profile: StudentProfile) {
  return Boolean(
    profile.name.trim() &&
    profile.homeCity.trim() &&
    profile.interests.length > 0 &&
    profile.gpa >= 2 &&
    profile.preferredCities.length > 0 &&
    (profile.onlyGrant || profile.budget > 0)
  );
}

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
  const { t, locale } = useI18n();
  const [screen, setScreen] = useState<Screen>("landing");
  const screenRef = useRef<Screen>("landing");
  const [profile, setProfile] = useState<StudentProfile>(blankProfile);
  const profileCompleteRef = useRef(false);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const authUserIdRef = useRef<string | null>(null);
  const [profileHydrated, setProfileHydrated] = useState(false);
  const [targetId, setTargetId] = useState<string>("aitu-big-data");
  const [completed, setCompleted] = useState<string[]>([]);
  const [shortlist, setShortlist] = useState<ShortlistItem[]>([]);
  const [applications, setApplications] = useState<ApplicationItem[]>([]);

  const [notice, setNotice] = useState("");
  const [cloudStatus, setCloudStatus] = useState<string>("Подключено к Supabase");
  const [editingFrom, setEditingFrom] = useState<string>("");
  const [modalProgramId, setModalProgramId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const hydrateAccount = async (user: User, seed: Partial<StudentProfile> = {}) => {
    authUserIdRef.current = user.id;
    setAuthUserId(user.id);
    setProfileHydrated(false);

    const saved = await loadAccountState(user.id);
    const metadataName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "";
    const loadedProfile: StudentProfile = {
      ...blankProfile,
      ...seed,
      ...(saved.profile ?? {}),
      name: saved.profile?.name || seed.name || metadataName,
    };

    setProfile(loadedProfile);
    setTargetId(saved.targetId ?? "aitu-big-data");
    setCompleted(saved.completed ?? []);
    setShortlist(saved.shortlist ?? []);
    setApplications(saved.applications ?? []);
    profileCompleteRef.current = hasCompleteProfile(loadedProfile);
    setProfileHydrated(true);
    setCloudStatus(saved.profile ? "Профиль загружен из Supabase" : "Аккаунт подключён — заполните анкету");
    return loadedProfile;
  };

  // Load only the state owned by the authenticated Supabase account.
  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) void hydrateAccount(data.session.user);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
      if (session?.user) {
        window.setTimeout(() => void hydrateAccount(session.user), 0);
        return;
      }

      authUserIdRef.current = null;
      profileCompleteRef.current = false;
      setAuthUserId(null);
      setProfileHydrated(false);
      setProfile(blankProfile);
      setTargetId("aitu-big-data");
      setCompleted([]);
      setShortlist([]);
      setApplications([]);
      setCloudStatus("Войдите, чтобы сохранить маршрут");
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // Keep the single-page screen state in the browser history so the browser,
  // Android and trackpad Back actions return to the previous UniFlow screen.
  useEffect(() => {
    const currentState = window.history.state && typeof window.history.state === "object"
      ? window.history.state
      : {};
    window.history.replaceState({ ...currentState, uniflowScreen: screenRef.current }, "", window.location.href);

    const handlePopState = (event: PopStateEvent) => {
      const requested = isAppScreen(event.state?.uniflowScreen) ? event.state.uniflowScreen : "landing";
      const previousScreen = requested !== "landing" && !authUserIdRef.current
        ? "landing"
        : requested !== "landing" && requested !== "onboarding" && !profileCompleteRef.current
        ? "onboarding"
        : requested;
      screenRef.current = previousScreen;
      setScreen(previousScreen);
      setMobileMenuOpen(false);
      window.scrollTo({ top: 0, behavior: "auto" });
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Save changes and sync to Supabase
  useEffect(() => {
    profileCompleteRef.current = hasCompleteProfile(profile);
    if (!authUserId || !profileHydrated) return;
    syncToCloud({ profile, targetId, completed, shortlist, applications }).then((res) => {
      setCloudStatus(res.message);
    });
  }, [authUserId, profileHydrated, profile, targetId, completed, shortlist, applications]);

  // Matches calculation
  const allMatches = useMemo(() => matchPrograms(profile), [profile]);
  const topMatches = useMemo(() => diversified(allMatches, 4), [allMatches]);
  const target = allMatches.find((item) => item.program.id === targetId) ?? topMatches[0] ?? allMatches[0];

  const modalProgram = modalProgramId ? programs.find((p) => p.id === modalProgramId) : null;
  const modalMatch = modalProgramId ? allMatches.find((m) => m.program.id === modalProgramId) : undefined;

  const navigate = (next: Screen) => {
    const safeNext = next !== "landing" && !authUserIdRef.current
      ? "landing"
      : next !== "landing" && next !== "onboarding" && !hasCompleteProfile(profile)
      ? "onboarding"
      : next;
    if (screenRef.current === safeNext) {
      setMobileMenuOpen(false);
      return;
    }

    screenRef.current = safeNext;
    setScreen(safeNext);
    setMobileMenuOpen(false);
    if (typeof window !== "undefined") {
      const currentState = window.history.state && typeof window.history.state === "object"
        ? window.history.state
        : {};
      window.history.pushState({ ...currentState, uniflowScreen: safeNext }, "", window.location.href);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const navigateBack = (fallback: Screen) => {
    if (typeof window !== "undefined" && isAppScreen(window.history.state?.uniflowScreen) && window.history.length > 1) {
      window.history.back();
      return;
    }
    navigate(fallback);
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
    if (!hasCompleteProfile(profile)) {
      setNotice(locale === "en" ? "Complete the required profile fields before building your route." : locale === "kk" ? "Маршрутты құрмас бұрын профильдің міндетті өрістерін толтыр." : "Заполни обязательные поля профиля перед построением маршрута.");
      return;
    }
    const nextTop = diversified(matchPrograms(profile), 1)[0];
    if (editingFrom) {
      const previous = allMatches.find((item) => item.program.id === editingFrom)?.program.shortName;
      setNotice(
        previous && nextTop && previous !== nextTop.program.shortName
          ? locale === "en" ? `The top match changed: ${previous} → ${nextTop.program.shortName}. Scores and roadmap were updated.` : locale === "kk" ? `Үздік сәйкестік өзгерді: ${previous} → ${nextTop.program.shortName}. Балдар мен жол картасы жаңартылды.` : `Лидер изменился: ${previous} → ${nextTop.program.shortName}. Обновлены баллы и дорожная карта.`
          : locale === "en" ? "Fit scores, recommendations, and the step-by-step roadmap have been updated." : locale === "kk" ? "Сәйкестік балдары, ұсынымдар және қадамдық маршрут жаңартылды." : "Обновлены баллы совместимости, рекомендации и пошаговый маршрут."
      );
    }
    setTargetId(nextTop?.program.id ?? targetId);
    setEditingFrom("");
    navigate("dashboard");
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn("SignOut error:", e);
    }
    authUserIdRef.current = null;
    profileCompleteRef.current = false;
    setAuthUserId(null);
    setProfileHydrated(false);
    setProfile(blankProfile);
    setTargetId("aitu-big-data");
    setCompleted([]);
    setShortlist([]);
    setApplications([]);
    setNotice(locale === "en" ? "You have signed out" : locale === "kk" ? "Аккаунттан шықтыңыз" : "Вы вышли из аккаунта");
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
              <nav className={`product-nav ${mobileMenuOpen ? "mobile-open" : ""}`} aria-label={locale === "en" ? "Product navigation" : locale === "kk" ? "Өнім бөлімдері" : "Разделы навигатора"}>
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
            ) : screen !== "onboarding" ? (
              <nav className={`landing-nav ${mobileMenuOpen ? "mobile-open" : ""}`} aria-label={locale === "en" ? "Navigation" : locale === "kk" ? "Навигация" : "Навигация"}>
                <button className="navlink" onClick={() => navigate("explore")}>{t("nav.catalog")}</button>
                <button className="navlink" onClick={() => navigate("what-if")}>{t("nav.whatIf")}</button>
              </nav>
            ) : <div aria-hidden="true" />}

            <div className="header-meta">
              {authUserId && (
                <>
                  <button className="button subtle small profile-pill-btn" onClick={editProfile}>
                    {profile.name || (locale === "en" ? "Profile" : locale === "kk" ? "Профиль" : "Профиль")}
                  </button>
                  <button
                    className="button subtle small"
                    onClick={handleLogout}
                    style={{ fontSize: "12px", color: "#EF4444", padding: "4px 8px" }}
                    title={locale === "en" ? "Sign out" : locale === "kk" ? "Аккаунттан шығу" : "Выйти из аккаунта"}
                  >
                    {t("nav.logout")}
                  </button>
                </>
              )}
              <button
                className="mobile-menu-toggle"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={locale === "en" ? "Menu" : locale === "kk" ? "Мәзір" : "Меню"}
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
          isAuthenticated={Boolean(authUserId)}
          onLogout={handleLogout}
          onStart={() => {
            navigate(hasCompleteProfile(profile) ? "dashboard" : "onboarding");
          }}
          onNavigate={(s) => navigate(s as Screen)}
          onAuthSuccess={async (authProfile) => {
            const { data } = await supabase.auth.getUser();
            if (!data.user) return;
            const loaded = await hydrateAccount(data.user, authProfile);
            setNotice(locale === "en" ? `Signed in as ${loaded.name || "User"}` : locale === "kk" ? `Кіру орындалды: ${loaded.name || "Пайдаланушы"}` : `Вход выполнен: ${loaded.name || "Пользователь"}`);
            navigate(hasCompleteProfile(loaded) ? "dashboard" : "onboarding");
          }}
        />
      )}

      {screen === "onboarding" && (
        <OnboardingScreen
          profile={profile}
          setProfile={setProfile}
          onCancel={() => navigateBack(editingFrom ? "dashboard" : "landing")}
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
            setNotice(locale === "en" ? "Simulation settings were saved to your main applicant profile!" : locale === "kk" ? "Симуляция параметрлері негізгі талапкер профиліне сақталды!" : "Параметры из симулятора сохранены в основной профиль абитуриента!");
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
  const { t, locale } = useI18n();
  const ld = (value: string) => localizeDisplay(value, locale);
  const interestDescription = (category: InterestCategory) => {
    if (locale === "ru") return "";
    const descriptions: Record<InterestCategory, { en: string; kk: string }> = {
      "it-ai": { en: "Technology, software, data, and intelligent systems", kk: "Технология, бағдарламалау, деректер және зияткерлік жүйелер" },
      "business-finance": { en: "Business, finance, analytics, and entrepreneurship", kk: "Бизнес, қаржы, талдау және кәсіпкерлік" },
      engineering: { en: "Engineering design, production, and modern technologies", kk: "Инженерлік жобалау, өндіріс және заманауи технологиялар" },
      "medicine-health": { en: "Medicine, clinical practice, and healthcare technologies", kk: "Медицина, клиникалық тәжірибе және денсаулық сақтау технологиялары" },
      "law-social": { en: "Law, international relations, and social sciences", kk: "Құқық, халықаралық қатынастар және әлеуметтік ғылымдар" },
      "design-creative": { en: "Design, media, digital products, and creative industries", kk: "Дизайн, медиа, цифрлық өнімдер және креативті индустриялар" },
      "natural-sciences": { en: "Mathematics, natural sciences, and research", kk: "Математика, жаратылыстану ғылымдары және зерттеу" },
      "languages-pedagogy": { en: "Languages, education, and learning technologies", kk: "Тілдер, білім беру және оқыту технологиялары" },
    };
    return descriptions[category][locale];
  };
  const [step, setStep] = useState(0);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const wizardSteps = [
    t("wizard.step.about"),
    t("wizard.step.direction"),
    t("wizard.step.academic"),
    t("wizard.step.preferences"),
    t("wizard.step.review"),
  ];
  const gradeOptions: Array<{ value: StudentProfile["grade"]; label: string }> = [
    { value: "9", label: t("wizard.grade.9") },
    { value: "10", label: t("wizard.grade.10") },
    { value: "11", label: t("wizard.grade.11") },
    { value: "Выпускник школы", label: t("wizard.grade.graduate") },
    { value: "Студент колледжа", label: t("wizard.grade.college") },
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
  const canContinue =
    step === 0
      ? profile.name.trim().length > 1 && profile.homeCity.trim().length > 1
      : step === 1
      ? selectedInterests.length > 0
      : step === 2
      ? profile.gpa >= 2 && profile.gpa <= 4
      : step === 3
      ? profile.preferredCities.length > 0 && (profile.onlyGrant || profile.budget > 0)
      : hasCompleteProfile(profile);

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
            <span>{t(`wizard.tip.${step}`)}</span>
          </div>
        </aside>

        <section className="wizard-card card-glass">
          {/* STEP 0: О тебе, класс, родной город */}
          {step === 0 && (
            <div className="form-stack">
              <div className="question-block">
                <label htmlFor="name">
                  {t("wizard.name")} <small>{t("wizard.nameHint")}</small>
                </label>
                <input
                  id="name"
                  className="text-input"
                  placeholder={t("wizard.namePlaceholder")}
                  value={profile.name}
                  onChange={(e) => patch({ name: e.target.value })}
                />
              </div>

              <div className="question-block">
                <label>{t("wizard.status")}</label>
                <div className="segmented-grid">
                  {gradeOptions.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      className={profile.grade === value ? "selected" : ""}
                      onClick={() => handleGradeChange(value)}
                    >
                      {label}
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
                          {ld(c)}
                        </option>
                      ))}
                      <option value="other">{t("wizard.otherCity")}</option>
                    </select>

                    {/* ONLY SHOW CUSTOM INPUT WHEN "other" IS SELECTED */}
                    {!kazakhstanHometowns.includes(profile.homeCity) && (
                      <div className="custom-city-wrapper" style={{ marginTop: "8px" }}>
                        <input
                          id="city-custom"
                          className="text-input"
                          placeholder={t("wizard.cityPlaceholder")}
                          value={profile.homeCity}
                          autoFocus
                          onChange={(e) => patch({ homeCity: e.target.value })}
                        />
                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
                          <small className="field-hint">
                            {t("wizard.cityQuotaHint")}
                          </small>
                          <button
                            type="button"
                            className="text-button"
                            style={{ fontSize: "12px", color: "var(--accent-primary, #10b981)" }}
                            onClick={() => patch({ homeCity: "Астана" })}
                          >
                            {t("wizard.chooseFromList")}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="question-block">
                  <label htmlFor="year">
                    {t("wizard.enrollmentYear")} <small>{t("wizard.autoCalculated")}</small>
                  </label>
                  <select
                    id="year"
                    className="text-input"
                    value={profile.enrollmentYear}
                    onChange={(e) => patch({ enrollmentYear: Number(e.target.value) as any })}
                  >
                    <option value={2027}>{t("wizard.yearNext", { year: 2027 })}</option>
                    <option value={2028}>{t("wizard.year", { year: 2028 })}</option>
                    <option value={2029}>{t("wizard.year", { year: 2029 })}</option>
                    <option value={2030}>{t("wizard.year", { year: 2030 })}</option>
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
                    {t("wizard.directions")} <small>{t("wizard.upToThree")}</small>
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
                  {t("wizard.directionHint")}
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
                      <span>{cat.icon}</span> {ld(cat.label)}
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
                            <strong>{ld(item.title)}</strong>
                            <small>{locale === "ru" ? item.description : interestDescription(item.category)}</small>
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
                  {t("wizard.untCombination")} <small>{t("wizard.grantCritical")}</small>
                </label>
                <div className="unt-comb-picker-grid">
                  {untCombinationsList.map((comb) => (
                    <button
                      key={comb}
                      type="button"
                      className={`unt-comb-btn ${profile.untCombination === comb ? "active" : ""}`}
                      onClick={() => patch({ untCombination: comb })}
                    >
                      <span>{ld(comb)}</span>
                      {profile.untCombination === comb && <CheckIcon size={14} />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="question-block">
                <label>
                  {t("wizard.subjects")} <small>{t("wizard.upToThree")}</small>
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
                        {active && <CheckIcon size={12} />} {ld(sub)}
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
                  <p>{t("wizard.gpaHint")}</p>
                </div>
                <div className="number-field">
                  <input
                    id="gpa"
                    type="number"
                    min="2.0"
                    max="4.0"
                    step="0.05"
                    value={profile.gpa || ""}
                    onChange={(e) => patch({ gpa: Number(e.target.value) })}
                  />
                  <span>/ 4.0</span>
                </div>
              </div>

              <div className="metric-input">
                <div>
                  <label htmlFor="unt">{t("wizard.unt")}</label>
                  <p>{t("wizard.untHint")}</p>
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
                  <p>{t("wizard.ieltsHint")}</p>
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
                  <p>{t("wizard.satHint")}</p>
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
                        {active && <CheckIcon size={12} />} {ld(city)}
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
                      <small>{t("wizard.grantHint")}</small>
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
                          <span>{b >= 5_000_000 ? t("wizard.budgetOver") : t("wizard.budgetUpTo", { amount: (b / 1_000_000).toFixed(1) })}</span>
                          {b === 2_500_000 && <small>{t("wizard.averageRate")}</small>}
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
                    <option value="Казахский / русский">{t("wizard.language.kzRu")}</option>
                    <option value="Английский">{t("wizard.language.en")}</option>
                    <option value="Неважно">{t("wizard.language.any")}</option>
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
                        {ld(f)}
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
                      <strong>{t("wizard.dormitory")}</strong>
                      <small>{t("wizard.dormitoryHint")}</small>
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
                      <strong>{t("wizard.military")}</strong>
                      <small>{t("wizard.militaryHint")}</small>
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
                <span>{locale === "en" ? `Selected fields (${selectedInterests.length})` : locale === "kk" ? `Таңдалған бағыттар (${selectedInterests.length})` : `Выбранные направления (${selectedInterests.length})`}</span>
                <strong>
                  {selectedInterests.map((k) => ld(interestLabels[k]?.title || k)).join(" • ")}
                </strong>
                <button type="button" onClick={() => setStep(1)}>
                  {t("wizard.edit")}
                </button>
              </article>
              <article>
                <span>{locale === "en" ? "UNT subjects" : locale === "kk" ? "ҰБТ пәндері" : "Предметы ЕНТ"}</span>
                <strong>{ld(profile.untCombination)}</strong>
                <button type="button" onClick={() => setStep(1)}>
                  {t("wizard.edit")}
                </button>
              </article>
              <article>
                <span>{locale === "en" ? "Academics (GPA 4.0)" : locale === "kk" ? "Академиялық көрсеткіштер (GPA 4.0)" : "Академика (GPA 4.0)"}</span>
                <strong>
                  {locale === "en" ? (profile.grade.length <= 2 ? `Grade ${profile.grade}` : ld(profile.grade)) : locale === "kk" ? (profile.grade.length <= 2 ? `${profile.grade}-сынып` : ld(profile.grade)) : (profile.grade.includes("класс") || profile.grade.length > 2 ? profile.grade : `${profile.grade} класс`)} • GPA {profile.gpa.toFixed(2)}/4.0 • {locale === "kk" ? "ҰБТ" : "UNT"} {profile.unt ?? (locale === "en" ? "not taken" : locale === "kk" ? "тапсырылмаған" : "не сдан")} {profile.sat ? `• SAT ${profile.sat}` : ""}
                </strong>
                <button type="button" onClick={() => setStep(2)}>
                  {t("wizard.edit")}
                </button>
              </article>
              <article>
                <span>{locale === "en" ? "Budget and cities" : locale === "kk" ? "Бюджет және қалалар" : "Финансы и города"}</span>
                <strong>
                  {profile.onlyGrant ? (locale === "en" ? "State grant only (₸0)" : locale === "kk" ? "Тек мемлекеттік грант (0 ₸)" : "Только госгрант (0 ₸)") : `${formatMoney(profile.budget)} ${locale === "en" ? "/ year" : locale === "kk" ? "/ жыл" : "/ год"}`} • {profile.preferredCities.map(ld).join(", ")}
                </strong>
                <button type="button" onClick={() => setStep(3)}>
                  {t("wizard.edit")}
                </button>
              </article>
              <article>
                <span>{locale === "en" ? "Language and facilities" : locale === "kk" ? "Оқу тілі және инфрақұрылым" : "Язык и инфраструктура"}</span>
                <strong>
                  {ld(profile.language)} • {profile.dormitoryNeeded ? (locale === "en" ? "Dormitory required" : locale === "kk" ? "Жатақхана қажет" : "С общежитием") : (locale === "en" ? "No dormitory required" : locale === "kk" ? "Жатақхана қажет емес" : "Без общежития")} {profile.militaryDepartment ? (locale === "en" ? "• Military department" : locale === "kk" ? "• Әскери кафедра" : "• Воен. кафедра") : ""}
                </strong>
                <button type="button" onClick={() => setStep(3)}>
                  {t("wizard.edit")}
                </button>
              </article>
              <article>
                <span>{locale === "en" ? "Graduation and intake" : locale === "kk" ? "Мектеп бітіру және қабылдау" : "Выпуск и приём"}</span>
                <strong>{locale === "en" ? `Summer ${profile.enrollmentYear}` : locale === "kk" ? `${profile.enrollmentYear} жылдың жазы` : `Лето ${profile.enrollmentYear} года`}</strong>
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
  const { t, locale, tr } = useI18n();
  const ld = (value: string) => localizeDisplay(value, locale);
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
            <strong>{tr("Маршрут пересчитан в реальном времени")}</strong>
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
            {locale === "en"
              ? `We matched your selected fields (${profileInterests.map((k) => ld(interestLabels[k]?.title || k)).join(", ")}), UNT subjects (${ld(profile.untCombination)}), GPA ${profile.gpa.toFixed(2)}/4.0, and budget with official university data.`
              : locale === "kk"
              ? `Таңдаған бағыттарыңды (${profileInterests.map((k) => ld(interestLabels[k]?.title || k)).join(", ")}), ҰБТ пәндерін (${ld(profile.untCombination)}), GPA ${profile.gpa.toFixed(2)}/4.0 және бюджетіңді ЖОО-лардың ресми деректерімен салыстырдық.`
              : `Мы сопоставили твои направления (${profileInterests.map((k) => interestLabels[k]?.title || k).join(", ")}), комбинацию предметов ЕНТ (${profile.untCombination}), GPA ${profile.gpa.toFixed(2)}/4.0 и финансовую траекторию с официальными данными вузов.`}
          </p>
        </div>

        <div className="readiness-card card-glass">
          <ScoreRing value={readiness} size="large" />
          <div>
            <span>{tr("Готовность профиля")}</span>
            <strong>{tr(readiness >= 80 ? "Сильная база поступления" : "Есть понятные точки роста")}</strong>
            <small>{tr("Полнота данных и соответствие критериям отбора.")}</small>
          </div>
        </div>
      </section>

      {/* Diagnosis Grid */}
      <section className="diagnosis-grid">
        <article className="card-glass">
          <div className="diagnosis-title good">
            <span>↑</span>
            <div>
              <small>{tr("Сильные сигналы")}</small>
              <strong>{strengths.length} {tr("преимущества")}</strong>
            </div>
          </div>
          <ul>
            {strengths.map((item) => (
              <li key={item}>
                <CheckIcon size={14} /> {ld(item)}
              </li>
            ))}
          </ul>
        </article>

        <article className="card-glass">
          <div className="diagnosis-title attention">
            <span>!</span>
            <div>
              <small>{tr("Точки внимания и риски")}</small>
              <strong>{constraints.length} {tr("фактора")}</strong>
            </div>
          </div>
          <ul>
            {constraints.map((item) => (
              <li key={item}>
                <b>—</b> {ld(item)}
              </li>
            ))}
          </ul>
        </article>

        <article className="goal-card card-glass">
          <small>{tr("Выбранные сферы")} ({profileInterests.length})</small>
          <strong>
            {profileInterests.map((k) => ld(interestLabels[k]?.title || k)).join(" • ")}
          </strong>
          <span>
            {profile.preferredCities.map(ld).join(" • ")} • {tr("Набор")} {profile.enrollmentYear}
          </span>
          <div className="goal-tags">
            <i>{profile.onlyGrant ? tr("Только грант (0 ₸)") : `${formatMoney(profile.budget)} / ${tr("год")}`}</i>
            <i>{ld(profile.language)}</i>
            <i>{ld(profile.careerFocus)}</i>
            {profile.dormitoryNeeded && <i>{tr("Общежитие")}</i>}
            {profile.militaryDepartment && <i>{tr("Воен. кафедра")}</i>}
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
                  <b>{tr(index === 0 ? "Лучшее совпадение" : index === 1 ? "Сильный вариант" : "Альтернатива")}</b>
                  <button
                    className={`bookmark-btn ${isBookmarked ? "active" : ""}`}
                    onClick={() => onToggleShortlist(match.program.id)}
                    title={isBookmarked ? tr("В шорт-листе") : tr("Добавить в шорт-лист")}
                  >
                    <BookmarkIcon filled={isBookmarked} size={16} />
                  </button>
                </div>

                <div className="match-main">
                  <span className="uni-mark">{match.program.shortName.slice(0, 2)}</span>
                  <div className="match-info">
                    <div className="match-meta">
                      <span>{ld(match.program.city)}</span>
                      <i>•</i>
                      <span>{ld(match.program.duration)}</span>
                      <i>•</i>
                      <span>{ld(match.program.language)}</span>
                    </div>
                    <h3>{match.program.university}</h3>
                    <p>
                      {match.program.program} <span>{match.program.code}</span>
                    </p>
                    <div className="tag-row">
                      {match.program.highlights.slice(0, 3).map((tag) => (
                        <span key={tag}>{ld(tag)}</span>
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
                        {ld(reason)}
                      </p>
                    ))}
                  </div>
                  <div className="fact-box">
                    <div>
                      <span>{t("results.cost")}</span>
                      <strong>{ld(match.program.tuitionLabel)}</strong>
                      <ConfidenceBadge confidence={match.program.tuitionConfidence} />
                    </div>
                    <div>
                      <span>{t("results.funding")}</span>
                      <strong className={match.breakdown.budget >= 70 ? "text-success" : "text-warning"}>
                        {profile.onlyGrant
                          ? match.program.scholarship
                            ? `✓ ${tr("Доступен грант МОН")}`
                            : tr("Только платно")
                          : match.breakdown.budget === 100
                          ? `✓ ${tr("В рамках бюджета")}`
                          : tr("Требуется грант / запас")}
                      </strong>
                    </div>
                  </div>
                </div>

                {match.gaps.length > 0 && (
                  <div className="gap-line">
                    <span>!</span>
                    <p>
                      <strong>{tr("Точка роста:")}</strong> {ld(match.gaps[0])}
                    </p>
                  </div>
                )}

                {/* Expanded Details Breakdown */}
                {isExpanded && (
                  <div className="match-details">
                    <div>
                      <h4>{tr("Детализация баллов")} ({match.score}/100)</h4>
                      {[
                        ["academic", "Академика"],
                        ["program", "Направление"],
                        ["budget", "Бюджет"],
                        ["language", "Язык"],
                        ["location", "Локация"],
                        ["preferences", "Приоритеты"],
                      ].map(([key, label]) => (
                        <div className="score-bar" key={key}>
                          <span>{tr(label)}</span>
                          <i>
                            <b style={{ width: `${(match.breakdown as any)[key]}%` }} />
                          </i>
                          <strong>{(match.breakdown as any)[key]}</strong>
                        </div>
                      ))}
                    </div>

                    <div className="requirements">
                      <h4>{tr("Требования и источники")}</h4>
                      <p>
                        <span>{tr("Профили ЕНТ")}</span>
                        <strong>{match.program.untCombinations.map(ld).join(", ")}</strong>
                      </p>
                      <p>
                        <span>{tr("Порог ЕНТ")}</span>
                        <strong>{match.program.untPaid ? `${match.program.untPaid}+` : tr("уточнить")}</strong>
                      </p>
                      <p>
                        <span>{tr("Ориентир на грант")}</span>
                        <strong>{match.program.untGrant ? `${match.program.untGrant}+` : ld("конкурсный отбор")}</strong>
                      </p>
                      <p>
                        <span>{tr("Тариф за")}</span>
                        <strong>{match.program.tuitionYear}</strong>
                      </p>
                      {match.program.dataNote && <small>{ld(match.program.dataNote)}</small>}
                      <a href={match.program.source.url} target="_blank" rel="noreferrer">
                        {tr("Официальный портал")} {match.program.shortName} <ExternalLinkIcon size={12} />
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
                      {tr("Карточка вуза & Отзывы")}
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
  const { t, tr, locale } = useI18n();
  const ld = (value: string) => localizeDisplay(value, locale);
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
    ["Профильные предметы ЕНТ", left.program.untCombinations.map(ld).join(" / "), right.program.untCombinations.map(ld).join(" / ")],
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
          <SparkIcon size={14} /> {tr("Инструмент осознанного выбора")}
        </div>
        <h1>{t("compare.title")}</h1>
        <p className="subtitle">
          {tr("Сопоставь требования, академическую нагрузку, финансовые затраты и перспективы трудоустройства.")}
        </p>
      </div>

      <section className="compare-shell card-glass">
        <div className="compare-head">
          <div className="compare-label">{tr("Критерий оценки")}</div>
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
            <span>{tr(label)}</span>
            <strong className={lVal.includes("✓") || lVal.includes("100") ? "positive" : ""}>{ld(lVal)}</strong>
            <strong className={rVal.includes("✓") || rVal.includes("100") ? "positive" : ""}>{ld(rVal)}</strong>
          </div>
        ))}

        <div className="compare-verdict">
          <span>{tr("Персональный вывод")}</span>
          <div>
            <strong>{tr(left.score >= right.score ? "Лидирует по общему мэтчу" : "Альтернативный вариант")}</strong>
            <p>{ld(left.reasons[0])}</p>
          </div>
          <div>
            <strong>
              {right.program.tuitionKzt < left.program.tuitionKzt
                ? tr("Выгоднее по стоимости обучения")
                : tr("Сильный альтернативный профиль")}
            </strong>
            <p>{ld(right.reasons[0])}</p>
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
            {locale === "en" ? `Set ${left.program.shortName} as target` : locale === "kk" ? `${left.program.shortName} ЖОО-сын мақсат ету` : `Выбрать ${left.program.shortName} целью`}
          </button>
          <button
            className="button outline"
            onClick={() => {
              onTarget(right.program.id);
              onRoadmap();
            }}
          >
            {locale === "en" ? `Set ${right.program.shortName} as target` : locale === "kk" ? `${right.program.shortName} ЖОО-сын мақсат ету` : `Выбрать ${right.program.shortName} целью`}
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
  const { t, tr, locale } = useI18n();
  const tasks = buildRoadmap(profile, match);
  const next = tasks.find((task) => !completed.includes(task.id));
  const completedCount = completed.filter((id) => tasks.some((task) => task.id === id)).length;
  const progress = Math.round((completedCount / Math.max(1, tasks.length)) * 100);

  const taskIcons: Record<RoadmapTask["category"], string> = {
    profile: "◎",
    exam: "✦",
    documents: "▤",
    application: "↗",
  };

  const localTask = (task: RoadmapTask) => {
    if (locale === "ru") return task;
    const en = locale === "en";
    const copy: Record<string, Partial<RoadmapTask>> = {
      shortlist: {
        title: en ? `Finalize your shortlist and verify code ${match.program.code}` : `${match.program.code} кодын тексеріп, таңдаулы тізімді бекіт`,
        description: en ? `Compare ${match.program.shortName} with 2–3 alternative universities in your shortlist.` : `${match.program.shortName} нұсқасын таңдаулы тізімдегі 2–3 балама ЖОО-мен салыстыр.`,
        reason: en ? "A clear shortlist defines priority subjects and exam dates." : "Нақты тізім дайындықтағы басым пәндер мен емтихан күндерін анықтайды.",
      },
      english: {
        title: en ? `Pass IELTS ${match.program.ielts ?? 5.5}+ or the ${match.program.shortName} internal exam` : `IELTS ${match.program.ielts ?? 5.5}+ немесе ${match.program.shortName} ішкі емтиханын тапсыру`,
        description: en ? "Confirm the required English level before enrollment." : "Оқуға қабылдануға дейін қажетті ағылшын деңгейін раста.",
        reason: en ? "A language certificate confirms readiness for English-taught courses." : "Тіл сертификаты ағылшын тіліндегі пәндерге дайын екеніңді растайды.",
      },
      unt: {
        title: en ? `Prepare for the UNT (${localizeDisplay(profile.untCombination, locale)})` : `ҰБТ-ға дайындалу (${localizeDisplay(profile.untCombination, locale)})`,
        description: en ? "Take regular practice tests and strengthen your core subjects." : "Тұрақты сынақ тесттерін тапсырып, бейіндік пәндерді күшейт.",
        reason: en ? "A competitive UNT score improves both admission and grant chances." : "Бәсекелі ҰБТ балы оқуға түсу және грант алу мүмкіндігін арттырады.",
      },
      documents: {
        title: en ? "Collect the Kazakhstan applicant document package" : "ҚР талапкерінің құжаттар пакетін жинау",
        description: en ? "Prepare your ID, certificate, UNT result, medical form, and vaccination card." : "Жеке куәлік, аттестат, ҰБТ сертификаты, медициналық анықтама және екпе картасын дайында.",
        reason: en ? "Electronic submission requires a complete scanned document package." : "Электронды тапсыру үшін сканерленген құжаттардың толық пакеті қажет.",
      },
      "verify-deadlines": {
        title: en ? "Apply for the Kazakhstan state-grant competition" : "ҚР мемлекеттік гранттар конкурсына өтінім беру",
        description: en ? "List up to four universities or educational programs in the grant competition." : "Гранттар конкурсына 4 ЖОО немесе білім беру бағдарламасын көрсет.",
        reason: en ? "This is the official national grant allocation competition." : "Бұл гранттарды бөлудің ресми республикалық конкурсы.",
      },
      apply: {
        title: en ? `Enrollment at ${match.program.shortName}` : `${match.program.shortName} университетіне қабылдану`,
        description: en ? "Sign the contract, submit originals, and arrange accommodation." : "Келісімшартқа қол қойып, құжаттардың түпнұсқасын тапсырып, жатақханаға орналас.",
        reason: en ? "This is the final stage before the academic year begins." : "Бұл оқу жылы басталар алдындағы соңғы кезең.",
      },
    };
    return { ...task, ...copy[task.id] };
  };

  return (
    <main className="dashboard roadmap-page container">
      <div className="page-title roadmap-title">
        <div>
          <div className="eyebrow-pill">
            <SparkIcon size={14} /> {t("roadmap.kicker")}
          </div>
          <h1>{t("roadmap.title", { university: match.program.shortName })}</h1>
          <p className="subtitle">
            {t("roadmap.intake", { program: match.program.program, year: profile.enrollmentYear })}
          </p>
        </div>

        <div className="route-progress card-glass">
          <ScoreRing value={progress} size="normal" showLabel={false} />
          <div>
            <strong>{t("roadmap.completed", { progress })}</strong>
            <span>{t("roadmap.steps", { completed: completedCount, total: tasks.length })}</span>
          </div>
        </div>
      </div>

      {next ? (
        <section className="next-action card-glass">
          <div className="next-icon">→</div>
          <div>
            <small>{t("roadmap.next")}</small>
            <h2>{localTask(next).title}</h2>
            <p>{localTask(next).description}</p>
            <span className="action-date">🗓 {localizeDisplay(next.dateLabel, locale)}</span>
          </div>
          <button className="button light" onClick={() => onToggle(next.id)}>
            <CheckIcon size={14} /> {t("roadmap.markComplete")}
          </button>
        </section>
      ) : (
        <section className="next-action complete card-glass">
          <div className="next-icon">
            <CheckIcon size={20} />
          </div>
          <div>
            <small>{tr("ПОЗДРАВЛЯЕМ! МАРШРУТ ПРОЙДЕН")}</small>
            <h2>{tr("Все запланированные шаги отмечены")}</h2>
            <p>{tr("Следи за приказами о зачислении и проверяй личный кабинет абитуриента")} {match.program.shortName}.</p>
          </div>
        </section>
      )}

      <section className="roadmap-layout">
        <div className="timeline card-glass">
          <div className="timeline-head">
            <div>
              <h2>{t("roadmap.timeline")}</h2>
              <p>{t("roadmap.timelineHint")}</p>
            </div>
            <div className="legend">
              <span>
                <i className="personal" /> {tr("Личная цель")}
              </span>
              <span>
                <i className="check" /> {tr("Официальная дата МОН РК")}
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
                        ? tr("Личная цель")
                        : task.dateType === "official"
                        ? tr("Официально")
                        : tr("Проверить")}{" "}
                      • {localizeDisplay(task.dateLabel, locale)}
                    </span>
                    <button
                      className={`task-check ${done ? "active" : ""}`}
                      onClick={() => onToggle(task.id)}
                    >
                      {done ? (
                        <>
                          <CheckIcon size={12} /> {tr("Выполнено")}
                        </>
                      ) : (
                        tr("Отметить")
                      )}
                    </button>
                  </div>

                  <h3>{localTask(task).title}</h3>
                  <p>{localTask(task).description}</p>
                  <details>
                    <summary>{tr("Почему это важно?")}</summary>
                    <p>{localTask(task).reason}</p>
                  </details>
                </div>
              </article>
            );
          })}
        </div>

        <aside className="route-sidebar">
          <div className="route-target card-glass">
            <span>{tr("ЦЕЛЕВОЙ УНИВЕРСИТЕТ")}</span>
            <span className="uni-mark large">{match.program.shortName.slice(0, 2)}</span>
            <strong>{match.program.university}</strong>
            <p>{match.program.program}</p>

            <div className="target-card-btn-group">
              <button className="button outline small full-width" onClick={onViewDetails}>
                {tr("Карточка программы & Отзывы")}
              </button>
              <button className="text-button" onClick={onChangeTarget}>
                {tr("Сменить целевой вуз")}
              </button>
            </div>
          </div>

          <div className="route-warning card-glass">
            <span>!</span>
            <div>
              <strong>{locale === "en" ? `${profile.enrollmentYear} intake dates are being confirmed` : locale === "kk" ? `${profile.enrollmentYear} қабылдау күндері нақтылануда` : `Даты набора ${profile.enrollmentYear} уточняются`}</strong>
              <p>
                {locale === "en" ? "We show estimated preparation dates. Always check the official admission calendar on the university website." : locale === "kk" ? "Біз дайындықтың болжамды мерзімдерін көрсетеміз. ЖОО сайтындағы ресми қабылдау күнтізбесін әрдайым тексер." : "Мы показываем ориентировочные сроки подготовки. Всегда сверяй официальный календарь приёма на сайте вуза."}
              </p>
            </div>
          </div>

          <div className="route-stats card-glass">
            <p>
              <span>{tr("Стоимость")}</span>
              <strong>{localizeDisplay(match.program.tuitionLabel, locale)}</strong>
            </p>
            <p>
              <span>{tr("Порог ЕНТ")}</span>
              <strong>{match.program.untPaid ? `${match.program.untPaid}+` : tr("уточнить")}</strong>
            </p>
            <p>
              <span>{tr("Язык")}</span>
              <strong>{tr(match.program.language)}</strong>
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}
