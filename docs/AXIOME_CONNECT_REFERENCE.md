# Axiome Connect API — полная справка

> Реверс-инжиниринг из исходного кода app.axiometrade.pro (Nuxt.js бандлы)

---

## 1. API Базовые URL

| Среда | URL |
|-------|-----|
| **Production** | `https://api-idx.axiomechain.pro` |
| **Devnet** | `https://dev-idx.axiomechain.pro` |
| **Testnet** | `https://test-idx.axiomechain.pro` |
| **Chain REST** | `https://api-chain.axiomechain.org` |
| **Fallback 1** | `https://aback-d.ru` |
| **Fallback 2** | `https://idx.ambdmn.com` |

При запуске приложение проверяет доступность URL по списку `KNOWN_URLS` и автоматически переключается на работающий.

---

## 2. Axiome Connect — подписание транзакций

### 2.1 Протоколы deep link

- **`axiomesign://`** — для обычных транзакций (отправка, стейкинг, создание токена)
- **`axiomesignswap://`** — для свопов (может содержать несколько сообщений)

### 2.2 Формат payload

```json
{
  "type": "cosmwasm_execute",
  "network": "axiome-1",
  "contract_addr": "axm1...",
  "funds": [{"denom": "uaxm", "amount": "1000000"}],
  "msg": {"stake": {}},
  "memo": "optional memo"
}
```

Типы транзакций:
- `cosmwasm_execute` — выполнение контракта
- `cosmwasm_instantiate` — создание контракта/токена
- `bank_send` — отправка нативных токенов

### 2.3 Кодирование

```js
const deepLink = `axiomesign://${Buffer.from(JSON.stringify(payload)).toString("base64")}`
```

### 2.4 API эндпоинты подписания

#### POST `/connect/sign`
Отправить запрос на подписание. Возвращает короткий ID транзакции.

```js
// Запрос
POST /connect/sign
Content-Type: application/json
{ "payload": "axiomesign://eyJ0eXBlI..." }

// Ответ — ID транзакции (24 hex символа, MongoDB ObjectId)
"69b0374804fcff812b6bd492"
```

#### GET `/connect/sign/{transactionId}`
Проверить статус подписания.

```js
// Ответ
{
  "status": "new",      // new | broadcast | result | cancel | error
  "payload": "..."      // при status=result содержит JSON с transactionHash
}
```

Статусы:
| Статус | Описание |
|--------|----------|
| `new` | Запрос отправлен, ожидание кошелька |
| `broadcast` | Кошелёк подписал, транзакция в эфире |
| `result` | Успех, `payload` содержит `{ transactionHash: "..." }` |
| `cancel` | Пользователь отменил |
| `error` | Ошибка транзакции |

#### PUT `/connect/sign/status`
Обновить статус (например, отменить).

```js
PUT /connect/sign/status
Content-Type: application/json
{ "id": "69b0374804fcff812b6bd492", "status": "cancel" }
```

### 2.5 Поллинг
- Интервал: **10 секунд**
- Таймаут: **5 минут** (300 000 мс)
- При закрытии модалки со статусом `new` — отправить cancel

### 2.6 Многошаговые транзакции (свопы)
Для свопов могут быть 2 сообщения:
1. **Allowance** (CW20 approve) — отдельный QR
2. **Swap** — основная транзакция

```js
// messages[0] = allowance, messages[1] = swap
const allowanceQR = `axiomesign://${btoa(JSON.stringify(messages[0]))}`
const swapQR = `axiomesign://${btoa(JSON.stringify(messages[1]))}`
```

---

## 3. Axiome Connect — сессии и авторизация

### POST `/connect/create_token`
Генерация токена авторизации. Принимает адрес кошелька.

### GET `/connect/auth_token`
Получить текущий auth token.

### GET `/connect/get_token_info`
Информация о токене авторизации.

### GET `/connect/sessions/`
Список активных сессий.

### POST `/connect/sessions/close`
Закрыть сессию.

---

## 4. Аккаунты

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/accounts/info/{address}` | Информация об аккаунте |
| POST | `/accounts/register` | Регистрация |
| GET | `/accounts/register/validate/nick` | Проверка никнейма |
| GET | `/accounts/register/validate/email` | Проверка email |
| DELETE | `/accounts/remove_user` | Удаление профиля |
| POST | `/accounts/restore_user` | Восстановление |
| GET/POST | `/accounts/email/` | Операции с email |
| GET/POST | `/accounts/telegram` | Telegram привязка |
| POST | `/accounts/profile-image` | Смена аватара |
| POST | `/accounts/nickname` | Смена никнейма |
| POST | `/accounts/login` | Отправка данных устройства |
| GET | `/accounts/exists/{address}` | Проверка существования адреса |
| GET | `/accounts/buylink/{address}` | Ссылки на покупку |
| GET | `/accounts/allbuylinks/` | Все ссылки на покупку |

