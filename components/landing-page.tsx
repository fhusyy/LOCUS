'use client';

import React, { useEffect, useState } from 'react';
import { AuthModal } from './screens/auth-modal';
import { useI18n } from './i18n-provider';

interface University {
  id: string;
  name: string;
  location: string;
  program: string;
  matchScore: number;
  category: string;
  tuition: string;
  tuitionUSD: number;
  minUnt: number;
  ielts: number;
  military: boolean;
  dorm: boolean;
  whyFits: string[];
  concern: string;
}

const universitiesData: University[] = [
  {
    id: "aitu",
    name: "Astana IT University (AITU)",
    location: "Астана, Казахстан",
    program: "Software Engineering / Computer Science",
    matchScore: 94,
    category: "Safety (Гарантированный)",
    tuition: "100% Госгрант РК / 1,400,000 KZT (платно)",
    tuitionUSD: 3100,
    minUnt: 100,
    ielts: 6.0,
    military: true,
    dorm: true,
    whyFits: [
      "Ваш балл ЕНТ (118) существенно превышает пороговый балл гранта прошлого года (104).",
      "Полное соответствие бюджету ($8,000 в год полностью покрывает платное обучение и проживание).",
      "Наличие военной кафедры со 2-го курса и гарантированное общежитие для первокурсников."
    ],
    concern: "Высокий конкурс на IT-общежития — бронирование необходимо подать до 25 июля."
  },
  {
    id: "kbtu",
    name: "Казахстанско-Британский технический университет (КБТУ)",
    location: "Алматы, Казахстан",
    program: "Information Systems & Data Analytics",
    matchScore: 88,
    category: "Target (Оптимальный)",
    tuition: "Госгрант / 2,400,000 KZT",
    tuitionUSD: 5200,
    minUnt: 110,
    ielts: 6.5,
    military: true,
    dorm: true,
    whyFits: [
      "Сильнейшая школа Computer Science в Казахстане с прямым партнерством с Big Tech.",
      "Ваш балл ЕНТ (118) конкурентоспособен в первом пуле грантового конкурса.",
      "Англоязычный трек обучения идеально соответствует вашему IELTS 7.0."
    ],
    concern: "Повышенные требования к промежуточным сессиям (GPA от 2.67 для сохранения гранта)."
  },
  {
    id: "tum",
    name: "Technical University of Munich (TUM)",
    location: "Мюнхен, Германия",
    program: "B.Sc. Informatics (Computer Science)",
    matchScore: 78,
    category: "Reach (Амбициозный)",
    tuition: "€0 за обучение (только семестровый взнос €150)",
    tuitionUSD: 11000,
    minUnt: 110,
    ielts: 6.5,
    military: false,
    dorm: true,
    whyFits: [
      "Входит в топ-30 лучших технических университетов мира (#1 в Германии).",
      "Само обучение бесплатное в государственном вузе Баварии.",
      "Прямой доступ к стажировкам в европейских центрах Google, Microsoft и BMW."
    ],
    concern: "Блокированный счет для визы требует от €11,208 в год. При бюджете $8,000 требуется подача на стипендию DAAD."
  }
];

import type { StudentProfile } from '@/lib/types';

export interface LandingPageProps {
  onStart?: () => void;
  onNavigate?: (screen: string) => void;
  onAuthSuccess?: (profile: Partial<StudentProfile>) => void;
  profile?: StudentProfile;
  onLogout?: () => void;
  isAuthenticated?: boolean;
}

function StaggeredLabel({ value }: { value: string }) {
  return (
    <>
      {value.split(" ").map((word, wordIndex) => (
        <React.Fragment key={`${word}-${wordIndex}`}>
          {wordIndex > 0 ? " " : null}
          <span className="tricksword">
            {Array.from(word).map((letter, letterIndex) => (
              <span className="letter" key={`${letter}-${letterIndex}`}>{letter}</span>
            ))}
          </span>
        </React.Fragment>
      ))}
    </>
  );
}

