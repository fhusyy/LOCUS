"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore } from "react";
import { localeNames, normalizeLocale, type Locale } from "@/lib/locale";

type Variables = Record<string, string | number>;

const dictionaries: Record<Locale, Record<string, string>> = {
  ru: {
    "language.label": "Язык интерфейса",
    "nav.overview": "Обзор",
    "nav.recommendations": "Рекомендации",
    "nav.catalog": "Каталог",
    "nav.compare": "Сравнение",
    "nav.shortlist": "Шорт-лист",
    "nav.roadmap": "Маршрут",
    "nav.whatIf": "Что если?",
    "nav.diagnostics": "Диагностика",
    "nav.nextStep": "Следующий шаг",
    "nav.login": "Войти",
    "nav.logout": "Выйти",
    "nav.demo": "Демо-кабинет",
    "nav.choose": "Подобрать вуз",
    "nav.account": "Мой кабинет",
    "landing.user.score": "ЕНТ: {unt} • {grade} класс",
    "landing.user.dashboard": "📊 Мой личный кабинет",
    "landing.user.route": "🎯 Мой маршрут поступления",
    "landing.user.edit": "✏️ Изменить баллы / анкету",
    "landing.user.logout": "🚪 Выйти из аккаунта",
    "landing.hero.line1": "Твой путь к университету",
    "landing.hero.line2": "— в одном месте",
    "landing.hero.description": "Узнай, какие направления и университеты подходят именно тебе, сравни варианты и получи персональный план поступления.",
    "landing.hero.cta": "Построить мой маршрут →",
    "landing.flow.profile": "Профиль",
    "landing.flow.match": "Подбор",
    "landing.flow.compare": "Сравнение",
    "landing.flow.plan": "План",
    "landing.flow.next": "Следующий шаг",
    "wizard.step.about": "О тебе",
    "wizard.step.direction": "Направления & ЕНТ",
    "wizard.step.academic": "Академика (GPA 4.0)",
    "wizard.step.preferences": "Бюджет и критерии",
    "wizard.step.review": "Проверка",
    "wizard.back": "Назад",
    "wizard.continue": "Продолжить",
    "wizard.finish": "Найти мои программы",
    "wizard.counter": "Шаг {current} из {total}",
    "wizard.kicker.0": "Базовая информация",
    "wizard.kicker.1": "Специальности & ЕНТ",
    "wizard.kicker.2": "Академический профиль",
    "wizard.kicker.3": "Бюджет и критерии",
    "wizard.kicker.4": "Проверка данных",
    "wizard.heading.0": "Кто ты и когда планируешь поступать?",
    "wizard.heading.1": "Выбери до 3 направлений",
    "wizard.heading.2": "GPA и результаты экзаменов",
    "wizard.heading.3": "Где и на каких условиях хочешь учиться?",
    "wizard.heading.4": "Твой профиль сформирован!",
    "wizard.name": "Как тебя зовут?",
    "wizard.status": "Текущий класс / статус",
    "wizard.homeCity": "Родной город в Казахстане",
    "wizard.enrollmentYear": "Год поступления",
    "wizard.directions": "Профессиональные сферы и направления",
    "wizard.selected": "Выбрано: {current} из 3",
    "wizard.untCombination": "Профильная комбинация предметов ЕНТ",
    "wizard.subjects": "Любимые предметы в школе",
    "wizard.gpa": "Средний балл GPA",
    "wizard.unt": "Балл ЕНТ",
    "wizard.ielts": "Сертификат IELTS",
    "wizard.sat": "Тест SAT / ACT Reasoning",
    "wizard.cities": "В каких городах хочешь учиться?",
    "wizard.grantOnly": "Рассматриваю только государственный грант (0 ₸)",
    "wizard.budget": "Допустимый годовой бюджет на платное обучение",
    "wizard.studyLanguage": "Язык обучения",
    "wizard.career": "Карьерные амбиции",
    "wizard.infrastructure": "Дополнительные условия и инфраструктура",
    "wizard.edit": "Изменить",
    "wizard.build": "Построить персональный маршрут",
    "results.kicker": "Результаты мэтчинга и объективная диагностика",
    "results.title": "{name}вот твой персональный вектор поступления",
    "results.topKicker": "РЕКОМЕНДОВАННЫЙ ТОП ПРОГРАММ",
    "results.topTitle": "Лучшие университеты Казахстана для твоего выбора",
    "results.topDescription": "Диверсифицированная подборка на основе твоего профиля.",
    "results.aiButton": "AI-подбор по 106 вузам",
    "results.aiLoading": "AI анализирует каталог...",
    "results.aiTitle": "Персональная рекомендация UniFlow AI",
    "results.aiError": "Не удалось получить AI-рекомендацию",
    "results.edit": "Редактировать профиль",
    "results.compare": "Сравнить варианты",
    "results.whatIf": "Симулятор «Что если?»",
    "results.why": "Почему подходит твоему профилю",
    "results.cost": "Стоимость",
    "results.funding": "Финансирование",
    "results.details": "Подробнее о мэтче",
    "results.hideDetails": "Скрыть детали",
    "results.target": "Выбрать целью маршрута",
    "ai.ask": "Спросить Gemini AI",
    "ai.loading": "Gemini анализирует...",
    "ai.expertise": "AI-анализ на основе профиля и CSV-каталога",
    "ai.connectionError": "Ошибка соединения с AI-советником",
    "modal.close": "Закрыть",
    "modal.match": "Совместимость",
    "modal.tuition": "Стоимость обучения",
    "modal.requirements": "Чек-лист требований",
    "modal.officialSource": "Официальный источник",
    "whatIf.aiButton": "AI-анализ сценария",
    "whatIf.aiLoading": "AI анализирует изменения...",
    "dashboard.kicker": "Личный кабинет абитуриента",
    "dashboard.hello": "Привет, {name}!",
    "dashboard.recommendations": "Рекомендованные программы для твоего профиля",
    "explore.kicker": "Каталог образовательных программ Казахстана",
    "explore.title": "Аккредитованные программы университетов Казахстана",
    "explore.description": "Фильтруй программы по предметам ЕНТ, городам, стоимости и языку обучения.",
    "shortlist.kicker": "Мои университеты и контроль подачи",
    "shortlist.title": "Шорт-лист и статус подачи документов",
    "shortlist.description": "Собери сбалансированный портфель: целевые, амбициозные и надёжные варианты.",
    "whatIf.kicker": "Симулятор сценариев поступления",
    "whatIf.title": "Что изменится, если подтянуть ЕНТ, GPA или расширить бюджет?",
    "whatIf.description": "Меняй параметры и смотри, какие университеты и программы становятся доступнее.",
    "compare.title": "Сравнение двух программ Казахстана",
    "roadmap.title": "Твой путь поступления в {university}",
  },
  kk: {
    "language.label": "Интерфейс тілі",
    "nav.overview": "Шолу",
    "nav.recommendations": "Ұсынымдар",
    "nav.catalog": "Каталог",
    "nav.compare": "Салыстыру",
    "nav.shortlist": "Таңдаулы тізім",
    "nav.roadmap": "Маршрут",
    "nav.whatIf": "Егер ше?",
    "nav.diagnostics": "Диагностика",
    "nav.nextStep": "Келесі қадам",
    "nav.login": "Кіру",
    "nav.logout": "Шығу",
    "nav.demo": "Демо-кабинет",
    "nav.choose": "ЖОО таңдау",
    "nav.account": "Менің кабинетім",
    "landing.user.score": "ҰБТ: {unt} • {grade}-сынып",
    "landing.user.dashboard": "📊 Менің жеке кабинетім",
    "landing.user.route": "🎯 Менің түсу маршрутым",
    "landing.user.edit": "✏️ Балдарды / сауалнаманы өзгерту",
    "landing.user.logout": "🚪 Аккаунттан шығу",
    "landing.hero.line1": "Университетке апарар жолың",
    "landing.hero.line2": "— бір жерде",
    "landing.hero.description": "Саған сәйкес бағыттар мен университеттерді анықта, нұсқаларды салыстыр және жеке түсу жоспарын ал.",
    "landing.hero.cta": "Маршрутымды құру →",
    "landing.flow.profile": "Профиль",
    "landing.flow.match": "Іріктеу",
    "landing.flow.compare": "Салыстыру",
    "landing.flow.plan": "Жоспар",
    "landing.flow.next": "Келесі қадам",
    "wizard.step.about": "Өзің туралы",
    "wizard.step.direction": "Бағыттар және ҰБТ",
    "wizard.step.academic": "Академиялық көрсеткіш (GPA 4.0)",
    "wizard.step.preferences": "Бюджет және талаптар",
    "wizard.step.review": "Тексеру",
    "wizard.back": "Артқа",
    "wizard.continue": "Жалғастыру",
    "wizard.finish": "Бағдарламаларды табу",
    "wizard.counter": "{total} қадамның {current}-қадамы",
    "wizard.kicker.0": "Негізгі ақпарат",
    "wizard.kicker.1": "Мамандықтар және ҰБТ",
    "wizard.kicker.2": "Академиялық профиль",
    "wizard.kicker.3": "Бюджет және талаптар",
    "wizard.kicker.4": "Деректерді тексеру",
    "wizard.heading.0": "Сен кімсің және қашан оқуға түсуді жоспарлайсың?",
    "wizard.heading.1": "3 бағытқа дейін таңда",
    "wizard.heading.2": "GPA және емтихан нәтижелері",
    "wizard.heading.3": "Қайда және қандай шарттармен оқығың келеді?",
    "wizard.heading.4": "Профилің дайын!",
    "wizard.name": "Атың кім?",
    "wizard.status": "Қазіргі сынып / мәртебе",
    "wizard.homeCity": "Қазақстандағы туған қалаң",
    "wizard.enrollmentYear": "Оқуға түсу жылы",
    "wizard.directions": "Кәсіби салалар мен бағыттар",
    "wizard.selected": "Таңдалды: 3 ішінен {current}",
    "wizard.untCombination": "ҰБТ бейіндік пәндер комбинациясы",
    "wizard.subjects": "Мектептегі сүйікті пәндер",
    "wizard.gpa": "Орташа GPA балы",
    "wizard.unt": "ҰБТ балы",
    "wizard.ielts": "IELTS сертификаты",
    "wizard.sat": "SAT / ACT Reasoning тесті",
    "wizard.cities": "Қай қалаларда оқығың келеді?",
    "wizard.grantOnly": "Тек мемлекеттік грантты қарастырамын (0 ₸)",
    "wizard.budget": "Ақылы оқудың жылдық бюджеті",
    "wizard.studyLanguage": "Оқу тілі",
    "wizard.career": "Мансаптық мақсаттар",
    "wizard.infrastructure": "Қосымша шарттар мен инфрақұрылым",
    "wizard.edit": "Өзгерту",
    "wizard.build": "Жеке маршрутты құру",
    "results.kicker": "Сәйкестік нәтижелері және объективті диагностика",
    "results.title": "{name}сенің жеке түсу бағытың",
    "results.topKicker": "ҰСЫНЫЛҒАН БАҒДАРЛАМАЛАР",
    "results.topTitle": "Сенің таңдауыңа сай Қазақстан университеттері",
    "results.topDescription": "Профиліңе негізделген әртараптандырылған іріктеу.",
    "results.aiButton": "106 ЖОО бойынша AI-іріктеу",
    "results.aiLoading": "AI каталогты талдап жатыр...",
    "results.aiTitle": "UniFlow AI жеке ұсынымы",
    "results.aiError": "AI ұсынымын алу мүмкін болмады",
    "results.edit": "Профильді өзгерту",
    "results.compare": "Нұсқаларды салыстыру",
    "results.whatIf": "«Егер ше?» симуляторы",
    "results.why": "Неліктен профиліңе сәйкес",
    "results.cost": "Оқу ақысы",
    "results.funding": "Қаржыландыру",
    "results.details": "Сәйкестік туралы толығырақ",
    "results.hideDetails": "Мәліметті жасыру",
    "results.target": "Маршрут мақсаты ету",
    "ai.ask": "Gemini AI-дан сұрау",
    "ai.loading": "Gemini талдап жатыр...",
    "ai.expertise": "Профиль мен CSV-каталогқа негізделген AI-талдау",
    "ai.connectionError": "AI-кеңесшімен байланыс қатесі",
    "modal.close": "Жабу",
    "modal.match": "Сәйкестік",
    "modal.tuition": "Оқу ақысы",
    "modal.requirements": "Талаптар тізімі",
    "modal.officialSource": "Ресми дереккөз",
    "whatIf.aiButton": "Сценарийді AI-талдау",
    "whatIf.aiLoading": "AI өзгерістерді талдап жатыр...",
    "dashboard.kicker": "Талапкердің жеке кабинеті",
    "dashboard.hello": "Сәлем, {name}!",
    "dashboard.recommendations": "Профиліңе ұсынылған бағдарламалар",
    "explore.kicker": "Қазақстанның білім беру бағдарламалары каталогы",
    "explore.title": "Қазақстан университеттерінің аккредиттелген бағдарламалары",
    "explore.description": "Бағдарламаларды ҰБТ пәндері, қала, баға және оқу тілі бойынша сүзгіле.",
    "shortlist.kicker": "Менің университеттерім және өтінімді бақылау",
    "shortlist.title": "Таңдаулы тізім және құжат тапсыру мәртебесі",
    "shortlist.description": "Мақсатты, амбициялық және сенімді нұсқалардан теңгерімді портфель құр.",
    "whatIf.kicker": "Оқуға түсу сценарийлерінің симуляторы",
    "whatIf.title": "ҰБТ, GPA немесе бюджет өзгерсе не болады?",
    "whatIf.description": "Параметрлерді өзгертіп, қай университеттер мен бағдарламалар қолжетімді болатынын көр.",
    "compare.title": "Қазақстандағы екі бағдарламаны салыстыру",
    "roadmap.title": "{university} университетіне түсу жолың",
  },
  en: {
    "language.label": "Interface language",
    "nav.overview": "Overview",
    "nav.recommendations": "Recommendations",
    "nav.catalog": "Catalog",
    "nav.compare": "Compare",
    "nav.shortlist": "Shortlist",
    "nav.roadmap": "Roadmap",
    "nav.whatIf": "What if?",
    "nav.diagnostics": "Diagnostics",
    "nav.nextStep": "Next step",
    "nav.login": "Sign in",
    "nav.logout": "Sign out",
    "nav.demo": "Demo account",
    "nav.choose": "Find a university",
    "nav.account": "My account",
    "landing.user.score": "UNT: {unt} • grade {grade}",
    "landing.user.dashboard": "📊 My dashboard",
    "landing.user.route": "🎯 My admission route",
    "landing.user.edit": "✏️ Edit scores / profile",
    "landing.user.logout": "🚪 Sign out",
    "landing.hero.line1": "Your path to university",
    "landing.hero.line2": "— all in one place",
    "landing.hero.description": "Discover the fields and universities that fit you, compare options, and get a personal admission plan.",
    "landing.hero.cta": "Build my route →",
    "landing.flow.profile": "Profile",
    "landing.flow.match": "Match",
    "landing.flow.compare": "Compare",
    "landing.flow.plan": "Plan",
    "landing.flow.next": "Next step",
    "wizard.step.about": "About you",
    "wizard.step.direction": "Fields & UNT",
    "wizard.step.academic": "Academics (GPA 4.0)",
    "wizard.step.preferences": "Budget & criteria",
    "wizard.step.review": "Review",
    "wizard.back": "Back",
    "wizard.continue": "Continue",
    "wizard.finish": "Find my programs",
    "wizard.counter": "Step {current} of {total}",
    "wizard.kicker.0": "Basic information",
    "wizard.kicker.1": "Fields & UNT",
    "wizard.kicker.2": "Academic profile",
    "wizard.kicker.3": "Budget & criteria",
    "wizard.kicker.4": "Review details",
    "wizard.heading.0": "Who are you and when do you plan to apply?",
    "wizard.heading.1": "Choose up to 3 fields",
    "wizard.heading.2": "GPA and exam results",
    "wizard.heading.3": "Where and under what conditions do you want to study?",
    "wizard.heading.4": "Your profile is ready!",
    "wizard.name": "What is your name?",
    "wizard.status": "Current grade / status",
    "wizard.homeCity": "Home city in Kazakhstan",
    "wizard.enrollmentYear": "Enrollment year",
    "wizard.directions": "Professional fields and majors",
    "wizard.selected": "Selected: {current} of 3",
    "wizard.untCombination": "UNT subject combination",
    "wizard.subjects": "Favorite school subjects",
    "wizard.gpa": "Average GPA",
    "wizard.unt": "UNT score",
    "wizard.ielts": "IELTS certificate",
    "wizard.sat": "SAT / ACT Reasoning test",
    "wizard.cities": "Which cities do you want to study in?",
    "wizard.grantOnly": "I am considering only a state grant (0 ₸)",
    "wizard.budget": "Annual paid-tuition budget",
    "wizard.studyLanguage": "Language of instruction",
    "wizard.career": "Career goals",
    "wizard.infrastructure": "Additional conditions and infrastructure",
    "wizard.edit": "Edit",
    "wizard.build": "Build personal route",
    "results.kicker": "Matching results and objective diagnostics",
    "results.title": "{name}here is your personal admission direction",
    "results.topKicker": "RECOMMENDED PROGRAMS",
    "results.topTitle": "Kazakhstan universities that fit your choices",
    "results.topDescription": "A diversified shortlist based on your profile.",
    "results.aiButton": "AI match across 106 universities",
    "results.aiLoading": "AI is analyzing the catalog...",
    "results.aiTitle": "Personal UniFlow AI recommendation",
    "results.aiError": "Could not get an AI recommendation",
    "results.edit": "Edit profile",
    "results.compare": "Compare options",
    "results.whatIf": "What-if simulator",
    "results.why": "Why it fits your profile",
    "results.cost": "Tuition",
    "results.funding": "Funding",
    "results.details": "Match details",
    "results.hideDetails": "Hide details",
    "results.target": "Set as roadmap target",
    "ai.ask": "Ask Gemini AI",
    "ai.loading": "Gemini is analyzing...",
    "ai.expertise": "AI analysis grounded in your profile and the CSV catalog",
    "ai.connectionError": "Could not connect to the AI advisor",
    "modal.close": "Close",
    "modal.match": "Match",
    "modal.tuition": "Tuition",
    "modal.requirements": "Requirements checklist",
    "modal.officialSource": "Official source",
    "whatIf.aiButton": "AI scenario analysis",
    "whatIf.aiLoading": "AI is analyzing the changes...",
    "dashboard.kicker": "Applicant dashboard",
    "dashboard.hello": "Hello, {name}!",
    "dashboard.recommendations": "Programs recommended for your profile",
    "explore.kicker": "Kazakhstan degree catalog",
    "explore.title": "Accredited programs at Kazakhstan universities",
    "explore.description": "Filter programs by UNT subjects, city, tuition, and language of instruction.",
    "shortlist.kicker": "My universities and application tracking",
    "shortlist.title": "Shortlist and application status",
    "shortlist.description": "Build a balanced portfolio of target, reach, and safety options.",
    "whatIf.kicker": "Admission scenario simulator",
    "whatIf.title": "What changes if you improve UNT, GPA, or your budget?",
    "whatIf.description": "Adjust the parameters to see which universities and programs become more accessible.",
    "compare.title": "Compare two Kazakhstan programs",
    "roadmap.title": "Your admission path to {university}",
  },
};

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, variables?: Variables) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);
const storageKey = "uniflow-locale";
const localeEvent = "uniflow-locale-change";

