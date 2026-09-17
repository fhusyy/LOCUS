"use client";

import { useEffect, useMemo, useState } from "react";
import { buildRoadmap, formatMoney, matchPrograms, profileReadiness } from "@/lib/matching";
import type { City, Interest, Match, RoadmapTask, StudentProfile } from "@/lib/types";

type Screen = "landing" | "onboarding" | "results" | "compare" | "roadmap";

const interestLabels: Record<Interest, { title: string; description: string; icon: string }> = {
  "computer-science": { title: "Computer Science", description: "Алгоритмы, системы и широкий IT-фундамент", icon: "⌘" },
  "data-science": { title: "Data Science & AI", description: "Данные, машинное обучение и математика", icon: "◫" },
  "software-engineering": { title: "Software Engineering", description: "Разработка продуктов и командная инженерия", icon: "</>" },
  cybersecurity: { title: "Cybersecurity", description: "Защита систем, сетей и информации", icon: "◇" },
};

const defaultProfile: StudentProfile = {
  name: "",
  grade: "11",
  homeCity: "Шымкент",
  enrollmentYear: 2027,
  interest: "data-science",
  favoriteSubjects: ["Математика", "Информатика"],
  gpa: 4.4,
  unt: 108,
  ielts: 6,
  preferredCities: ["Астана", "Алматы"],
  budget: 2_500_000,
  scholarshipImportant: true,
  language: "Английский",
  careerFocus: "Практика",
};

const wizardSteps = ["О тебе", "Направление", "Академика", "Предпочтения", "Проверка"];
const subjects = ["Математика", "Информатика", "Физика", "Английский язык", "Экономика"];
const cities: City[] = ["Астана", "Алматы", "Каскелен", "Любой город"];

type SavedState = { profile?: StudentProfile; targetId?: string; completed?: string[] };

function readSavedState(): SavedState {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem("uniflow-state") ?? "{}") as SavedState;
  } catch {
    return {};
  }
}

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

function Chevron({ direction = "right" }: { direction?: "right" | "left" | "down" }) {
  const rotate = direction === "left" ? "180" : direction === "down" ? "90" : "0";
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true" style={{ transform: `rotate(${rotate}deg)` }}>
      <path d="M6.75 3.75 12 9l-5.25 5.25" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="m3.25 8.25 3 3 6.5-6.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M9 1.75c.35 3.9 2.35 5.9 6.25 6.25C11.35 8.35 9.35 10.35 9 14.25 8.65 10.35 6.65 8.35 2.75 8 6.65 7.65 8.65 5.65 9 1.75Z" stroke="currentColor" strokeWidth="1.4" />
      <path d="M14.25 12.25c.15 1.35.9 2.1 2.25 2.25-1.35.15-2.1.9-2.25 2.25-.15-1.35-.9-2.1-2.25-2.25 1.35-.15 2.1-.9 2.25-2.25Z" fill="currentColor" />
    </svg>
  );
}

function Logo() {
  return (
    <div className="brand" aria-label="Uniflow">
      <span className="brand-mark"><span /></span>
      <span>uniflow</span>
    </div>
  );
}

function AppHeader({ screen, onNavigate }: { screen: Screen; onNavigate: (screen: Screen) => void }) {
  const inProduct = screen !== "landing" && screen !== "onboarding";
  return (
    <header className="topbar">
      <button className="logo-button" onClick={() => onNavigate("landing")}><Logo /></button>
      {inProduct ? (
        <nav className="product-nav" aria-label="Разделы маршрута">
          <button className={screen === "results" ? "active" : ""} onClick={() => onNavigate("results")}>Рекомендации</button>
          <button className={screen === "compare" ? "active" : ""} onClick={() => onNavigate("compare")}>Сравнение</button>
          <button className={screen === "roadmap" ? "active" : ""} onClick={() => onNavigate("roadmap")}>Маршрут</button>
        </nav>
      ) : <span className="header-caption">Персональный навигатор поступления</span>}
      <div className="header-meta">
        <span className="status-dot" />
        Данные сохранены
      </div>
    </header>
  );
}