export function LandingPage({ onStart, onNavigate, onAuthSuccess, profile, onLogout, isAuthenticated = false }: LandingPageProps = {}) {
  const { t, tr } = useI18n();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'diagnosis' | 'recommendations' | 'compare' | 'roadmap' | 'action'>('profile');
  const [budget, setBudget] = useState(8000);
  const [untScore, setUntScore] = useState(118);
  const [isActionDone, setIsActionDone] = useState(false);
  const [showNotification, setShowNotification] = useState(false);

  const isLoggedIn = isAuthenticated;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('auth') !== 'google') return;

    setAuthMode('login');
    setIsAuthOpen(true);
    window.history.replaceState({}, '', window.location.pathname);
  }, []);

  const handleStart = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (isLoggedIn) {
      if (onStart) onStart();
      else if (onNavigate) onNavigate('dashboard');
    } else {
      setAuthMode('login');
      setIsAuthOpen(true);
    }
  };

  const handleNav = (screen: string, modalTab: any, e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!isLoggedIn) {
      setAuthMode('login');
      setIsAuthOpen(true);
      return;
    }
    if (onNavigate) {
      onNavigate(screen);
    } else {
      openModal(modalTab);
    }
  };

  const openModal = (tab: 'profile' | 'diagnosis' | 'recommendations' | 'compare' | 'roadmap' | 'action' = 'profile') => {
    setActiveTab(tab);
    setIsModalOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setIsModalOpen(false);
    document.body.style.overflow = '';
  };

  const handleBudgetChange = (newBudget: number) => {
    setBudget(newBudget);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 2600);
  };

  const handleUntChange = (newUnt: number) => {
    setUntScore(newUnt);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 2600);
  };

  return (
    <div className="locus-landing-root" style={{ fontFamily: "'Mulish', sans-serif" }}>
      {/* AUTH MODAL */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        initialMode={authMode}
        onSuccess={(userProf) => {
          if (onAuthSuccess) {
            onAuthSuccess(userProf);
          } else if (onStart) {
            onStart();
          }
        }}
      />

      {/* NAVIGATION */}
      <div className="nav-parent">
        <nav
          className="nav"
          style={{
            transform: 'translate3d(0px, 0%, 0px)',
            opacity: 1,
            backgroundColor: 'transparent',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            borderBottom: 'none'
          }}
        >
          <div className="container flex-split" style={{ width: '90%', maxWidth: '1360px', position: 'relative' }}>
            <a href="#" className="logo w-inline-block" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
              <span style={{ fontSize: '26px', fontWeight: 900, color: '#040915', letterSpacing: '-0.5px' }}>
                UniFlow<span style={{ color: '#FE7505' }}>.</span>
              </span>
            </a>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', zIndex: 5 }}>
              {isLoggedIn ? (
                /* LOGGED IN USER AVATAR & DROPDOWN */
                <div style={{ position: 'relative' }}>
                  <button
                    type="button"
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '5px 14px 5px 6px',
                      borderRadius: '100vw',
                      border: '1.5px solid rgba(4, 9, 21, 0.15)',
                      background: '#FFFFFF',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#FE7505';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(4, 9, 21, 0.15)';
                    }}
                  >
                    <span
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #FE7505 0%, #E24012 100%)',
                        color: '#FFFFFF',
                        fontWeight: 800,
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {profile?.name?.charAt(0).toUpperCase()}
                    </span>
                    <span style={{ fontWeight: 700, fontSize: '13.5px', color: '#040915', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {profile?.name}
                    </span>
                    <span style={{ fontSize: '9px', color: '#6A798B' }}>▼</span>
                  </button>

                  {userMenuOpen && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 8px)',
                        right: 0,
                        background: '#FFFFFF',
                        borderRadius: '16px',
                        boxShadow: '0 12px 36px rgba(0, 0, 0, 0.18), 0 0 0 1px rgba(0, 0, 0, 0.06)',
                        padding: '8px',
                        minWidth: '220px',
                        zIndex: 99999,
                        animation: 'fadeIn 0.2s ease',
                      }}
                    >
                      <div style={{ padding: '8px 12px 6px', borderBottom: '1px solid #F0F2F5' }}>
                        <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#040915' }}>{profile?.name}</div>
                        <div style={{ fontSize: '11px', color: '#6A798B', marginTop: '2px' }}>
                          {t("landing.user.score", { unt: profile?.unt ?? "—", grade: profile?.grade || "11" })}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setUserMenuOpen(false);
                          if (onNavigate) onNavigate('dashboard');
                        }}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '9px 12px',
                          borderRadius: '10px',
                          border: 'none',
                          background: 'transparent',
                          fontSize: '13px',
                          fontWeight: 600,
                          color: '#040915',
                          cursor: 'pointer',
                          marginTop: '4px',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#F4F5F7')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        {t("landing.user.dashboard")}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setUserMenuOpen(false);
                          if (onNavigate) onNavigate('roadmap');
                        }}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '9px 12px',
                          borderRadius: '10px',
                          border: 'none',
                          background: 'transparent',
                          fontSize: '13px',
                          fontWeight: 600,
                          color: '#040915',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#F4F5F7')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        {t("landing.user.route")}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setUserMenuOpen(false);
                          if (onNavigate) onNavigate('onboarding');
                        }}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '9px 12px',
                          borderRadius: '10px',
                          border: 'none',
                          background: 'transparent',
                          fontSize: '13px',
                          fontWeight: 600,
                          color: '#040915',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#F4F5F7')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        {t("landing.user.edit")}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setUserMenuOpen(false);
                          if (onLogout) onLogout();
                        }}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '9px 12px',
                          borderRadius: '10px',
                          border: 'none',
                          background: 'transparent',
                          fontSize: '13px',
                          fontWeight: 600,
                          color: '#DC2626',
                          cursor: 'pointer',
                          borderTop: '1px solid #F0F2F5',
                          marginTop: '4px',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#FEF2F2')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        {t("landing.user.logout")}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* NOT LOGGED IN: SHOW 'ВОЙТИ' */
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setIsAuthOpen(true);
                  }}
                  className="nav-auth-btn"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#040915',
                    fontWeight: 700,
                    fontSize: '14.5px',
                    cursor: 'pointer',
                    padding: '8px 14px',
                    borderRadius: '100vw',
                    transition: 'color 0.2s, background-color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#FE7505';
                    e.currentTarget.style.backgroundColor = 'rgba(254, 117, 5, 0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#040915';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  {t("nav.login")}
                </button>
              )}

              <a
                href={isLoggedIn ? "#dashboard" : "#start"}
                onClick={handleStart}
                className="btn nav stagger-text w-inline-block"
                style={{
                  textDecoration: 'none',
                  marginRight: '0',
                  transform: 'translateX(8px)',
                  display: 'inline-flex',
                  alignItems: 'center',
                }}
              >
                <div className="btn-text">
                  {t("landing.hero.cta")}
                </div>
              </a>
            </div>
          </div>

        </nav>
      </div>

      <div className="overflow">
        {/* HERO SECTION */}
        <header className="hero is--home">
          <div className="container flex-cc-v is--hero">
            <div className="hero-heading-wrapper">
              <div className="hero-heading-line-wrapper top">
                <div className="div-hide hanging-text">
                  <h1 className="super-text">
                    <span className="hero-heading-move _1">{t("landing.hero.line1")}</span>
                  </h1>
                </div>
              </div>
              <div className="hero-heading-line-wrapper btm">
                <div className="div-hide inline hanging-text">
                  <h1 className="super-text">
                    <span className="hero-heading-move _2">{t("landing.hero.line2")}</span>
                  </h1>
                </div>
              </div>
            </div>

            <p style={{ maxWidth: '680px', textAlign: 'center', color: '#4a5768', fontSize: '18px', margin: '20px auto 32px', lineHeight: 1.6 }}>
              {t("landing.hero.description")}
            </p>

            <a
              href="#start"
              onClick={handleStart}
              className="btn btn-gradient stagger-text w-inline-block"
              style={{ opacity: 1, textDecoration: 'none' }}
            >
              <div className="btn-text" style={{ fontSize: '16px', fontWeight: 700 }}>
                {t("landing.hero.cta")}
              </div>
            </a>

            <div style={{ marginTop: '20px', fontSize: '13.5px', fontWeight: 700, color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <span>{t("landing.flow.profile")}</span>
              <span style={{ color: '#FE7505', opacity: 0.8 }}>→</span>
              <span>{t("landing.flow.match")}</span>
              <span style={{ color: '#FE7505', opacity: 0.8 }}>→</span>
              <span>{t("landing.flow.compare")}</span>
              <span style={{ color: '#FE7505', opacity: 0.8 }}>→</span>
              <span>{t("landing.flow.plan")}</span>
              <span style={{ color: '#FE7505', opacity: 0.8 }}>→</span>
              <span>{t("landing.flow.next")}</span>
            </div>
          </div>

          <div className="hero-bg-wrapper">
            <div className="hero-blur"></div>
            <img src="/assets/asset_2.png" loading="lazy" alt="hero circle 1" className="hero-circle-1" style={{ opacity: 1 }} />
            <img src="/assets/asset_3.png" loading="lazy" alt="hero circle 2" className="hero-circle-2" style={{ opacity: 1 }} />
          </div>
        </header>

        <main>
          {/* FEATURED CASE / SHOWCASE */}
          <section className="section is--project">
            <div className="container">
              <div className="rel">
                <div className="recent-project-label">{tr("РЕАЛЬНЫЙ МАРШРУТ ПОСТУПЛЕНИЯ")}</div>
                <a
                  href="#case"
                  onClick={(e) => handleNav('results', 'recommendations', e)}
                  className="project-card-wrapper w-inline-block"
                  style={{ textDecoration: 'none' }}
                >
                  <div className="project-card-bg bg-thats-clutch" style={{ width: '100%', height: '100%' }}></div>
                  <img src="/assets/uniflow-hero-preview.jpg?v=4" loading="lazy" alt="UniFlow Website" className="project-site-img" style={{ opacity: 1 }} />
                  <img src="/assets/asset_5.png" loading="lazy" alt="" className="project-img-1 thats-clutch-app" style={{ opacity: 1 }} />
                  <img src="/assets/asset_extra_21.png" loading="lazy" alt="" className="poster-img _3" style={{ opacity: 1 }} />
                  <img src="/assets/asset_6.png" loading="lazy" alt="" className="poster-img _2" style={{ opacity: 1 }} />
                  <img src="/assets/asset_7.png" loading="lazy" alt="" className="poster-img _1" style={{ opacity: 1 }} />
                  <img src="/assets/asset_8.svg" loading="lazy" alt="" className="project-sticker" style={{ opacity: 1 }} />
                </a>
              </div>

              <div className="project-info-wrapper">
                <div className="div-hide is--project-title">
                  <a
                    href="#case"
                    onClick={(e) => handleNav('results', 'recommendations', e)}
                    className="project-title w-inline-block"
                    style={{ textDecoration: 'none' }}
                  >
                    <h2>{tr("Траектория Software Engineering")}</h2>
                  </a>
                </div>
                <div className="div-hide is--always">
                  <div className="project-category">
                    <p className="sm-upper">{tr("AITU · КБТУ · 94% Match · 100% Госгрант РК")}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* VALUE STATEMENT */}
          <section className="section">
            <div className="container flex-v">
              <div>
                <div className="div-hide hanging-text">
                  <h2>{tr("Маршрут, который объясняет,")}</h2>
                </div>
                <div className="div-hide hanging-text">
                  <h2>{tr("где твоё место и почему,")}<br /></h2>
                </div>
                <div className="div-hide hanging-text">
                  <h2>{tr("и что делать прямо сейчас")}</h2>
                </div>
                <div className="spacer-1em"></div>
                <p style={{ opacity: 1, fontSize: '18px', lineHeight: 1.7, color: '#94a3b8', maxWidth: '700px' }}>
                  {tr("Не очередной перегруженный справочник вузов со старыми таблицами. UniFlow анализирует твои баллы ЕНТ, GPA, языковые сертификаты и финансовый лимит, рассчитывает объективную совместимость и ведёт за руку до оффера.")}
                </p>
              </div>
              <div className="img-parent uniflow-circle">
                <img src="/assets/asset_extra_23.png" alt="Decoration" />
              </div>
            </div>
          </section>

          {/* SERVICES / CORE VALUE */}
          <section className="section is--services">
            <div className="h-services-bg-wrapper">
              <div className="h-services-bg">
                <div className="half">
                  <div className="div-hide hanging-text">
                    <h2>{tr("Честный AI-подбор,")}</h2>
                  </div>
                  <div className="div-hide hanging-text">
                    <h2>{tr("который раскладывает всё")}</h2>
                  </div>
                  <div className="div-hide hanging-text">
                    <h2>{tr("по полочкам")}</h2>
                  </div>
                  <div className="spacer-1em"></div>
                  <p style={{ opacity: 1, color: '#94a3b8', fontSize: '16px', lineHeight: 1.6 }}>
                    {tr("КУДА поступать → ПОЧЕМУ это подходит → ЧТО ДЕЛАТЬ ДАЛЬШЕ. Умный движок рекомендаций мгновенно адаптируется, если меняются твои приоритеты, баллы или семейный бюджет.")}
                    <br /><br />
                    <strong>{tr("Ключевые возможности платформы:")}</strong>
                  </p>
                  <div className="benefits-wrapper">
                    <div className="benefit-wrapper first" style={{ opacity: 1 }}>
                      <div><img src="/assets/asset_9.svg" loading="lazy" alt="Star" className="star" /></div>
                      <div>
                        <p>{tr("Объективная диагностика профиля: сильные стороны, скрытые ограничения и реалистичные шансы на бюджет.")}</p>
                      </div>
                    </div>
                    <div className="benefit-wrapper" style={{ opacity: 1 }}>
                      <div><img src="/assets/asset_9.svg" loading="lazy" alt="Star" className="star" /></div>
                      <div>
                        <p>{tr("Умная категоризация (Safety, Target, Reach): детальное объяснение, почему каждый университет подходит именно тебе.")}</p>
                      </div>
                    </div>
                    <div className="benefit-wrapper" style={{ opacity: 1 }}>
                      <div><img src="/assets/asset_9.svg" loading="lazy" alt="Star" className="star" /></div>
                      <div>
                        <p>{tr("Персональный Roadmap & Next Action: пошаговый таймлайн дедлайнов, сбора справок и подготовки к тестам.")}</p>
                      </div>
                    </div>
                  </div>

                  <div className="btn-wrapper" style={{ marginTop: '28px' }}>
                    <a
                      href="#explore"
                      onClick={(e) => handleNav('results', 'recommendations', e)}
                      className="btn secondary stagger-text w-inline-block"
                      style={{ opacity: 1, textDecoration: 'none' }}
                    >
                      <div className="btn-text"><StaggeredLabel value={tr("Открыть маршрут")} /></div>
                    </a>
                  </div>
                </div>
              </div>

              <div className="h-services-bg bg-dark-gradient round">
                <div className="services-img-wrapper">
                  <div className="img-parent h-services _2">
                    <img src="/assets/asset_10.jpg" loading="lazy" alt="Student" className="h-services-person" />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* MISSION / PHILOSOPHY */}
          <section className="section is--bigger">
            <div className="container flex-v">
              <div className="auto">
                <div className="div-hide">
                  <h2>{tr("Помогаем каждому абитуриенту")}</h2>
                </div>
                <div className="div-hide hanging-text">
                  <h2>{tr("превратить старания и мечты")}<br /></h2>
                </div>
                <div className="div-hide">
                  <h2>{tr("в гарантированное поступление")}</h2>
                </div>
                <div className="spacer-1em"></div>
                <p style={{ opacity: 1, fontSize: '18px', lineHeight: 1.7, color: '#94a3b8', maxWidth: '640px' }}>
                  {tr("Мы уверены: выбор будущего университета должен быть понятным, вдохновляющим и доступным для каждого школьника, без переплат агентствам и страха пропустить важный дедлайн.")}
                </p>
                <div className="spacer-2em"></div>
                <div className="btn-wrapper">
                  <a
                    href="#start"
                    onClick={(e) => handleStart(e)}
                    className="btn secondary stagger-text w-inline-block"
                    style={{ opacity: 1, textDecoration: 'none' }}
                  >
                    <div className="btn-text"><StaggeredLabel value={tr("Пройти тест")} /></div>
                  </a>
                </div>
              </div>
            </div>

            <div className="label-1-wrapper"><img src="/assets/asset_11.svg" loading="lazy" alt="Label" className="label-1 is--h-about" /></div>
            <div className="label-4-wrapper"><img src="/assets/asset_12.svg" loading="lazy" alt="Label" className="label-4 is--h-about" /></div>
          </section>

          {/* TESTIMONIAL */}
          <section className="section is--bigger">
            <div className="container flex-cc-v">
              <div className="testimonial-wrapper">
                <h2 className="testimonial">
                  {tr("«UniFlow сразу показал, на какие специальности в AITU и КБТУ я прохожу на грант с моим ЕНТ, и разложил дедлайны. Поступил с первой попытки!»")}
                </h2>
                <div className="spacer-0-5em"></div>
                <p className="p-full">
                  {tr("Без суеты, с чётким пониманием каждого шага подготовки документов и военной кафедры.")}
                </p>
                <div className="testimonial-author-wrapper">
                  <div className="testimonial-author-img-parent">
                    <img src="/assets/asset_13.jpg" loading="lazy" alt="Алихан Сапаров" className="testimonial-author-img top" />
                  </div>
                  <div className="testimonial-author-info">
                    <div className="div-hide is--always">
                      <div className="sm-upper" style={{ fontWeight: 800, color: '#fff' }}>{tr("Алихан Сапаров")}</div>
                    </div>
                    <div className="spacer-0-5em"></div>
                    <div className="div-hide is--always">
                      <div className="sm-upper" style={{ color: '#FE7505' }}>{tr("Студент Software Engineering · AITU (118 ЕНТ / 7.5 IELTS)")}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* BIG CTA */}
          <section className="section is--cta">
            <div className="container flex-cc-v is--cta">
              <div className="cta-heading-wrapper" style={{ alignItems: 'center', alignSelf: 'center', textAlign: 'center', width: '100%' }}>
                <div className="cta-heading-line-wrapper top" style={{ marginLeft: 0, alignSelf: 'center', textAlign: 'center' }}>
                  <div className="div-hide is--always">
                    <h1 className="super-text cta" style={{ textAlign: 'center' }}>{tr("Построй свой персональный")}</h1>
                  </div>
                </div>
                <div className="cta-heading-line-wrapper" style={{ marginLeft: 0, alignSelf: 'center', textAlign: 'center' }}>
                  <div className="div-hide inline is--always">
                    <h1 className="super-text cta" style={{ textAlign: 'center' }}>{tr("маршрут поступления сегодня")}</h1>
                  </div>
                </div>
              </div>
              <p className="text-center" style={{ opacity: 1, fontSize: '18px', color: '#4a5768', maxWidth: '600px', margin: '16px auto 28px' }}>
                {tr("Ответь на 7 коротких вопросов и получи готовую стратегию поступления уже через 3 минуты!")}
              </p>
              <a
                href="#start"
                onClick={handleStart}
                className="btn bigger btn-gradient stagger-text w-inline-block"
                style={{ opacity: 1, textDecoration: 'none' }}
              >
                <div className="btn-text"><StaggeredLabel value={tr("Построить маршрут")} /></div>
              </a>
            </div>
            <div className="hero-bg-wrapper cta">
              <img src="/assets/asset_14.png" loading="lazy" alt="CTA Circle 1" className="cta-circle-1" />
              <img src="/assets/asset_15.png" loading="lazy" alt="CTA Circle 2" className="cta-circle-2" />
            </div>
          </section>
        </main>

        {/* FOOTER */}
        <div className="footer-section">
          <div className="container">
            <footer className="footer bg-black">
              <div className="footer-company-info">
                <a href="#" className="footer-logo w-inline-block" style={{ textDecoration: 'none' }}>
                  <span style={{ fontSize: '28px', fontWeight: 900, color: '#fff', letterSpacing: '-0.5px' }}>
                    UniFlow<span style={{ color: '#FE7505' }}>.</span>
                  </span>
                </a>
                <div className="logo-tag" style={{ color: '#94a3b8', fontSize: '14px', lineHeight: 1.6, marginTop: '12px' }}>
                  {tr("Персональный AI-навигатор поступления в университеты.")}<br />
                  {tr("Куда поступать, почему это подходит и что делать дальше.")}
                </div>
              </div>

              <div className="footer-link-wrapper">
                <div className="footer-link-grid">
                  <div className="sm-upper footer">{tr("МЕНЮ")}</div>
                  <a href="#diagnosis" onClick={(e) => handleNav('dashboard', 'diagnosis', e)} className="footer-link">{tr("Диагностика")}</a>
                  <a href="#recommendations" onClick={(e) => handleNav('results', 'recommendations', e)} className="footer-link">{tr("Подбор ВУЗов")}</a>
                  <a href="#compare" onClick={(e) => handleNav('compare', 'compare', e)} className="footer-link">{tr("Сравнение программ")}</a>
                  <a href="#roadmap" onClick={(e) => handleNav('roadmap', 'roadmap', e)} className="footer-link">{tr("Дорожная карта")}</a>
                  <a href="#action" onClick={(e) => handleNav('dashboard', 'action', e)} className="footer-link">{tr("Ближайший шаг")}</a>
                </div>

                <div className="footer-link-grid btm">
                  <div className="sm-upper footer">{tr("Контакты")}</div>
                  <a href="https://t.me" target="_blank" rel="noopener noreferrer" className="social-link w-inline-block">
                    <div className="footer-link">Telegram</div>
                    <img src="/assets/asset_17.svg" loading="lazy" alt="arrow" className="social-arrow" />
                  </a>
                  <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="social-link w-inline-block">
                    <div className="footer-link">LinkedIn</div>
                    <img src="/assets/asset_17.svg" loading="lazy" alt="arrow" className="social-arrow" />
                  </a>
                  <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="social-link w-inline-block">
                    <div className="footer-link">Instagram</div>
                    <img src="/assets/asset_17.svg" loading="lazy" alt="arrow" className="social-arrow" />
                  </a>
                  <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="social-link w-inline-block">
                    <div className="footer-link">GitHub</div>
                    <img src="/assets/asset_17.svg" loading="lazy" alt="arrow" className="social-arrow" />
                  </a>
                </div>
              </div>
            </footer>
          </div>
        </div>
      </div>

      {/* ================= INTERACTIVE ADMISSION JOURNEY SYSTEM ================= */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(4, 9, 21, 0.88)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            zIndex: 999999,
            overflowY: 'auto',
            padding: '24px 16px',
            boxSizing: 'border-box'
          }}
        >
          <div
            style={{
              maxWidth: '960px',
              margin: '20px auto 40px',
              background: '#0d1527',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '24px',
              boxShadow: '0 30px 90px rgba(0, 0, 0, 0.8)',
              color: '#fff',
              padding: '32px',
              position: 'relative'
            }}
          >
            {/* Close button */}
            <button
              onClick={closeModal}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                color: '#fff',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                fontSize: '20px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ✕
            </button>

            {/* Tabs Header */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '16px', marginBottom: '24px' }}>
              {[
                { key: 'profile', label: '1. Профиль' },
                { key: 'diagnosis', label: '2. Диагностика' },
                { key: 'recommendations', label: '3. ВУЗы' },
                { key: 'compare', label: '4. Сравнение' },
                { key: 'roadmap', label: '5. Роадмап' },
                { key: 'action', label: '6. Ближайший шаг' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  style={{
                    background: activeTab === tab.key ? 'linear-gradient(135deg, #2652B9, #FE7505)' : 'rgba(255, 255, 255, 0.06)',
                    color: activeTab === tab.key ? '#fff' : '#cbd5e1',
                    border: activeTab === tab.key ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
                    padding: '9px 16px',
                    borderRadius: '30px',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Live Personalization Controller */}
            <div
              style={{
                background: 'rgba(38, 82, 185, 0.15)',
                border: '1px solid rgba(38, 82, 185, 0.3)',
                borderRadius: '14px',
                padding: '14px 18px',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px'
              }}
            >
              <div>
                <span style={{ color: '#FE7505', fontWeight: 800, fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase' }}>
                  Демонстрация персонализации (Case 02):
                </span>
                <div style={{ fontSize: '13px', color: '#cbd5e1', marginTop: '2px' }}>
                  Измени бюджет или баллы ЕНТ — рекомендации и план пересчитаются мгновенно:
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8' }}>Бюджет:</label>
                <select
                  value={budget}
                  onChange={(e) => handleBudgetChange(parseInt(e.target.value, 10))}
                  style={{
                    background: '#162238',
                    color: '#fff',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    padding: '7px 12px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 600
                  }}
                >
                  <option value={20000}>$20,000 / год (Высокий)</option>
                  <option value={8000}>$8,000 / год (Ограниченный)</option>
                  <option value={0}>Только Грант / $0</option>
                </select>

                <label style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8' }}>ЕНТ:</label>
                <select
                  value={untScore}
                  onChange={(e) => handleUntChange(parseInt(e.target.value, 10))}
                  style={{
                    background: '#162238',
                    color: '#fff',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    padding: '7px 12px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 600
                  }}
                >
                  <option value={118}>118 баллов (Отличный)</option>
                  <option value={98}>98 баллов (Средний)</option>
                  <option value={75}>75 баллов (Базовый)</option>
                </select>
              </div>
            </div>

            {/* TAB 1: PROFILE SETUP */}
            {activeTab === 'profile' && (
              <div>
                <h2 style={{ fontSize: '24px', margin: '0 0 8px 0', color: '#fff' }}>Анкета абитуриента (Profile Questionnaire)</h2>
                <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '22px' }}>
                  Данные профиля формируют персонализированный путь и скоринг шансов на грант.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                  <div style={{ background: '#162238', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', fontWeight: 700 }}>Возраст и класс</label>
                    <input type="text" defaultValue="17 лет · 11 выпускной класс" style={{ width: '100%', background: '#0d1527', border: '1px solid rgba(255,255,255,0.1)', padding: '9px', borderRadius: '8px', color: '#fff', boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ background: '#162238', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', fontWeight: 700 }}>Направление</label>
                    <input type="text" defaultValue="Computer Science / Software Dev" style={{ width: '100%', background: '#0d1527', border: '1px solid rgba(255,255,255,0.1)', padding: '9px', borderRadius: '8px', color: '#fff', boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ background: '#162238', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', fontWeight: 700 }}>Текущий балл ЕНТ / GPA</label>
                    <input type="text" defaultValue={`ЕНТ: ${untScore} / 140 · GPA: 4.8`} readOnly style={{ width: '100%', background: '#0d1527', border: '1px solid rgba(255,255,255,0.1)', padding: '9px', borderRadius: '8px', color: '#38bdf8', fontWeight: 700, boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ background: '#162238', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', fontWeight: 700 }}>Языковой сертификат</label>
                    <input type="text" defaultValue="IELTS: 7.0 (Цель: 7.5)" style={{ width: '100%', background: '#0d1527', border: '1px solid rgba(255,255,255,0.1)', padding: '9px', borderRadius: '8px', color: '#fff', boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ background: '#162238', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', fontWeight: 700 }}>Желаемые страны</label>
                    <input type="text" defaultValue="Казахстан, Германия, Польша" style={{ width: '100%', background: '#0d1527', border: '1px solid rgba(255,255,255,0.1)', padding: '9px', borderRadius: '8px', color: '#fff', boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ background: '#162238', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', fontWeight: 700 }}>Особые критерии</label>
                    <input type="text" defaultValue="Военная кафедра, Общежитие" style={{ width: '100%', background: '#0d1527', border: '1px solid rgba(255,255,255,0.1)', padding: '9px', borderRadius: '8px', color: '#fff', boxSizing: 'border-box' }} />
                  </div>
                </div>
                <div style={{ marginTop: '24px', textAlign: 'right' }}>
                  <button
                    onClick={() => setActiveTab('diagnosis')}
                    style={{
                      background: 'linear-gradient(135deg, #2652B9, #FE7505)',
                      border: 'none',
                      color: '#fff',
                      padding: '12px 24px',
                      borderRadius: '12px',
                      fontWeight: 700,
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    Сформировать диагностику →
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: DIAGNOSIS */}
            {activeTab === 'diagnosis' && (
              <div>
                <h2 style={{ fontSize: '24px', margin: '0 0 8px 0', color: '#fff' }}>AI-диагностика профиля (Diagnosis)</h2>
                <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '22px' }}>
                  Объективная оценка профиля алгоритмом UniFlow.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '22px' }}>
                  <div style={{ background: '#162238', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Академическая сила</div>
                    <div style={{ fontSize: '26px', fontWeight: 800, color: '#38bdf8', margin: '4px 0' }}>{untScore >= 110 ? '90%' : untScore >= 90 ? '78%' : '62%'}</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>ЕНТ {untScore} баллов + GPA 4.8</div>
                  </div>
                  <div style={{ background: '#162238', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Языковая готовность</div>
                    <div style={{ fontSize: '26px', fontWeight: 800, color: '#4ade80', margin: '4px 0' }}>85%</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>IELTS 7.0 покрывает 90% программ</div>
                  </div>
                  <div style={{ background: '#162238', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Бюджетный фит</div>
                    <div style={{ fontSize: '26px', fontWeight: 800, color: budget >= 8000 ? '#FE7505' : '#f43f5e', margin: '4px 0' }}>
                      {budget >= 20000 ? '98%' : budget >= 8000 ? '92%' : '65%'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>${budget} / год</div>
                  </div>
                  <div style={{ background: '#162238', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Уверенность в оффере</div>
                    <div style={{ fontSize: '26px', fontWeight: 800, color: '#a855f7', margin: '4px 0' }}>
                      {untScore >= 110 ? '95%' : '80%'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>Safety-гарантия</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                  <div style={{ background: '#162238', padding: '18px', borderRadius: '14px', borderLeft: '4px solid #4ade80' }}>
                    <h3 style={{ fontSize: '15px', color: '#4ade80', margin: '0 0 10px 0' }}>✓ Сильные стороны (Strengths)</h3>
                    <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: '#cbd5e1', lineHeight: 1.6 }}>
                      <li>Балл ЕНТ ({untScore}) гарантирует участие в конкурсе государственного гранта.</li>
                      <li>Подтвержденный профиль по математике и информатике.</li>
                      <li>Английский IELTS 7.0 снимает любые языковые барьеры.</li>
                    </ul>
                  </div>
                  <div style={{ background: '#162238', padding: '18px', borderRadius: '14px', borderLeft: '4px solid #FE7505' }}>
                    <h3 style={{ fontSize: '15px', color: '#FE7505', margin: '0 0 10px 0' }}>⚠ Ограничения и риски (Constraints)</h3>
                    <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: '#cbd5e1', lineHeight: 1.6 }}>
                      <li>При бюджете ${budget} зарубежные программы требуют обязательной стипендии DAAD/Erasmus.</li>
                      <li>Критично подать заявление на военную кафедру до 15 июня.</li>
                      <li>Высокая конкуренция на гранты по специальности Computer Science.</li>
                    </ul>
                  </div>
                </div>

                <div style={{ textAlign: 'right', marginTop: '20px' }}>
                  <button
                    onClick={() => setActiveTab('recommendations')}
                    style={{
                      background: 'linear-gradient(135deg, #2652B9, #FE7505)',
                      border: 'none',
                      color: '#fff',
                      padding: '12px 24px',
                      borderRadius: '12px',
                      fontWeight: 700,
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    Посмотреть рекомендованные ВУЗы →
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: RECOMMENDATIONS */}
            {activeTab === 'recommendations' && (
              <div>
                <h2 style={{ fontSize: '24px', margin: '0 0 8px 0', color: '#fff' }}>Рекомендации университетов (Matches)</h2>
                <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '20px' }}>
                  Подобрано минимум 3 варианта с прозрачным объяснением причин.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {universitiesData.map((uni) => {
                    let score = uni.matchScore;
                    let badgeColor = '#4ade80';
                    let category = uni.category;

                    if (untScore < uni.minUnt) {
                      score -= 22;
                      badgeColor = '#FE7505';
                      category = 'Reach (Рискованный по баллам)';
                    }
                    if (uni.tuitionUSD > budget && budget > 0) {
                      score -= 12;
                    }

                    return (
                      <div key={uni.id} style={{ background: '#162238', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                          <div>
                            <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>{uni.location}</div>
                            <h3 style={{ fontSize: '19px', color: '#fff', margin: 0 }}>{uni.name}</h3>
                            <div style={{ fontSize: '14px', color: '#38bdf8', marginTop: '2px' }}>{uni.program}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ display: 'inline-block', background: `${badgeColor}22`, color: badgeColor, border: `1px solid ${badgeColor}`, fontSize: '13px', fontWeight: 800, padding: '5px 12px', borderRadius: '20px' }}>
                              {score}% Match · {category}
                            </span>
                            <div style={{ fontSize: '13px', color: '#cbd5e1', marginTop: '6px', fontWeight: 600 }}>{uni.tuition}</div>
                          </div>
                        </div>

                        <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '14px', borderRadius: '10px', marginTop: '12px' }}>
                          <strong style={{ color: '#4ade80', fontSize: '12px', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                            Почему это подходит:
                          </strong>
                          <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: '#cbd5e1', lineHeight: 1.6 }}>
                            {uni.whyFits.map((w, i) => (
                              <li key={i}>{w}</li>
                            ))}
                          </ul>
                          <div style={{ marginTop: '8px', fontSize: '12px', color: '#fbbf24' }}>
                            <strong>⚠ Обратить внимание:</strong> {uni.concern}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div style={{ textAlign: 'right', marginTop: '24px' }}>
                  <button
                    onClick={() => setActiveTab('compare')}
                    style={{
                      background: 'linear-gradient(135deg, #2652B9, #FE7505)',
                      border: 'none',
                      color: '#fff',
                      padding: '12px 24px',
                      borderRadius: '12px',
                      fontWeight: 700,
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    Сравнить выбранные ВУЗы →
                  </button>
                </div>
              </div>
            )}

            {/* TAB 4: COMPARE */}
            {activeTab === 'compare' && (
              <div>
                <h2 style={{ fontSize: '24px', margin: '0 0 8px 0', color: '#fff' }}>Сравнение программ (Comparison)</h2>
                <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '20px' }}>
                  Сопоставление вариантов по ключевым для студента критериям.
                </p>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid rgba(255, 255, 255, 0.15)', color: '#94a3b8' }}>
                        <th style={{ padding: '12px' }}>Критерий</th>
                        <th style={{ padding: '12px', color: '#38bdf8', fontSize: '14px' }}>Astana IT University (AITU)</th>
                        <th style={{ padding: '12px', color: '#a855f7', fontSize: '14px' }}>КБТУ (Алматы)</th>
                        <th style={{ padding: '12px', color: '#4ade80', fontSize: '14px' }}>TUM (Мюнхен, Германия)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                        <td style={{ padding: '12px', fontWeight: 700, color: '#94a3b8' }}>Категория шансов</td>
                        <td style={{ padding: '12px', color: '#4ade80', fontWeight: 700 }}>Safety (94% Match)</td>
                        <td style={{ padding: '12px', color: '#38bdf8', fontWeight: 700 }}>Target (88% Match)</td>
                        <td style={{ padding: '12px', color: '#FE7505', fontWeight: 700 }}>Reach (78% Match)</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                        <td style={{ padding: '12px', fontWeight: 700, color: '#94a3b8' }}>Стоимость / Грант</td>
                        <td style={{ padding: '12px', color: '#fff' }}>100% Госгрант РК доступен</td>
                        <td style={{ padding: '12px', color: '#fff' }}>Госгрант / 2.4 млн KZT</td>
                        <td style={{ padding: '12px', color: '#fff' }}>Бесплатное обучение (€0)</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                        <td style={{ padding: '12px', fontWeight: 700, color: '#94a3b8' }}>Минимальный ЕНТ</td>
                        <td style={{ padding: '12px', color: '#cbd5e1' }}>100 (у вас {untScore} ✓)</td>
                        <td style={{ padding: '12px', color: '#cbd5e1' }}>110 (у вас {untScore} ✓)</td>
                        <td style={{ padding: '12px', color: '#cbd5e1' }}>IELTS 6.5+ & TestAS</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                        <td style={{ padding: '12px', fontWeight: 700, color: '#94a3b8' }}>Военная кафедра</td>
                        <td style={{ padding: '12px', color: '#4ade80' }}>Есть ✓</td>
                        <td style={{ padding: '12px', color: '#4ade80' }}>Есть ✓</td>
                        <td style={{ padding: '12px', color: '#64748b' }}>Нет (за рубежом)</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                        <td style={{ padding: '12px', fontWeight: 700, color: '#94a3b8' }}>Общежитие</td>
                        <td style={{ padding: '12px', color: '#4ade80' }}>Гарантировано 1 курсу ✓</td>
                        <td style={{ padding: '12px', color: '#38bdf8' }}>По конкурсу баллов</td>
                        <td style={{ padding: '12px', color: '#cbd5e1' }}>Studentenwerk München</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div style={{ textAlign: 'right', marginTop: '24px' }}>
                  <button
                    onClick={() => setActiveTab('roadmap')}
                    style={{
                      background: 'linear-gradient(135deg, #2652B9, #FE7505)',
                      border: 'none',
                      color: '#fff',
                      padding: '12px 24px',
                      borderRadius: '12px',
                      fontWeight: 700,
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    Посмотреть дорожную карту →
                  </button>
                </div>
              </div>
            )}

            {/* TAB 5: ROADMAP */}
            {activeTab === 'roadmap' && (
              <div>
                <h2 style={{ fontSize: '24px', margin: '0 0 8px 0', color: '#fff' }}>Персональный Roadmap поступления</h2>
                <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '20px' }}>
                  Пошаговый план по фазам: экзамены, документы, дедлайны и подача заявок.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {[
                    {
                      phase: "Фаза 1: Подготовка и Экзамены (Сентябрь – Январь)",
                      status: "В процессе",
                      items: [
                        { text: "Регистрация на официальный экзамен IELTS (цель: 7.5+)", deadline: "20 сентября 2026", done: isActionDone },
                        { text: "Прохождение пробного тестирования ЕНТ (целевой балл: 125+)", deadline: "15 ноября 2026", done: false },
                        { text: "Подготовка академической выписки (транскрипта) за 10–11 класс", deadline: "10 декабря 2026", done: false }
                      ]
                    },
                    {
                      phase: "Фаза 2: Документы и Портфолио (Февраль – Апрель)",
                      status: "Запланировано",
                      items: [
                        { text: "Написание мотивационного письма (Personal Statement)", deadline: "1 марта 2027", done: false },
                        { text: "Сбор рекомендательных писем от преподавателей физики и математики", deadline: "20 марта 2027", done: false },
                        { text: "Формирование портфолио IT-проектов и побед в хакатонах", deadline: "15 апреля 2027", done: false }
                      ]
                    },
                    {
                      phase: "Фаза 3: Подача заявок и конкурс Грантов (Май – Июль)",
                      status: "Запланировано",
                      items: [
                        { text: "Сдача основного ЕНТ", deadline: "Май – Июнь 2027", done: false },
                        { text: "Подача на конкурс государственного образовательного гранта РК", deadline: "13–20 июля 2027", done: false },
                        { text: "Подача документов на военную кафедру AITU / КБТУ", deadline: "25 июля 2027", done: false }
                      ]
                    }
                  ].map((p, idx) => (
                    <div key={idx} style={{ background: '#162238', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '14px', padding: '18px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <h4 style={{ fontSize: '15px', color: '#fff', margin: 0 }}>{p.phase}</h4>
                        <span style={{ fontSize: '12px', color: '#38bdf8', background: 'rgba(56, 189, 248, 0.1)', padding: '3px 10px', borderRadius: '20px' }}>
                          {p.status}
                        </span>
                      </div>
                      <div>
                        {p.items.map((it, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255, 255, 255, 0.04)', fontSize: '13px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                              <input type="checkbox" defaultChecked={it.done} />
                              <span style={{ textDecoration: it.done ? 'line-through' : 'none', color: it.done ? '#64748b' : '#cbd5e1' }}>
                                {it.text}
                              </span>
                            </label>
                            <span style={{ color: '#94a3b8', fontSize: '12px' }}>{it.deadline}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ textAlign: 'right', marginTop: '24px' }}>
                  <button
                    onClick={() => setActiveTab('action')}
                    style={{
                      background: 'linear-gradient(135deg, #2652B9, #FE7505)',
                      border: 'none',
                      color: '#fff',
                      padding: '12px 24px',
                      borderRadius: '12px',
                      fontWeight: 700,
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    Посмотреть ближайший шаг (Next Action) →
                  </button>
                </div>
              </div>
            )}

            {/* TAB 6: NEXT ACTION */}
            {activeTab === 'action' && (
              <div>
                <h2 style={{ fontSize: '24px', margin: '0 0 8px 0', color: '#fff' }}>Ближайший шаг (Next Action)</h2>
                <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '20px' }}>
                  Один чётко выделенный шаг с фиксацией прогресса.
                </p>

                <div style={{ background: '#162238', border: '2px solid #FE7505', borderRadius: '18px', padding: '24px', boxShadow: '0 10px 30px rgba(254, 117, 5, 0.15)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ background: '#FE7505', color: '#fff', fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      Критический приоритет
                    </span>
                    <span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 600 }}>Дедлайн: <strong style={{ color: '#fff' }}>20 сентября 2026</strong></span>
                  </div>

                  <h3 style={{ fontSize: '20px', color: '#fff', margin: '0 0 10px 0' }}>Зарегистрироваться на официальный экзамен IELTS</h3>
                  <p style={{ fontSize: '14px', color: '#cbd5e1', lineHeight: 1.6, marginBottom: '20px' }}>
                    <strong>Почему именно сейчас:</strong> Ваш текущий пробный балл 7.0 достаточен для AITU, но подтвержденный сертификат 7.5 откроет подачу на грантовую квоту в КБТУ и стипендию TUM.
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                      onClick={() => setIsActionDone(!isActionDone)}
                      style={{
                        background: isActionDone ? '#64748b' : '#4ade80',
                        border: 'none',
                        color: '#040915',
                        padding: '11px 22px',
                        borderRadius: '10px',
                        fontWeight: 700,
                        fontSize: '14px',
                        cursor: 'pointer'
                      }}
                    >
                      {isActionDone ? '✓ Выполнено (отменить)' : '✓ Отметить как выполнено'}
                    </button>
                    <button
                      onClick={() => alert('Регистрация открыта на сайте British Council и InterPress Казахстан. Необходим действующий загранпаспорт.')}
                      style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        color: '#fff',
                        padding: '11px 18px',
                        borderRadius: '10px',
                        fontSize: '14px',
                        cursor: 'pointer'
                      }}
                    >
                      Инструкция и требования
                    </button>
                  </div>
                </div>

                {isActionDone && (
                  <div style={{ background: 'rgba(74, 222, 128, 0.12)', border: '1px solid #4ade80', color: '#4ade80', padding: '14px', borderRadius: '12px', marginTop: '16px', fontSize: '13px' }}>
                    ✓ Отлично! Шаг выполнен. Следующее действие разблокировано: «Подготовка мотивационного эссе для стипендиального комитета (дедлайн 15 октября)».
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating notification for personalization updates */}
      {showNotification && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: '#FE7505',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: '10px',
            fontWeight: 700,
            fontSize: '13px',
            zIndex: 9999999,
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)'
          }}
        >
          ✓ Рекомендации и Roadmap обновлены под новые параметры профиля!
        </div>
      )}
    </div>
  );
}