function subscribeLocale(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(localeEvent, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(localeEvent, callback);
  };
}

const readLocale = () => normalizeLocale(window.localStorage.getItem(storageKey));
const readServerLocale = (): Locale => "ru";

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const locale = useSyncExternalStore(subscribeLocale, readLocale, readServerLocale);

  const setLocale = useCallback((nextLocale: Locale) => {
    window.localStorage.setItem(storageKey, nextLocale);
    window.dispatchEvent(new Event(localeEvent));
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale === "kk" ? "kk" : locale;
  }, [locale]);

  const value = useMemo<I18nContextValue>(() => ({
    locale,
    setLocale,
    t: (key, variables = {}) => {
      let message = dictionaries[locale][key] ?? dictionaries.ru[key] ?? key;
      for (const [name, replacement] of Object.entries(variables)) {
        message = message.replaceAll(`{${name}}`, String(replacement));
      }
      return message;
    },
  }), [locale, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used within I18nProvider");
  return context;
}

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();
  const shortNames: Record<Locale, string> = { ru: "RU", kk: "ҚАЗ", en: "EN" };

  return (
    <div className="locale-switcher" role="group" aria-label={t("language.label")}>
      {(["ru", "kk", "en"] as Locale[]).map((item) => (
        <button
          type="button"
          key={item}
          className={locale === item ? "active" : ""}
          onClick={() => setLocale(item)}
          title={localeNames[item]}
          aria-pressed={locale === item}
        >
          {shortNames[item]}
        </button>
      ))}
    </div>
  );
}