function Landing({ onStart, onDemo }: { onStart: () => void; onDemo: () => void }) {
  return (
    <main className="landing">
      <section className="hero container">
        <div className="hero-copy">
          <div className="eyebrow"><SparkIcon /> Не список вузов. Твой маршрут.</div>
          <h1>Поступление становится <em>понятным.</em></h1>
          <p className="hero-lead">Расскажи о себе — Uniflow подберёт программы в Казахстане, объяснит каждую рекомендацию и соберёт план до подачи заявки.</p>
          <div className="hero-actions">
            <button className="button primary large" onClick={onStart}>Построить мой маршрут <Chevron /></button>
            <button className="button ghost large" onClick={onDemo}>Посмотреть демо</button>
          </div>
          <div className="trust-row">
            <span><CheckIcon /> Без регистрации</span>
            <span><CheckIcon /> 4 минуты</span>
            <span><CheckIcon /> Официальные источники</span>
          </div>
        </div>
        <div className="hero-visual" aria-label="Пример персонального маршрута">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="floating-note note-one"><span>01</span> Профиль</div>
          <div className="floating-note note-two"><span>03</span> План действий</div>
          <div className="match-preview">
            <div className="preview-top">
              <span className="mini-logo">A</span>
              <div><small>Лучшее совпадение</small><strong>Astana IT University</strong></div>
              <span className="score-orb">87</span>
            </div>
            <div className="preview-program">Big Data Analysis <span>6B06103</span></div>
            <div className="preview-reasons">
              <span><i className="ok"><CheckIcon /></i> Точно по интересу</span>
              <span><i className="ok"><CheckIcon /></i> В рамках бюджета</span>
              <span><i className="warn">!</i> Усилить результат ЕНТ</span>
            </div>
            <div className="preview-action"><span>Следующий шаг</span><strong>Составить план подготовки к ЕНТ</strong><Chevron /></div>
          </div>
        </div>
      </section>
      <section className="how-it-works">
        <div className="container">
          <p className="section-kicker">ОТ НЕОПРЕДЕЛЁННОСТИ — К ДЕЙСТВИЮ</p>
          <div className="steps-grid">
            <article><span>01</span><h3>Расскажи о себе</h3><p>Цель, оценки, экзамены, бюджет и предпочтения.</p></article>
            <article><span>02</span><h3>Пойми свой выбор</h3><p>Сравни программы и увидь причины каждого мэтча.</p></article>
            <article><span>03</span><h3>Двигайся по плану</h3><p>Получай следующий шаг и отмечай прогресс.</p></article>
          </div>
        </div>
      </section>
    </main>
  );
}

function WizardProgress({ current }: { current: number }) {
  return (
    <div className="wizard-progress" aria-label={`Шаг ${current + 1} из ${wizardSteps.length}`}>
      {wizardSteps.map((step, index) => (
        <div className={`wizard-progress-item ${index < current ? "done" : ""} ${index === current ? "active" : ""}`} key={step}>
          <span>{index < current ? <CheckIcon /> : index + 1}</span>
          <b>{step}</b>
          {index < wizardSteps.length - 1 && <i />}
        </div>
      ))}
    </div>
  );
}

type WizardProps = {
  profile: StudentProfile;
  setProfile: (profile: StudentProfile) => void;
  initialStep?: number;
  onCancel: () => void;
  onComplete: () => void;
};

