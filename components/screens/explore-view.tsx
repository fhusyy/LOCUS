import React, { useState, useMemo } from "react";
import type { Match, Program, StudentProfile, City, Interest, UntCombination } from "@/lib/types";
import { formatMoney } from "@/lib/matching";
import { ScoreRing } from "@/components/ui/score-ring";
import { ConfidenceBadge } from "@/components/ui/confidence-badge";
import { SearchIcon, BookmarkIcon, FilterIcon, MapPinIcon, Chevron } from "@/components/ui/icons";
import { useI18n } from "@/components/i18n-provider";
import { localizeDisplay } from "@/lib/display-localization";

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
  const { t, tr, locale } = useI18n();
  const ld = (value: string) => localizeDisplay(value, locale);
  const label = (ru: string, en: string, kk: string) => locale === "en" ? en : locale === "kk" ? kk : ru;
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
              <option value="Астана">{ld("Астана")}</option>
              <option value="Алматы">{ld("Алматы")}</option>
              <option value="Каскелен">{ld("Каскелен")} (SDU)</option>
              <option value="Караганда">{ld("Караганда")}</option>
              <option value="Шымкент">{ld("Шымкент")}</option>
              <option value="Актобе">{ld("Актобе")}</option>
            </select>
          </div>

          {/* Interest */}
          <div className="filter-item">
            <label>{tr("Направление:")}</label>
            <select value={selectedInterest} onChange={(e) => setSelectedInterest(e.target.value)}>
              <option value="all">{tr("Все специальности")}</option>
              <optgroup label={label("IT & Искусственный интеллект", "IT & Artificial Intelligence", "IT және жасанды интеллект")}>
                <option value="computer-science">Computer Science</option>
                <option value="software-engineering">Software Engineering</option>
                <option value="data-science">Data Science & AI</option>
                <option value="cybersecurity">Cybersecurity</option>
                <option value="ai-robotics">AI & Robotics</option>
              </optgroup>
              <optgroup label={label("Медицина & Здравоохранение", "Medicine & Healthcare", "Медицина және денсаулық сақтау")}>
                <option value="medicine-general">{label("Общая медицина & Хирургия", "General Medicine & Surgery", "Жалпы медицина және хирургия")}</option>
                <option value="biomedicine-pharma">{label("Фармация & Биомедицина", "Pharmacy & Biomedicine", "Фармация және биомедицина")}</option>
              </optgroup>
              <optgroup label={label("Бизнес, Финансы & Экономика", "Business, Finance & Economics", "Бизнес, қаржы және экономика")}>
                <option value="finance-fintech">{label("Финансы, Финтех & Инвестиции", "Finance, FinTech & Investment", "Қаржы, финтех және инвестициялар")}</option>
                <option value="business-mgmt">{label("Международный менеджмент & Бизнес", "International Management & Business", "Халықаралық менеджмент және бизнес")}</option>
                <option value="economics">{label("Экономика & Аналитика", "Economics & Analytics", "Экономика және аналитика")}</option>
              </optgroup>
              <optgroup label={label("Право & Международные отношения", "Law & International Relations", "Құқық және халықаралық қатынастар")}>
                <option value="law-jurisprudence">{label("Юриспруденция & Международное право", "Law & International Law", "Құқықтану және халықаралық құқық")}</option>
                <option value="international-relations">{label("Международные отношения & Дипломатия", "International Relations & Diplomacy", "Халықаралық қатынастар және дипломатия")}</option>
                <option value="psychology-hr">{label("Психология & HR", "Psychology & HR", "Психология және HR")}</option>
              </optgroup>
              <optgroup label={label("Инженерия & Производство", "Engineering & Manufacturing", "Инженерия және өндіріс")}>
                <option value="petroleum-mining">{label("Нефтегазовое дело & Энергетика", "Petroleum Engineering & Energy", "Мұнай-газ ісі және энергетика")}</option>
                <option value="robotics-mechatronics">{label("Мехатроника & Робототехника", "Mechatronics & Robotics", "Мехатроника және робототехника")}</option>
                <option value="architecture-civil">{label("Архитектура & Строительство", "Architecture & Civil Engineering", "Сәулет және құрылыс")}</option>
              </optgroup>
              <optgroup label={label("Дизайн, Медиа & Креатив", "Design, Media & Creative", "Дизайн, медиа және шығармашылық")}>
                <option value="design-multimedia">{label("Графический & Digital дизайн", "Graphic & Digital Design", "Графикалық және цифрлық дизайн")}</option>
                <option value="ui-ux-product">UI/UX & Product Design</option>
                <option value="journalism-media">{label("Медиа, Журналистика & PR", "Media, Journalism & PR", "Медиа, журналистика және PR")}</option>
                <option value="gamedev">Game Development & 3D</option>
              </optgroup>
              <optgroup label={label("Естественные науки & Языки", "Natural Sciences & Languages", "Жаратылыстану ғылымдары және тілдер")}>
                <option value="applied-math">{label("Прикладная математика & Статистика", "Applied Mathematics & Statistics", "Қолданбалы математика және статистика")}</option>
                <option value="linguistics-translation">{label("Переводческое дело & Языки", "Translation & Languages", "Аударма ісі және тілдер")}</option>
              </optgroup>
            </select>
          </div>

          {/* UNT Combination */}
          <div className="filter-item">
            <label>{tr("Предметы ЕНТ:")}</label>
            <select value={selectedComb} onChange={(e) => setSelectedComb(e.target.value)}>
              <option value="all">{tr("Любая комбинация")}</option>
              <option value="Математика + Информатика">{ld("Математика + Информатика")}</option>
              <option value="Математика + Физика">{ld("Математика + Физика")}</option>
              <option value="Математика + География">{ld("Математика + География")}</option>
              <option value="Биология + Химия">{ld("Биология + Химия")}</option>
              <option value="Иностранный язык + Всемирная история">{ld("Иностранный язык + Всемирная история")}</option>
              <option value="Всемирная история + Основы права">{ld("Всемирная история + Основы права")}</option>
              <option value="Творческий экзамен">{ld("Творческий экзамен")}</option>
            </select>
          </div>

          {/* Budget */}
          <div className="filter-item">
            <label>{tr("Бюджет до:")}</label>
            <select value={maxBudget} onChange={(e) => setMaxBudget(Number(e.target.value))}>
              <option value={0}>{tr("Любая стоимость")}</option>
              <option value={1500000}>{label("до 1.5 млн ₸ (доступные)", "up to 1.5M ₸ (affordable)", "1.5 млн ₸ дейін (қолжетімді)")}</option>
              <option value={2500000}>{label("до 2.5 млн ₸ (средний сегмент)", "up to 2.5M ₸ (mid-range)", "2.5 млн ₸ дейін (орта сегмент)")}</option>
              <option value={3500000}>{label("до 3.5 млн ₸ (премиум)", "up to 3.5M ₸ (premium)", "3.5 млн ₸ дейін (премиум)")}</option>
            </select>
          </div>

          {/* Language */}
          <div className="filter-item">
            <label>{tr("Язык обучения:")}</label>
            <select value={selectedLanguage} onChange={(e) => setSelectedLanguage(e.target.value)}>
              <option value="all">{tr("Любой язык")}</option>
              <option value="Казахский / русский">{ld("Казахский / русский")}</option>
              <option value="Английский">{ld("Английский")}</option>
              <option value="Смешанный">{ld("Смешанный")}</option>
            </select>
          </div>

          {/* Sort */}
          <div className="filter-item sort-item">
            <label>{tr("Сортировка:")}</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
              <option value="fit">{tr("По совпадению с профилем")}</option>
              <option value="price-asc">{label("Сначала доступные по цене", "Lowest tuition first", "Алдымен қолжетімділері")}</option>
              <option value="price-desc">{label("Сначала дорогие", "Highest tuition first", "Алдымен қымбаттары")}</option>
              <option value="unt">{label("По порогу ЕНТ", "By UNT threshold", "ҰБТ шегі бойынша")}</option>
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
                      title={isBookmarked ? tr("Убрать из шорт-листа") : tr("Сохранить в шорт-лист")}
                    >
                      <BookmarkIcon filled={isBookmarked} size={16} />
                    </button>
                  </div>
                </div>

                <div className="explore-card-content">
                  <div className="card-location">
                    <MapPinIcon size={12} /> {ld(match.program.city)} • {ld(match.program.duration)} • <span className="lang-pill">{ld(match.program.language)}</span>
                  </div>
                  <h3 className="card-uni-title">{match.program.university}</h3>
                  <h4 className="card-program-title">{ld(match.program.program)}</h4>

                  {/* UNT combinations pill */}
                  <div className="card-unt-comb">
                    <span>{locale === "kk" ? "ҰБТ" : "UNT"}: {match.program.untCombinations.map(ld).join(" / ")}</span>
                  </div>

                  <div className="card-tags">
                    {match.program.highlights.slice(0, 3).map((tag) => (
                      <span className="tag-pill" key={tag}>
                        {ld(tag)}
                      </span>
                    ))}
                  </div>

                  <div className="card-finance-box">
                    <div>
                      <small>{tr("Стоимость")}:</small>
                      <strong>{ld(match.program.tuitionLabel)}</strong>
                    </div>
                    <ConfidenceBadge confidence={match.program.tuitionConfidence} />
                  </div>

                  <div className="card-criteria-preview">
                    <span>
                      {tr("Порог ЕНТ:")} <b>{match.program.untPaid ? `${match.program.untPaid}+` : tr("уточнить")}</b>
                    </span>
                    <span className={isAffordable ? "text-success" : "text-warning"}>
                      {profile.onlyGrant
                        ? `✓ ${tr("Есть гранты МОН")}`
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
                    title={tr("Сравнить эту программу")}
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
          <h3>{tr("Ничего не найдено по выбранным фильтрам")}</h3>
          <p>{tr("Попробуй расширить диапазон бюджета, выбрать другой город или комбинацию предметов ЕНТ.")}</p>
          <button className="button primary" onClick={resetFilters}>
            {tr("Показать все программы")}
          </button>
        </div>
      )}
    </div>
  );
}
