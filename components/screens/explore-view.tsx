import React, { useState, useMemo } from "react";
import type { Match, Program, StudentProfile, City, Interest, UntCombination } from "@/lib/types";
import { formatMoney } from "@/lib/matching";
import { ScoreRing } from "@/components/ui/score-ring";
import { ConfidenceBadge } from "@/components/ui/confidence-badge";
import { SearchIcon, BookmarkIcon, FilterIcon, MapPinIcon, Chevron } from "@/components/ui/icons";
import { useI18n } from "@/components/i18n-provider";

export function ExploreView({
  matches,
  profile,
  shortlistIds,
  onToggleShortlist,
  onViewProgram,
  onCompareProgram,
}: {
  matches: Match[];
  profile: StudentProfile;
  shortlistIds: string[];
  onToggleShortlist: (programId: string) => void;
  onViewProgram: (programId: string) => void;
  onCompareProgram: (programId: string) => void;
}) {
  const { t, tr } = useI18n();
  const [search, setSearch] = useState("");
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [selectedInterest, setSelectedInterest] = useState<string>("all");
  const [selectedComb, setSelectedComb] = useState<string>("all");
  const [maxBudget, setMaxBudget] = useState<number>(0);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"fit" | "price-asc" | "price-desc" | "unt">("fit");

  const filteredMatches = useMemo(() => {
    return matches
      .filter((m) => {
        // Search
        if (search.trim()) {
          const q = search.toLowerCase();
          const matchesSearch =
            m.program.university.toLowerCase().includes(q) ||
            m.program.shortName.toLowerCase().includes(q) ||
            m.program.program.toLowerCase().includes(q) ||
            m.program.city.toLowerCase().includes(q) ||
            m.program.code.toLowerCase().includes(q) ||
            m.program.highlights.some((h) => h.toLowerCase().includes(q));
          if (!matchesSearch) return false;
        }
        // City
        if (selectedCity !== "all" && m.program.city !== selectedCity) return false;
        // Interest
        if (selectedInterest !== "all" && !m.program.interests.includes(selectedInterest as Interest)) return false;
        // UNT Combination
        if (selectedComb !== "all" && !m.program.untCombinations.includes(selectedComb as UntCombination)) return false;
        // Budget
        if (maxBudget > 0 && m.program.tuitionKzt > maxBudget) return false;
        // Language
        if (selectedLanguage !== "all" && m.program.language !== selectedLanguage) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "fit") return b.score - a.score;
        if (sortBy === "price-asc") return a.program.tuitionKzt - b.program.tuitionKzt;
        if (sortBy === "price-desc") return b.program.tuitionKzt - a.program.tuitionKzt;
        if (sortBy === "unt") return (b.program.untPaid ?? 50) - (a.program.untPaid ?? 50);
        return 0;
      });
  }, [matches, search, selectedCity, selectedInterest, selectedComb, maxBudget, selectedLanguage, sortBy]);

  const resetFilters = () => {
    setSearch("");
    setSelectedCity("all");
    setSelectedInterest("all");
    setSelectedComb("all");
    setMaxBudget(0);
    setSelectedLanguage("all");
    setSortBy("fit");
  };

  return (
    <div className="explore-page container">
      {/* Header */}
      <div className="section-heading-block">
        <div className="eyebrow-pill">
          <SearchIcon size={14} /> {t("explore.kicker")}
        </div>
        <h1>{t("explore.title")}</h1>
        <p className="subtitle">
          {t("explore.description")} ({matches.length})
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="explore-filters-card card-glass">
        <div className="search-input-wrapper">
          <SearchIcon size={18} />
          <input
            type="text"
            placeholder={tr("Поиск по вузу, специальности, шифру (напр. B057, ИИ, КБТУ, Алматы, GameLab)...")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="explore-search-input"
          />
          {search && (
            <button className="clear-search-btn" onClick={() => setSearch("")}>
              ✕
            </button>
          )}
        </div>

        <div className="filters-row">
          {/* City */}
          <div className="filter-item">
            <label>{tr("Город кампуса:")}</label>
            <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)}>
              <option value="all">{tr("Все города РК")}</option>
              <option value="Астана">Астана</option>
              <option value="Алматы">Алматы</option>
              <option value="Каскелен">Каскелен (SDU)</option>
              <option value="Караганда">Караганда</option>
              <option value="Шымкент">Шымкент</option>
              <option value="Актобе">Актобе</option>
            </select>
          </div>

          {/* Interest */}
          <div className="filter-item">
            <label>{tr("Направление:")}</label>
            <select value={selectedInterest} onChange={(e) => setSelectedInterest(e.target.value)}>
              <option value="all">{tr("Все специальности")}</option>
              <optgroup label="IT & Искусственный интеллект">
                <option value="computer-science">Computer Science (Компьютерные науки)</option>
                <option value="software-engineering">Software Engineering (Разработка ПО)</option>
                <option value="data-science">Data Science & AI (Данные и ИИ)</option>
                <option value="cybersecurity">Cybersecurity (Кибербезопасность)</option>
                <option value="ai-robotics">AI & Robotics (ИИ и робототехника)</option>
              </optgroup>
              <optgroup label="Медицина & Здравоохранение">
                <option value="medicine-general">Общая медицина & Хирургия</option>
                <option value="biomedicine-pharma">Фармация & Биомедицина</option>
              </optgroup>
              <optgroup label="Бизнес, Финансы & Экономика">
                <option value="finance-fintech">Финансы, Финтех & Инвестиции</option>
                <option value="business-mgmt">Международный менеджмент & Бизнес</option>
                <option value="economics">Экономика & Аналитика</option>
              </optgroup>
              <optgroup label="Право & Международные отношения">
                <option value="law-jurisprudence">Юриспруденция & Международное право</option>
                <option value="international-relations">Международные отношения & Дипломатия</option>
                <option value="psychology-hr">Психология & HR</option>
              </optgroup>
              <optgroup label="Инженерия & Производство">
                <option value="petroleum-mining">Нефтегазовое дело & Энергетика</option>
                <option value="robotics-mechatronics">Мехатроника & Робототехника</option>
                <option value="architecture-civil">Архитектура & Строительство</option>
              </optgroup>
              <optgroup label="Дизайн, Медиа & Креатив">
                <option value="design-multimedia">Графический & Digital дизайн</option>
                <option value="ui-ux-product">UI/UX & Product Design</option>
                <option value="journalism-media">Медиа, Журналистика & PR</option>
                <option value="gamedev">Game Development & 3D</option>
              </optgroup>
              <optgroup label="Естественные науки & Языки">
                <option value="applied-math">Прикладная математика & Статистика</option>
                <option value="linguistics-translation">Переводческое дело & Языки</option>
              </optgroup>
            </select>
          </div>

          {/* UNT Combination */}
          <div className="filter-item">
            <label>{tr("Предметы ЕНТ:")}</label>
            <select value={selectedComb} onChange={(e) => setSelectedComb(e.target.value)}>
              <option value="all">{tr("Любая комбинация")}</option>
              <option value="Математика + Информатика">Математика + Информатика (IT/ИИ)</option>
              <option value="Математика + Физика">Математика + Физика (Инженерия/Архитектура)</option>
              <option value="Математика + География">Математика + География (Бизнес/Финансы)</option>
              <option value="Биология + Химия">Биология + Химия (Медицина/Фармация)</option>
              <option value="Иностранный язык + Всемирная история">Иностранный язык + Всемирная история (МО/Дипломатия/Перевод)</option>
              <option value="Всемирная история + Основы права">Всемирная история + Основы права (Юриспруденция)</option>
              <option value="Творческий экзамен">Творческий экзамен (Дизайн/Архитектура)</option>
            </select>
          </div>

          {/* Budget */}
          <div className="filter-item">
            <label>{tr("Бюджет до:")}</label>
            <select value={maxBudget} onChange={(e) => setMaxBudget(Number(e.target.value))}>
              <option value={0}>{tr("Любая стоимость")}</option>
              <option value={1500000}>до 1.5 млн ₸ (доступные)</option>
              <option value={2500000}>до 2.5 млн ₸ (средний сегмент)</option>
              <option value={3500000}>до 3.5 млн ₸ (премиум)</option>
            </select>
          </div>

          {/* Language */}
          <div className="filter-item">
            <label>{tr("Язык обучения:")}</label>
            <select value={selectedLanguage} onChange={(e) => setSelectedLanguage(e.target.value)}>
              <option value="all">{tr("Любой язык")}</option>
              <option value="Казахский / русский">Казахский / русский</option>
              <option value="Английский">Английский</option>
              <option value="Смешанный">Смешанный</option>
            </select>
          </div>

          {/* Sort */}
          <div className="filter-item sort-item">
            <label>{tr("Сортировка:")}</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
              <option value="fit">{tr("По совпадению с профилем")}</option>
              <option value="price-asc">Сначала доступные по цене</option>
              <option value="price-desc">Сначала дорогие</option>
              <option value="unt">По порогу ЕНТ</option>
            </select>
          </div>
        </div>

        <div className="filter-meta-bar">
          <span className="results-count">
            {tr("Найдено программ:")} <b>{filteredMatches.length}</b> {tr("из")} {matches.length}
          </span>
          {(search || selectedCity !== "all" || selectedInterest !== "all" || selectedComb !== "all" || maxBudget > 0 || selectedLanguage !== "all") && (
            <button className="text-button reset-filter-btn" onClick={resetFilters}>
              {tr("Сбросить фильтры")}
            </button>
          )}
        </div>
      </div>

      {/* Grid of Program Cards */}
      {filteredMatches.length > 0 ? (
        <div className="explore-grid">
          {filteredMatches.map((match) => {
            const isBookmarked = shortlistIds.includes(match.program.id);
            const isAffordable = profile.onlyGrant ? match.program.scholarship : match.program.tuitionKzt <= profile.budget;

            return (
              <div className="explore-card card-glass" key={match.program.id}>
                <div className="explore-card-top">
                  <span className="uni-mark">{match.program.shortName.slice(0, 2)}</span>
                  <div className="explore-card-badges">
                    <ScoreRing value={match.score} size="tiny" />
                    <button
                      className={`bookmark-btn ${isBookmarked ? "active" : ""}`}
                      onClick={() => onToggleShortlist(match.program.id)}
                      title={isBookmarked ? "Убрать из шорт-листа" : "Сохранить в шорт-лист"}
                    >
                      <BookmarkIcon filled={isBookmarked} size={16} />
                    </button>
                  </div>
                </div>

                <div className="explore-card-content">
                  <div className="card-location">
                    <MapPinIcon size={12} /> {match.program.city} • {tr(match.program.duration)} • <span className="lang-pill">{tr(match.program.language)}</span>
                  </div>
                  <h3 className="card-uni-title">{match.program.university}</h3>
                  <h4 className="card-program-title">{match.program.program}</h4>

                  {/* UNT combinations pill */}
                  <div className="card-unt-comb">
                    <span>ЕНТ: {match.program.untCombinations.join(" / ")}</span>
                  </div>

                  <div className="card-tags">
                    {match.program.highlights.slice(0, 3).map((tag) => (
                      <span className="tag-pill" key={tag}>
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="card-finance-box">
                    <div>
                      <small>Стоимость:</small>
                      <strong>{match.program.tuitionLabel}</strong>
                    </div>
                    <ConfidenceBadge confidence={match.program.tuitionConfidence} />
                  </div>

                  <div className="card-criteria-preview">
                    <span>
                      {tr("Порог ЕНТ:")} <b>{match.program.untPaid ? `${match.program.untPaid}+` : tr("уточнить")}</b>
                    </span>
                    <span className={isAffordable ? "text-success" : "text-warning"}>
                      {profile.onlyGrant
                        ? "✓ Есть гранты МОН"
                        : isAffordable
                        ? `✓ ${tr("В бюджете")}`
                        : `! ${tr("Выше лимита")}`}
                    </span>
                  </div>
                </div>

                <div className="explore-card-actions">
                  <button
                    className="button outline small full-width"
                    onClick={() => onViewProgram(match.program.id)}
                  >
                    {tr("Подробнее о вузе")}
                  </button>
                  <button
                    className="button subtle small"
                    onClick={() => onCompareProgram(match.program.id)}
                    title="Сравнить эту программу"
                  >
                    {tr("Сравнить")}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state-card card-glass">
          <div className="empty-icon" style={{ fontSize: "32px", opacity: 0.3, marginBottom: "12px" }}>—</div>
          <h3>Ничего не найдено по выбранным фильтрам</h3>
          <p>Попробуй расширить диапазон бюджета, выбрать другой город или комбинацию предметов ЕНТ.</p>
          <button className="button primary" onClick={resetFilters}>
            Показать все программы
          </button>
        </div>
      )}
    </div>
  );
}