function Onboarding({ profile, setProfile, initialStep = 0, onCancel, onComplete }: WizardProps) {
  const [step, setStep] = useState(initialStep);
  const patch = (values: Partial<StudentProfile>) => setProfile({ ...profile, ...values });
  const next = () => step < 4 ? setStep(step + 1) : onComplete();
  const back = () => step > 0 ? setStep(step - 1) : onCancel();
  const canContinue = step !== 0 || profile.homeCity.trim().length > 1;

  return (
    <main className="onboarding container">
      <WizardProgress current={step} />
      <div className="wizard-shell">
        <aside className="wizard-aside">
          <div className="aside-number">0{step + 1}</div>
          <p>{step === 0 ? "Начнём с основы" : step === 1 ? "Найдём твой вектор" : step === 2 ? "Оценим готовность" : step === 3 ? "Учтём ограничения" : "Всё верно?"}</p>
          <h2>{step === 0 ? "Кто ты и когда поступаешь?" : step === 1 ? "Что тебе действительно интересно?" : step === 2 ? "Что уже есть в твоём профиле?" : step === 3 ? "Какая учёба подойдёт тебе?" : "Твой профиль готов"}</h2>
          <div className="aside-tip"><SparkIcon /><span>{step === 2 ? "Нет результата экзамена? Оставь поле пустым — добавим подготовку в план." : "Ответы можно изменить позже. Результаты пересчитаются автоматически."}</span></div>
        </aside>
        <section className="wizard-card">
          {step === 0 && (
            <div className="form-stack">
              <div className="question-block">
                <label htmlFor="name">Как тебя зовут? <small>необязательно</small></label>
                <input id="name" className="text-input" placeholder="Например, Алия" value={profile.name} onChange={(event) => patch({ name: event.target.value })} />
              </div>
              <div className="question-block"><label>Текущий класс</label><div className="segmented three">{(["10", "11", "Выпускник"] as const).map((value) => <button className={profile.grade === value ? "selected" : ""} key={value} onClick={() => patch({ grade: value })}>{value === "Выпускник" ? value : `${value} класс`}</button>)}</div></div>
              <div className="form-row">
                <div className="question-block"><label htmlFor="city">Город проживания</label><input id="city" className="text-input" value={profile.homeCity} onChange={(event) => patch({ homeCity: event.target.value })} /></div>
                <div className="question-block"><label htmlFor="year">Год поступления</label><select id="year" className="text-input" value={profile.enrollmentYear} onChange={(event) => patch({ enrollmentYear: Number(event.target.value) as 2027 | 2028 })}><option value={2027}>2027</option><option value={2028}>2028</option></select></div>
              </div>
            </div>
          )}
          {step === 1 && (
            <div className="form-stack">
              <div className="question-block"><label>Выбери основное направление</label><p className="field-hint">Мы покажем близкие программы, но приоритет отдаём этому выбору.</p><div className="interest-grid">{Object.entries(interestLabels).map(([key, item]) => <button key={key} className={`interest-card ${profile.interest === key ? "selected" : ""}`} onClick={() => patch({ interest: key as Interest })}><span className="interest-icon">{item.icon}</span><span><strong>{item.title}</strong><small>{item.description}</small></span><i>{profile.interest === key && <CheckIcon />}</i></button>)}</div></div>
              <div className="question-block"><label>Сильные предметы <small>до 3</small></label><div className="chip-list">{subjects.map((subject) => { const active = profile.favoriteSubjects.includes(subject); return <button className={active ? "chip active" : "chip"} key={subject} onClick={() => patch({ favoriteSubjects: active ? profile.favoriteSubjects.filter((item) => item !== subject) : profile.favoriteSubjects.length < 3 ? [...profile.favoriteSubjects, subject] : profile.favoriteSubjects })}>{active && <CheckIcon />}{subject}</button>; })}</div></div>
            </div>
          )}
          {step === 2 && (
            <div className="form-stack">
              <div className="metric-input"><div><label htmlFor="gpa">Средний балл аттестата</label><p>По 5-балльной шкале</p></div><div className="number-field"><input id="gpa" type="number" min="3" max="5" step="0.1" value={profile.gpa} onChange={(event) => patch({ gpa: Number(event.target.value) })} /><span>/ 5.0</span></div></div>
              <div className="metric-input"><div><label htmlFor="unt">Пробный или итоговый ЕНТ</label><p>Оставь пустым, если ещё не сдавал</p></div><div className="number-field"><input id="unt" type="number" min="0" max="140" placeholder="—" value={profile.unt ?? ""} onChange={(event) => patch({ unt: event.target.value ? Number(event.target.value) : undefined })} /><span>/ 140</span></div></div>
              <div className="metric-input"><div><label htmlFor="ielts">IELTS</label><p>Можно заменить внутренним тестом в части вузов</p></div><div className="number-field"><input id="ielts" type="number" min="0" max="9" step="0.5" placeholder="—" value={profile.ielts ?? ""} onChange={(event) => patch({ ielts: event.target.value ? Number(event.target.value) : undefined })} /><span>/ 9.0</span></div></div>
              <div className="info-strip"><span>i</span><p>Это не оценка шанса поступления. Баллы нужны, чтобы найти соответствия требованиям и пробелы в подготовке.</p></div>
            </div>
          )}
          {step === 3 && (
            <div className="form-stack compact">
              <div className="question-block"><label>Где хочешь учиться?</label><div className="chip-list">{cities.map((city) => { const active = profile.preferredCities.includes(city); return <button className={active ? "chip active" : "chip"} key={city} onClick={() => patch({ preferredCities: city === "Любой город" ? [city] : active ? profile.preferredCities.filter((item) => item !== city) : [...profile.preferredCities.filter((item) => item !== "Любой город"), city] })}>{active && <CheckIcon />}{city}</button>; })}</div></div>
              <div className="question-block"><label>Бюджет на обучение в год</label><div className="budget-grid">{[1_500_000, 2_000_000, 2_500_000, 4_000_000, 8_000_000].map((budget) => <button className={profile.budget === budget ? "budget-option selected" : "budget-option"} key={budget} onClick={() => patch({ budget })}><span>{budget === 8_000_000 ? "до 8 млн ₸" : `до ${budget / 1_000_000} млн ₸`}</span>{budget === 2_500_000 && <small>Популярный</small>}</button>)}</div></div>
              <div className="form-row"><div className="question-block"><label htmlFor="language">Язык обучения</label><select id="language" className="text-input" value={profile.language} onChange={(event) => patch({ language: event.target.value as StudentProfile["language"] })}><option>Английский</option><option>Русский / казахский</option><option>Неважно</option></select></div><div className="question-block"><label htmlFor="focus">Что важнее?</label><select id="focus" className="text-input" value={profile.careerFocus} onChange={(event) => patch({ careerFocus: event.target.value as StudentProfile["careerFocus"] })}><option>Практика</option><option>Исследования</option><option>Стартапы</option><option>Неважно</option></select></div></div>
              <label className="toggle-row"><span><strong>Грант особенно важен</strong><small>Учтём грантовую траекторию и разрыв по баллам</small></span><input type="checkbox" checked={profile.scholarshipImportant} onChange={(event) => patch({ scholarshipImportant: event.target.checked })} /><i /></label>
            </div>
          )}
          {step === 4 && <ProfileSummary profile={profile} onEdit={setStep} />}
          <div className="wizard-footer"><button className="button subtle" onClick={back}><Chevron direction="left" /> Назад</button><span>Шаг {step + 1} из 5</span><button className="button primary" disabled={!canContinue} onClick={next}>{step === 4 ? <><SparkIcon /> Найти мои программы</> : <>Продолжить <Chevron /></>}</button></div>
        </section>
      </div>
    </main>
  );
}

