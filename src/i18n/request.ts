import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'
import { defaultLocale, locales, type Locale } from './config'

// Import all messages statically to avoid dynamic import issues in production
import en from '../../messages/en.json'
import ru from '../../messages/ru.json'
import de from '../../messages/de.json'
import zh from '../../messages/zh.json'
import he from '../../messages/he.json'

const messages: Record<Locale, typeof en> = {
  en,
  ru,
  de,
  zh,
  he,
}

export default getRequestConfig(async () => {
  let locale: Locale = defaultLocale

  try {
    const cookieStore = await cookies()
    const localeCookie = cookieStore.get('locale')?.value as Locale | undefined
    if (localeCookie && locales.includes(localeCookie)) {
      locale = localeCookie
    }
  } catch (error) {
    // Cookies might not be available in some contexts, use default locale
    console.warn('Could not read locale cookie:', error)
  }

  return {
    locale,
    messages: messages[locale],
  }
})
