# Axiome Launch Suite

## О проекте
Платформа для создания и продвижения токенов на блокчейне Axiome.

## Модули
- **Token Studio** — AI-помощник для генерации токеномики, описания, плана запуска
- **Auto Landing Pages** — автоматические лендинги для каждого токена `/t/[address]`
- **Token Explorer** — таблица токенов с рейтингом и риск-флагами
- **Telegram Bot** — алерты, карточки токенов, создание через чат
- **Premium** — платная подписка (больше AI-запросов, продвинутые алерты)

## Стек
- Next.js 16 (App Router) + TypeScript
- Tailwind CSS
- Prisma + PostgreSQL (Supabase)
- Telegram Bot (grammy)
- OpenAI API (gpt-4o-mini для free, gpt-4o для premium)

## Структура страниц
- `/` — главная
- `/explorer` — таблица токенов
- `/t/[address]` — лендинг токена
- `/studio` — Token Studio (AI генерация)

## API эндпоинты
- `/api/projects` — CRUD проектов
- `/api/ai/generate` — AI генерация контента
- `/api/tokens/metrics` — метрики токенов

## Axiome интеграция
- Создание токенов через handoff на Token Lab: https://app.axiometrade.pro/pump/token-lab
- В будущем: Axiome Connect (axiomesign://) для подписи без приватных ключей
- Данные блокчейна через публичный gateway или свою ноду

## Важные правила
- НИКОГДА не просить приватные ключи пользователей
- Подписи только через кошелёк пользователя
- Антискам: флаги риска, модерация, дисклеймеры

## Команды
```bash
npm run dev      # запуск dev сервера
npm run build    # сборка
npm run lint     # линтер
```

## Переменные окружения (.env)
- DATABASE_URL — PostgreSQL connection string
- OPENAI_API_KEY — ключ OpenAI
- TELEGRAM_BOT_TOKEN — токен Telegram бота