function ProfileSummary({ profile, onEdit }: { profile: StudentProfile; onEdit: (step: number) => void }) {
  const blocks = [
    { label: "Цель", value: interestLabels[profile.interest].title, step: 1 },
    { label: "Профиль", value: `${profile.grade} класс · ${profile.gpa}/5 · ЕНТ ${profile.unt ?? "не указан"}`, step: 2 },
    { label: "Английский", value: profile.ielts ? `IELTS ${profile.ielts}` : "Экзамен не сдан", step: 2 },
    { label: "Города", value: profile.preferredCities.join(", "), step: 3 },
    { label: "Бюджет", value: `${formatMoney(profile.budget)} / год`, step: 3 },
    { label: "Старт", value: `Осень ${profile.enrollmentYear}`, step: 0 },
  ];
  return <div className="summary-grid">{blocks.map((block) => <article key={block.label}><span>{block.label}</span><strong>{block.value}</strong><button onClick={() => onEdit(block.step)}>Изменить</button></article>)}</div>;
}

function ProductProgress({ active }: { active: "results" | "compare" | "roadmap" }) {
  const order = ["Профиль", "Диагностика", "Рекомендации", "Сравнение", "Маршрут"];
  const current = active === "results" ? 2 : active === "compare" ? 3 : 4;
  return <div className="product-progress">{order.map((item, index) => <div key={item} className={index < current ? "done" : index === current ? "active" : ""}><span>{index < current ? <CheckIcon /> : index + 1}</span><b>{item}</b>{index < order.length - 1 && <i />}</div>)}</div>;
}

function DashboardHeader({ active, onEdit }: { active: "results" | "compare" | "roadmap"; onEdit: () => void }) {
  return <div className="dashboard-head"><ProductProgress active={active} /><button className="edit-profile" onClick={onEdit}><span>✎</span> Изменить профиль</button></div>;
}

function ScoreRing({ value, size = "normal" }: { value: number; size?: "small" | "normal" | "large" }) {
  return <div className={`score-ring ${size}`} style={{ "--score": `${value * 3.6}deg` } as React.CSSProperties}><div><strong>{value}</strong><small>/100</small></div></div>;
}

function ConfidenceBadge({ confidence }: { confidence: Match["program"]["tuitionConfidence"] }) {
  const content = confidence === "verified" ? ["verified", "Проверено"] : confidence === "previous-year" ? ["previous", "Прошлый год"] : ["demo", "Демо-оценка"];
  return <span className={`confidence ${content[0]}`}><i />{content[1]}</span>;
}

