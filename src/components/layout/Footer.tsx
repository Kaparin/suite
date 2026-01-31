'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'

export function Footer() {
  const t = useTranslations('footer')

  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="relative border-t border-gray-800/50 bg-gray-950/80 backdrop-blur-sm mt-auto z-20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo & Copyright */}
          <div className="flex items-center gap-3">
            <Image
              src="/axiome-launch-suite-logo.png"
              alt="Axiome Launch Suite"
              width={120}
              height={40}
              className="h-8 w-auto object-contain opacity-70"
            />
            <span className="text-gray-500 text-sm">
              © {new Date().getFullYear()}
            </span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6">
            <Link
              href="https://axiome.pro"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white text-sm transition-colors"
            >
              Axiome
            </Link>
            <Link
              href="https://docs.axiomeinfo.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white text-sm transition-colors"
            >
              Docs
            </Link>
            <Link
              href="https://t.me/axiome"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white text-sm transition-colors"
            >
              Telegram
            </Link>
            <Link
              href="https://github.com/axiome-pro"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white text-sm transition-colors"
            >
              GitHub
            </Link>
          </div>

          {/* Disclaimer */}
          <p className="text-gray-500 text-xs text-center md:text-right max-w-xs">
            {t('disclaimer')}
          </p>
        </div>
      </div>
    </motion.footer>
  )
}
