export const locales = ['en', 'ru', 'de', 'zh', 'he'] as const
export type Locale = (typeof locales)[number]

export const localeNames: Record<Locale, string> = {
  en: 'English',
  ru: 'Русский',
  de: 'Deutsch',
  zh: '中文',
  he: 'עברית',
}

export const localeFlags: Record<Locale, string> = {
  en: '🇺🇸',
  ru: '🇷🇺',
  de: '🇩🇪',
  zh: '🇨🇳',
  he: '🇮🇱',
}

// RTL languages
export const rtlLocales: Locale[] = ['he']

export function isRtl(locale: Locale): boolean {
  return rtlLocales.includes(locale)
}

export const defaultLocale: Locale = 'en'