function Results({ profile, matches, notice, onEdit, onCompare, onRoadmap, onTarget }: { profile: StudentProfile; matches: Match[]; notice: string; onEdit: () => void; onCompare: () => void; onRoadmap: () => void; onTarget: (id: string) => void }) {
  const readiness = profileReadiness(profile);
  const [expanded, setExpanded] = useState<string | null>(null);
  const strengths = [profile.gpa >= 4.2 ? `Сильный средний балл — ${profile.gpa}/5` : "Профиль заполнен для первичной оценки", profile.unt ? `ЕНТ ${profile.unt} открывает платные траектории в выбранных программах` : "ЕНТ добавлен в план подготовки", profile.ielts ? `IELTS ${profile.ielts} подходит части англоязычных программ` : "Есть варианты с внутренним English test"];
  const constraints = [profile.scholarshipImportant ? "Грант важен — конкуренция потребует усилить ЕНТ" : "Бюджет — основной фильтр", profile.budget < 2_500_000 ? "Часть англоязычных программ выше бюджета" : "Для NU потребуется отдельная финансовая траектория"];

  return <main className="dashboard container">
    <DashboardHeader active="results" onEdit={onEdit} />
    {notice && <div className="change-banner"><span>↻</span><div><strong>Маршрут пересчитан</strong><p>{notice}</p></div></div>}
    <section className="results-intro"><div><p className="section-kicker">ТВОЙ РЕЗУЛЬТАТ</p><h1>{profile.name ? `${profile.name}, ` : ""}вот твой профиль поступления</h1><p>Мы сопоставили твою цель, академику и ограничения с требованиями программ.</p></div><div className="readiness-card"><ScoreRing value={readiness} size="large" /><div><span>Готовность профиля</span><strong>{readiness >= 80 ? "Хорошая база" : "Есть понятные точки роста"}</strong><small>Это полнота и соответствие профиля, а не шанс поступления.</small></div></div></section>
    <section className="diagnosis-grid"><article><div className="diagnosis-title good"><span>↑</span><div><small>Сильные стороны</small><strong>{strengths.length} сигнала</strong></div></div><ul>{strengths.map((item) => <li key={item}><CheckIcon />{item}</li>)}</ul></article><article><div className="diagnosis-title attention"><span>!</span><div><small>Что учесть</small><strong>{constraints.length} ограничения</strong></div></div><ul>{constraints.map((item) => <li key={item}><b>—</b>{item}</li>)}</ul></article><article className="goal-card"><small>Твоя цель</small><strong>{interestLabels[profile.interest].title}</strong><span>{profile.preferredCities.join(" · ")} · {profile.enrollmentYear}</span><div className="goal-tags"><i>{formatMoney(profile.budget)}</i><i>{profile.language}</i></div></article></section>
    <section className="matches-section"><div className="section-heading"><div><p className="section-kicker">ПЕРСОНАЛЬНЫЙ МЭТЧИНГ</p><h2>Программы, которые подходят тебе</h2><p>Баллы показывают совместимость профиля по шести критериям — не вероятность поступления.</p></div><button className="button outline" onClick={onCompare}>Сравнить варианты <Chevron /></button></div>
      <div className="matches-list">{matches.map((match, index) => <MatchCard key={match.program.id} match={match} rank={index} expanded={expanded === match.program.id} onExpand={() => setExpanded(expanded === match.program.id ? null : match.program.id)} onTarget={() => { onTarget(match.program.id); onRoadmap(); }} />)}</div>
    </section>
  </main>;
}