---

## 5. CW20 токены

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/cw20/` | Информация о CW20 |
| POST | `/cw20/create` | Создание CW20 токена |
| GET | `/cw20/tokens` | Список токенов |

---

## 6. Транзакции и операции

| Путь | Описание |
|------|----------|
| `/transactions/paginate` | Пагинированный список транзакций |
| `/operations/{address}` | История операций |
| `/operations/daily/sum/` | Дневная сумма операций |
| `/tron/transactions/` | Tron транзакции |
| `/ethereum/transactions/` | Ethereum транзакции |

---

## 7. Валидаторы и стейкинг

| Путь | Описание |
|------|----------|
| `/validators/stacking` | Информация о валидаторах |

---

## 8. Рынок и курсы

| Путь | Описание |
|------|----------|
| `/app/rates` | Курсы обмена |
| `/chart/` | Данные для графиков |
| `/app/settings` | Настройки приложения |

---

## 9. Прочее

| Путь | Описание |
|------|----------|
| `/app/log_event` | Логирование событий |
| `/promo/code/` | Промокоды |
| `/multichain/watch` | Мультичейн мониторинг |
| `/static/terms_of_use` | Условия использования |
| `/tron/proxy` | Прокси для Tron |

---

## 10. Конфигурация сети

```js
// HD Path для Axiome
hdPath: "m/44'/546'/0'/0/0"

network: {
  name: "axiome",
  alias: "axiome_chain",
  pubkeyhash: 0,
  privatekey: 128,
  scripthash: 5,
  bech32prefix: "axm"
}
```

---

## 11. Стек официального приложения

- **Framework**: Nuxt.js 3 (Vue 3)
- **State**: Pinia stores
- **Mobile**: Capacitor (гибридное приложение)
- **QR**: QRCodeVue3
- **Realtime**: Socket.io
- **HTTP**: Axios
- **Analytics**: Yandex Metrika
- **i18n**: en, ru, de, fr, tr

---

## 12. Кошелёк (Wallet Store)

```js
// Pinia store: "wallet"
{
  wallet: localStorage("walletStrategy"),
  walletConnectStatus: "Idle",
  addresses: [],
  nexdexAddress: "",
  addressConfirmation: "",
  connected: localStorage("walletConnected"),
  address: localStorage("walletAddress"),
  profile: {
    nickname: "",
    img: "",
    referrerAddress: "",
    referrerNickname: ""
  },
  displayedTokens: localStorage("displayedTokens"),
  // ...balances, chart data, swap pairs, etc.
}

// Проверка подключения
isUserWalletConnected = !!address && !!addressConfirmation
                       && addresses.length > 0 && !!nexdexAddress
```

Кошелёк работает через мнемоническую фразу (seed phrase), которая шифруется и хранится локально в браузере.

---

## 13. Explorer

- Транзакции: `https://axiomechain.pro/transactions/{txHash}`
- Валидаторы: `https://explorer.nexdex.pro/validators`

---

## 14. Ссылки на скачивание Axiome Wallet

- **iOS**: https://apps.apple.com/app/axiome-wallet/id6502285079
- **Android**: https://play.google.com/store/apps/details?id=club.relounge.axiomewallet
- **TestFlight**: https://testflight.apple.com/join/Bjz0XZ5v
