# UniFlow — AI-Powered Admission Platform

**UniFlow** — персональный навигатор поступления для учеников 10–11 классов Казахстана. Сервис превращает профиль абитуриента в объяснимый выбор программ, рассчитывает совместимость (Fit Score), формирует персональный Roadmap и предоставляет рекомендации AI-консультанта.

> Profile → Diagnosis → Match Engine → Fit Score & Breakdown → Program Comparison → Personalized Roadmap → Actionable Milestones → AI Advisor

---

## 🚀 Быстрый запуск для разработчика и AI-ассистента (Quickstart Guide)

### Требования
- **Node.js**: >= 20.x
- **npm**: >= 10.x
- **Git**

### 1. Установка зависимостей
```bash
npm install
```

### 2. Настройка переменных окружения
Создайте файл `.env.local` в корне проекта (см. `.env.example`):
```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-supabase-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
GEMINI_API_KEY=<your-gemini-api-key>
GEMINI_MODEL=gemini-2.5-flash
```

`GEMINI_API_KEY` используется только серверным API route. Не добавляйте к нему
префикс `NEXT_PUBLIC_`: такой префикс встраивает секрет в браузерный bundle.

Для облачного сохранения профиля выполните миграцию
`supabase/migrations/202609190001_create_uniflow_profiles.sql` через Supabase SQL Editor.
Без миграции и без авторизации приложение продолжает безопасно работать через
`localStorage`.

### 3. Запуск dev-сервера
```bash
npm run dev
```
Откройте [http://localhost:3000](http://localhost:3000) в браузере.

### 4. Сборка и проверка типов
```bash
npm run build
```
Сборка выполняет проверку TypeScript и Turbopack-оптимизацию.

---

## 🏗 Архитектура проекта

```
LOCUS/
├── app/
│   ├── api/
│   │   └── ai-advisor/
│   │       └── route.ts         # Serverless API endpoint для Gemini AI Advisor
│   ├── globals.css              # Глобальные стили приложения
│   ├── landing.css              # Дизайн-система и стили лендинга
│   ├── layout.tsx               # Root Layout (шрифты, метатеги)
│   └── page.tsx                 # Главная точка входа (рендерит AdmissionApp)
├── components/
│   ├── admission-app.tsx        # Главный контроллер состояния (State Manager & Router)
│   ├── landing-page.tsx         # Премиальный интерактивный лендинг
│   └── screens/
│       ├── auth-modal.tsx       # Модальное окно авторизации (Supabase Auth + Google OAuth)
│       ├── compare-screen.tsx   # Детальное сравнение 2-х программ
│       ├── dashboard-screen.tsx # Профиль пользователя и трекер прогресса
│       ├── roadmap-screen.tsx   # Интерактивный Roadmap с чек-листом
│       ├── survey-screen.tsx    # 5-шаговая анкета абитуриента
│       ├── universities-screen.tsx # Каталог и фильтр университетов
│       └── results-screen.tsx   # Результаты мэтчинга и карточки вузов
├── lib/
│   ├── gemini.ts                # Интеграция с Google Gemini API
│   ├── locale.ts                # Поддерживаемые локали RU / ҚАЗ / EN
│   ├── matching.ts              # Детерминированный движок расчета совместимости
│   ├── supabase.ts              # Клиент Supabase Auth & Database
│   ├── types.ts                 # TypeScript типы и интерфейсы
│   └── university-catalog.server.ts # Серверный поиск и ранжирование каталога CSV
├── data/
│   └── kazakhstan-universities.csv  # 106 вузов Казахстана
├── supabase/migrations/         # Таблица профилей и RLS-политики
└── public/
    └── assets/                  # Оптимизированные статические медиа-ресурсы
```

---

## 🔑 Ключевые модули

### 1. Авторизация (Supabase Auth)
- Реализована в `components/screens/auth-modal.tsx` и `lib/supabase.ts`.
- Поддерживает вход/регистрацию по Email/Паролю и **Google OAuth**.
- Подписка на изменение состояния сессии (`onAuthStateChange`) в реальном времени.
- При входе в хедере отображается аватар и профиль пользователя с выпадающим меню.

### 2. Matching Engine (Движок подбора)
- Детерминированный многокритериальный алгоритм (`lib/matching.ts`):
  - **Academic Fit (25%)**: Баллы ЕНТ, профильные предметы (Физ-Мат, Инф-Мат), GPA.
  - **Program Fit (25%)**: Соответствие IT-специализации (SE, CS, AI, Cyber).
  - **Budget Fit (20%)**: Соответствие стоимости обучения и шансы на грант.
  - **Language Fit (10%)**: Английский, казахский, русский, IELTS/TOEFL.
  - **Location Fit (10%)**: Астана, Алматы, готовность к переезду.
  - **Preference Fit (10%)**: Военная кафедра, общежитие, стажировки.
- Для каждого результата формируется прозрачный breakdown с плюсами и зонами роста.

### 3. AI Advisor (ИИ-консультант)
- Маршрут `app/api/ai-advisor/route.ts` на базе Gemini API.
- Анализирует профиль абитуриента и генерирует персонализированные советы по улучшению шансов на поступление и получение гранта.
- Получает от сервера только отобранных кандидатов из CSV и не должен рекомендовать
  университеты за пределами каталога.
- System instruction запрещает выдумывать стоимость, требования и гарантии гранта,
  а также требует явно помечать неизвестные данные.
- Язык ответа совпадает с выбранным языком интерфейса: русский, қазақша или English.

### 4. Каталог университетов
- `data/kazakhstan-universities.csv` содержит 106 уникальных организаций из
  официального списка вузов Казахстана.
- 17 вузов дополнены программными данными, которые уже использовались в UniFlow;
  для отсутствующих фактов используется `unknown`, без догадок.
- Источники: [официальный список вузов](https://www.gov.kz/article/657) и
  [реестр открытых данных](https://data.egov.kz/datasets/view?index=onirler_oblystar_kalalar_boi7).

### 5. Локализация
- Провайдер и словари находятся в `components/i18n-provider.tsx`.
- Выбранная локаль сохраняется в `localStorage` и передаётся в AI API.

---

## 🛠 Руководство для AI-ассистентов при доработке (AI Guide)

1. **Сохранение дизайна**:
   - Основная дизайн-система и токены описаны в `app/landing.css` и `app/globals.css`.
   - Не заменяйте существующие классы ad-hoc стилями, сохраняйте визуальную целостность.
2. **Управление экранами**:
   - Навигация между экранами (`landing`, `survey`, `results`, `compare`, `roadmap`, `dashboard`, `universities`) управляется состоянием `currentScreen` в `components/admission-app.tsx`.
3. **Безопасность**:
   - Не коммитьте секретные ключи (`.env.local` находится в `.gitignore`).
4. **Проверка**:
   - Перед завершением любой задачи всегда запускайте `npm run build` для валидации TypeScript и Turbopack.
   - Сквозной браузерный тест запускается командой `node scripts/smoke.mjs` при
     работающем приложении на `http://127.0.0.1:4173`.

---

## 👥 Команда
- **Проект**: UniFlow
- **Кейс**: Персональный маршрут поступления (Казахстан)