function MatchCard({ match, rank, expanded, onExpand, onTarget }: { match: Match; rank: number; expanded: boolean; onExpand: () => void; onTarget: () => void }) {
  const labels = ["Лучшее совпадение", "Сильный вариант", "Альтернатива", "Стоит рассмотреть"];
  const breakdownLabels: Array<[keyof Match["breakdown"], string]> = [["academic", "Академика"], ["program", "Направление"], ["budget", "Бюджет"], ["language", "Язык"], ["location", "Локация"], ["preferences", "Приоритеты"]];
  return <article className={`match-card ${rank === 0 ? "featured" : ""}`}>
    <div className="match-rank"><span>0{rank + 1}</span><b>{labels[rank]}</b></div>
    <div className="match-main"><div className="uni-mark">{match.program.shortName.slice(0, 2)}</div><div className="match-info"><div className="match-meta"><span>{match.program.city}</span><i>•</i><span>{match.program.duration}</span><i>•</i><span>{match.program.language}</span></div><h3>{match.program.university}</h3><p>{match.program.program} <span>{match.program.code}</span></p><div className="tag-row">{match.program.highlights.slice(0, 3).map((tag) => <span key={tag}>{tag}</span>)}</div></div><ScoreRing value={match.score} /></div>
    <div className="match-columns"><div className="why"><h4>Почему подходит</h4>{match.reasons.slice(0, 3).map((reason) => <p key={reason}><i><CheckIcon /></i>{reason}</p>)}</div><div className="fact-box"><div><span>Стоимость</span><strong>{match.program.tuitionLabel}</strong><ConfidenceBadge confidence={match.program.tuitionConfidence} /></div><div><span>Твой бюджет</span><strong>{match.breakdown.budget === 100 ? "Подходит" : "Нужен грант / запас"}</strong></div></div></div>
    {match.gaps.length > 0 && <div className="gap-line"><span>!</span><p><strong>Точка роста:</strong> {match.gaps[0]}</p></div>}
    {expanded && <div className="match-details"><div><h4>Почему {match.score}/100?</h4>{breakdownLabels.map(([key, label]) => <div className="score-bar" key={key}><span>{label}</span><i><b style={{ width: `${match.breakdown[key]}%` }} /></i><strong>{match.breakdown[key]}</strong></div>)}</div><div className="requirements"><h4>Требования и прозрачность</h4><p><span>ЕНТ, платное</span><strong>{match.program.untPaid ? `${match.program.untPaid}+` : "уточнить"}</strong></p><p><span>IELTS</span><strong>{match.program.ielts ? `${match.program.ielts}+` : match.program.alternativeEnglishExam ? "внутренний тест" : "уточнить"}</strong></p><p><span>Актуальность цены</span><strong>{match.program.tuitionYear}</strong></p>{match.program.dataNote && <small>{match.program.dataNote}</small>}<a href={match.program.source.url} target="_blank" rel="noreferrer">Открыть официальный источник ↗</a></div></div>}
    <div className="match-footer"><button className="text-button" onClick={onExpand}>{expanded ? "Скрыть детали" : "Подробнее о мэтче"} <Chevron direction={expanded ? "down" : "right"} /></button><button className="button dark" onClick={onTarget}>Выбрать целью <Chevron /></button></div>
  </article>;
}

function Compare({ matches, onEdit, onRoadmap, onTarget }: { matches: Match[]; onEdit: () => void; onRoadmap: () => void; onTarget: (id: string) => void }) {
  const [leftId, setLeftId] = useState(matches[0]?.program.id ?? "");
  const [rightId, setRightId] = useState(matches[1]?.program.id ?? "");
  const left = matches.find((item) => item.program.id === leftId) ?? matches[0];
  const right = matches.find((item) => item.program.id === rightId) ?? matches[1];
  if (!left || !right) return null;
  const rows = [
    ["Совместимость", `${left.score}/100`, `${right.score}/100`],
    ["Стоимость", left.program.tuitionLabel, right.program.tuitionLabel],
    ["Город", left.program.city, right.program.city],
    ["Срок обучения", left.program.duration, right.program.duration],
    ["Язык", left.program.language, right.program.language],
    ["ЕНТ — платное", left.program.untPaid ? `${left.program.untPaid}+` : "уточнить", right.program.untPaid ? `${right.program.untPaid}+` : "уточнить"],
    ["IELTS", left.program.ielts ? `${left.program.ielts}+` : left.program.alternativeEnglishExam ? "внутренний тест" : "уточнить", right.program.ielts ? `${right.program.ielts}+` : right.program.alternativeEnglishExam ? "внутренний тест" : "уточнить"],
    ["Бюджет", left.breakdown.budget >= 70 ? "Подходит" : "Выше бюджета", right.breakdown.budget >= 70 ? "Подходит" : "Выше бюджета"],
  ];
  return <main className="dashboard container"><DashboardHeader active="compare" onEdit={onEdit} /><div className="page-title"><p className="section-kicker">СРАВНЕНИЕ</p><h1>Два варианта — одно осознанное решение</h1><p>Смотри на то, что важно именно для твоего профиля.</p></div><section className="compare-shell"><div className="compare-head"><div className="compare-label">Критерий</div>{[left, right].map((match, index) => <div className="compare-program" key={`${match.program.id}-${index}`}><select value={index === 0 ? leftId : rightId} onChange={(event) => index === 0 ? setLeftId(event.target.value) : setRightId(event.target.value)}>{matches.filter((item) => index === 0 ? item.program.id !== rightId : item.program.id !== leftId).map((item) => <option value={item.program.id} key={item.program.id}>{item.program.shortName} · {item.program.program}</option>)}</select><div><span className="uni-mark small">{match.program.shortName.slice(0, 2)}</span><div><strong>{match.program.shortName}</strong><small>{match.program.program}</small></div><ScoreRing value={match.score} size="small" /></div></div>)}</div>{rows.map(([label, leftValue, rightValue]) => <div className="compare-row" key={label}><span>{label}</span><strong className={leftValue === "Подходит" ? "positive" : ""}>{leftValue}</strong><strong className={rightValue === "Подходит" ? "positive" : ""}>{rightValue}</strong></div>)}<div className="compare-verdict"><span>Персональный вывод</span><div><strong>{left.score >= right.score ? "Лучший общий мэтч" : "Альтернативный вариант"}</strong><p>{left.reasons[0]}</p></div><div><strong>{right.program.tuitionKzt < left.program.tuitionKzt ? "Выгоднее по стоимости" : "Сильный альтернативный профиль"}</strong><p>{right.reasons[0]}</p></div></div><div className="compare-actions"><span /><button className="button dark" onClick={() => { onTarget(left.program.id); onRoadmap(); }}>Выбрать {left.program.shortName}</button><button className="button outline" onClick={() => { onTarget(right.program.id); onRoadmap(); }}>Выбрать {right.program.shortName}</button></div></section><p className="compare-note">Данные помогают сравнить варианты, но финальные требования всегда проверяй на официальном сайте вуза.</p></main>;
}

const taskIcons: Record<RoadmapTask["category"], string> = { profile: "◎", exam: "✦", documents: "▤", application: "↗" };

function Roadmap({ profile, match, completed, onToggle, onEdit }: { profile: StudentProfile; match: Match; completed: string[]; onToggle: (id: string) => void; onEdit: () => void }) {
  const tasks = buildRoadmap(profile, match);
  const next = tasks.find((task) => !completed.includes(task.id));
  const progress = Math.round((completed.filter((id) => tasks.some((task) => task.id === id)).length / tasks.length) * 100);
  return <main className="dashboard roadmap-page container"><DashboardHeader active="roadmap" onEdit={onEdit} /><div className="page-title roadmap-title"><div><p className="section-kicker">ПЕРСОНАЛЬНЫЙ ROADMAP</p><h1>Твой путь в {match.program.shortName}</h1><p>{match.program.program} · старт осенью {profile.enrollmentYear}</p></div><div className="route-progress"><div style={{ "--progress": `${progress * 3.6}deg` } as React.CSSProperties}><strong>{progress}%</strong></div><span><b>{completed.length} из {tasks.length}</b> шагов выполнено</span></div></div>{next ? <section className="next-action"><div className="next-icon">→</div><div><small>СЛЕДУЮЩЕЕ ДЕЙСТВИЕ</small><h2>{next.title}</h2><p>{next.description}</p><span>{next.dateLabel}</span></div><button className="button light" onClick={() => onToggle(next.id)}><CheckIcon /> Отметить выполненным</button></section> : <section className="next-action complete"><div className="next-icon"><CheckIcon /></div><div><small>МАРШРУТ ПРОЙДЕН</small><h2>Все запланированные шаги отмечены</h2><p>Проверь статус заявки и официальный кабинет выбранного университета.</p></div></section>}
    <section className="roadmap-layout"><div className="timeline"><div className="timeline-head"><div><h2>План действий</h2><p>Личные ориентиры отделены от официальных сроков.</p></div><div className="legend"><span><i className="personal" />Личная дата</span><span><i className="check" />Нужно проверить</span></div></div>{tasks.map((task, index) => { const done = completed.includes(task.id); return <article className={`timeline-task ${done ? "done" : ""}`} key={task.id}><div className="timeline-line"><span>{done ? <CheckIcon /> : taskIcons[task.category]}</span>{index < tasks.length - 1 && <i />}</div><div className="task-content"><div className="task-top"><span className={`date-label ${task.dateType}`}>{task.dateType === "personal" ? "Личная цель" : task.dateType === "official" ? "Официально" : "Проверить"} · {task.dateLabel}</span><button className={done ? "task-check active" : "task-check"} onClick={() => onToggle(task.id)}>{done ? <><CheckIcon /> Выполнено</> : "Отметить"}</button></div><h3>{task.title}</h3><p>{task.description}</p><details><summary>Почему это важно?</summary><p>{task.reason}</p></details></div></article>; })}</div><aside className="route-sidebar"><div className="route-target"><span>Твоя цель</span><div className="uni-mark">{match.program.shortName.slice(0, 2)}</div><strong>{match.program.university}</strong><p>{match.program.program}</p><a href={match.program.source.url} target="_blank" rel="noreferrer">Официальный источник ↗</a></div><div className="route-warning"><span>!</span><div><strong>Даты 2027 ещё уточняются</strong><p>Мы показываем личные сроки подготовки. Перед подачей сверяй официальную кампанию вуза.</p></div></div><div className="route-stats"><p><span>Стоимость</span><strong>{match.program.tuitionLabel}</strong></p><p><span>ЕНТ</span><strong>{match.program.untPaid ? `${match.program.untPaid}+` : "уточнить"}</strong></p><p><span>Язык</span><strong>{match.program.language}</strong></p></div></aside></section>
  </main>;
}

export function AdmissionApp() {
  const [saved] = useState(readSavedState);
  const [screen, setScreen] = useState<Screen>("landing");
  const [profile, setProfile] = useState<StudentProfile>(saved.profile ?? defaultProfile);
  const [targetId, setTargetId] = useState<string>(saved.targetId ?? "");
  const [completed, setCompleted] = useState<string[]>(saved.completed ?? []);
  const [notice, setNotice] = useState("");
  const [editingFrom, setEditingFrom] = useState<string>("");
  const allMatches = useMemo(() => matchPrograms(profile), [profile]);
  const matches = useMemo(() => diversified(allMatches, 4), [allMatches]);
  const target = allMatches.find((item) => item.program.id === targetId) ?? matches[0];

  useEffect(() => {
    window.localStorage.setItem("uniflow-state", JSON.stringify({ profile, targetId, completed }));
  }, [profile, targetId, completed]);

  const editProfile = () => {
    setEditingFrom(matches[0]?.program.id ?? "");
    setScreen("onboarding");
  };
  const completeProfile = () => {
    const nextTop = diversified(matchPrograms(profile), 1)[0];
    if (editingFrom) {
      const previous = allMatches.find((item) => item.program.id === editingFrom)?.program.shortName;
      setNotice(previous && nextTop && previous !== nextTop.program.shortName ? `Лидер изменился: ${previous} → ${nextTop.program.shortName}. Обновлены баллы и шаги.` : "Обновлены баллы совместимости, причины рекомендаций и план действий.");
    }
    setTargetId(nextTop?.program.id ?? "");
    setEditingFrom("");
    setScreen("results");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const showDemo = () => {
    setProfile(defaultProfile);
    setTargetId("aitu-big-data");
    setNotice("");
    setScreen("results");
  };
  const navigate = (next: Screen) => {
    setScreen(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return <div className="app-shell"><AppHeader screen={screen} onNavigate={navigate} />{screen === "landing" && <Landing onStart={() => { setProfile({ ...defaultProfile, name: "" }); setScreen("onboarding"); }} onDemo={showDemo} />}{screen === "onboarding" && <Onboarding profile={profile} setProfile={setProfile} onCancel={() => setScreen(editingFrom ? "results" : "landing")} onComplete={completeProfile} />}{screen === "results" && <Results profile={profile} matches={matches} notice={notice} onEdit={editProfile} onCompare={() => navigate("compare")} onRoadmap={() => navigate("roadmap")} onTarget={setTargetId} />}{screen === "compare" && <Compare matches={matches} onEdit={editProfile} onRoadmap={() => navigate("roadmap")} onTarget={setTargetId} />}{screen === "roadmap" && target && <Roadmap profile={profile} match={target} completed={completed} onToggle={(id) => setCompleted((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])} onEdit={editProfile} />}<footer><div className="container"><Logo /><p>Рекомендации помогают сориентироваться и не являются гарантией поступления.</p><span>Данные обновлены: 17 сентября 2026</span></div></footer></div>;
}
