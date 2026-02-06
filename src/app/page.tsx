'use client'

import { FloatingParticles } from '@/components/animations/FloatingParticles'
import { GlowingOrb } from '@/components/animations/GlowingOrb'
import { StarField } from '@/components/animations/StarField'
import { AXMPriceTicker } from '@/components/price/AXMPriceTicker'
import { Button } from '@/components/ui'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import Link from 'next/link'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.3,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
  },
}

const featureCardVariants = {
  hidden: { opacity: 0, y: 50, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
  },
}

export default function HomePage() {
  const t = useTranslations('home')
  const tCommon = useTranslations('common')

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Animated Background */}
      <StarField />
      <FloatingParticles count={40} />

      {/* Glowing Orbs */}
      <GlowingOrb color="blue" size="xl" className="-top-32 -left-32" delay={0} />
      <GlowingOrb color="purple" size="lg" className="top-1/4 -right-20" delay={2} />
      <GlowingOrb color="cyan" size="md" className="bottom-1/4 left-1/4" delay={4} />
      <GlowingOrb color="pink" size="lg" className="-bottom-20 right-1/3" delay={1} />

      {/* Hero Section */}
      <section className="relative z-20 pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="text-center max-w-4xl mx-auto relative z-20"
          >
            {/* Logo animation */}
            <motion.div
              variants={itemVariants}
              className="mb-6 relative z-20"
            >
              <motion.div
                animate={{
                  filter: [
                    'drop-shadow(0 0 20px rgba(59, 130, 246, 0.4))',
                    'drop-shadow(0 0 40px rgba(147, 51, 234, 0.5))',
                    'drop-shadow(0 0 20px rgba(59, 130, 246, 0.4))',
                  ],
                }}
                transition={{ duration: 3, repeat: Infinity }}
                className="inline-block bg-transparent shadow-none relative z-10"
                style={{ background: 'transparent', boxShadow: 'none' }}
              >
                <Image
                  src="/axiome-launch-suite-logo.png"
                  alt="Axiome Launch Suite"
                  width={700}
                  height={252}
                  className="h-60 sm:h-80 md:h-96 w-auto object-contain bg-transparent relative z-10"
                  priority
                  style={{ background: 'transparent', boxShadow: 'none' }}
                />
              </motion.div>

              {/* Soft blue glow - breathing effect */}
              <motion.div
                className="absolute left-1/2 -translate-x-1/2 top-full w-[700px] sm:w-[950px] md:w-[1150px] flame-glow-outer"
                style={{
                  background: 'radial-gradient(ellipse at center top, rgba(147, 197, 253, 0.4) 0%, rgba(99, 102, 241, 0.35) 20%, rgba(147, 51, 234, 0.25) 50%, transparent 100%)',
                  filter: 'blur(20px)',
                  clipPath: 'polygon(49.5% 0%, 50.5% 0%, 70% 100%, 30% 100%)',
                  zIndex: 0,
                  height: '800px',
                }}
                animate={{
                  opacity: [0.6, 0.9, 0.6],
                  scale: [1, 1.08, 1],
                  filter: ['blur(20px)', 'blur(25px)', 'blur(20px)'],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />

              {/* Additional soft layer for depth */}
              <motion.div
                className="absolute left-1/2 -translate-x-1/2 top-full w-[680px] sm:w-[920px] md:w-[1100px] flame-glow-outer"
                style={{
                  background: 'radial-gradient(ellipse at center top, rgba(191, 219, 254, 0.5) 0%, rgba(147, 197, 253, 0.4) 30%, rgba(99, 102, 241, 0.3) 60%, transparent 100%)',
                  filter: 'blur(15px)',
                  clipPath: 'polygon(49.5% 0%, 50.5% 0%, 65% 100%, 35% 100%)',
                  zIndex: 0,
                  height: '800px',
                }}
                animate={{
                  opacity: [0.5, 0.75, 0.5],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: 0.5,
                }}
              />

              {/* Cyan-blue glow layer */}
              <motion.div
                className="absolute left-1/2 -translate-x-1/2 top-full w-[720px] sm:w-[980px] md:w-[1200px] flame-glow-outer"
                style={{
                  background: 'radial-gradient(ellipse at center top, rgba(59, 130, 246, 0.35) 0%, rgba(37, 99, 235, 0.3) 25%, rgba(29, 78, 216, 0.2) 50%, rgba(30, 64, 175, 0.1) 75%, transparent 100%)',
                  filter: 'blur(22px)',
                  clipPath: 'polygon(49.5% 0%, 50.5% 0%, 75% 100%, 25% 100%)',
                  zIndex: 0,
                  height: '800px',
                }}
                animate={{
                  opacity: [0.4, 0.7, 0.4],
                  scale: [1, 1.12, 1],
                  filter: ['blur(22px)', 'blur(28px)', 'blur(22px)'],
                }}
                transition={{
                  duration: 3.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: 1,
                }}
              />

              {/* Inner soft core */}
              <motion.div
                className="absolute left-1/2 -translate-x-1/2 top-full w-[625px] sm:w-[833px] md:w-[1000px] flame-glow-inner"
                style={{
                  background: 'linear-gradient(to bottom, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0.95) 2%, rgba(255, 255, 255, 0.85) 5%, rgba(191, 219, 254, 0.8) 10%, rgba(147, 197, 253, 0.6) 25%, rgba(99, 102, 241, 0.4) 45%, rgba(147, 51, 234, 0.2) 65%, rgba(99, 102, 241, 0.1) 80%, rgba(99, 102, 241, 0.05) 90%, rgba(99, 102, 241, 0.02) 95%, transparent 100%)',
                  filter: 'blur(12px)',
                  clipPath: 'polygon(45% 0%, 55% 0%, 100% 100%, 0% 100%)',
                  zIndex: 1,
                  boxShadow: '0 0 40px rgba(255, 255, 255, 0.5), 0 0 60px rgba(255, 255, 255, 0.3), 0 0 80px rgba(147, 197, 253, 0.2)',
                  height: '800px',
                  transformOrigin: 'top',
                }}
                animate={{
                  opacity: [0.9, 1, 0.9],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            </motion.div>

            {/* Title with gradient animation */}
            <motion.h1
              variants={itemVariants}
              className="text-4xl sm:text-5xl md:text-7xl font-bold mb-4 relative z-30"
            >
              <motion.span
                className="inline-block bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent"
                animate={{
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                }}
                transition={{ duration: 5, repeat: Infinity }}
                style={{ backgroundSize: '200% 200%' }}
              >
                {t('hero.title')}
              </motion.span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              variants={itemVariants}
              className="text-lg sm:text-xl text-gray-400 mb-8 max-w-2xl mx-auto leading-relaxed relative z-30"
            >
              {t('hero.subtitle')}
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-30"
            >
              <Link href="/studio">
                <motion.div
                  whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(59, 130, 246, 0.5)' }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button size="lg" className="px-8 py-4 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 border-0 shadow-xl shadow-blue-500/30">
                    {tCommon('createToken')}
                  </Button>
                </motion.div>
              </Link>
              <Link href="/explorer">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button variant="outline" size="lg" className="px-8 py-4 text-lg border-gray-600 hover:border-purple-500 hover:bg-purple-500/10">
                    {tCommon('exploreTokens')}
                  </Button>
                </motion.div>
              </Link>
            </motion.div>

            {/* AXM Price Ticker */}
            <motion.div
              variants={itemVariants}
              className="mt-8 flex justify-center relative z-30"
            >
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-6 py-3">
                <AXMPriceTicker showVolume showHighLow />
              </div>
            </motion.div>

            {/* Scroll indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2 }}
              className="mt-10"
            >
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-gray-500"
              >
                <svg className="w-6 h-6 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* About Section */}
      <section className="relative z-20 py-16 border-t border-gray-800/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                {t('about.title')}
              </span>
            </h2>
            <p className="text-lg text-gray-400 mb-6 leading-relaxed">
              {t('about.description')}
            </p>
            <div className="inline-block px-6 py-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl">
              <p className="text-blue-300 font-medium">
                {t('about.highlight')}
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative z-20 py-16 border-t border-gray-800/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold text-center mb-12"
          >
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              {t('howItWorks.title')}
            </span>
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connection line */}
            <div className="hidden md:block absolute top-16 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-blue-500/50 via-purple-500/50 to-pink-500/50" />

            {/* Step 1 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="relative text-center"
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-full flex items-center justify-center border-2 border-blue-500/30 relative z-10 backdrop-blur-sm"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                  1
                </div>
              </motion.div>
              <h3 className="text-xl font-semibold text-white mb-3">{t('howItWorks.steps.create.title')}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{t('howItWorks.steps.create.description')}</p>
            </motion.div>

            {/* Step 2 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="relative text-center"
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-full flex items-center justify-center border-2 border-purple-500/30 relative z-10 backdrop-blur-sm"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/30">
                  <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                  </svg>
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                  2
                </div>
              </motion.div>
              <h3 className="text-xl font-semibold text-white mb-3">{t('howItWorks.steps.community.title')}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{t('howItWorks.steps.community.description')}</p>
            </motion.div>

            {/* Step 3 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="relative text-center"
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-pink-500/20 to-pink-600/20 rounded-full flex items-center justify-center border-2 border-pink-500/30 relative z-10 backdrop-blur-sm"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-pink-600 rounded-full flex items-center justify-center shadow-lg shadow-pink-500/30">
                  <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                  3
                </div>
              </motion.div>
              <h3 className="text-xl font-semibold text-white mb-3">{t('howItWorks.steps.launch.title')}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{t('howItWorks.steps.launch.description')}</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-20 py-16 border-t border-gray-800/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-3xl md:text-4xl font-bold text-center mb-12"
          >
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              {t('features.title')}
            </span>
          </motion.h2>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Feature 1 - AI Studio */}
            <motion.div
              variants={featureCardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              whileHover={{ y: -5, transition: { duration: 0.3 } }}
              className="group relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative bg-gray-900/50 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-8 hover:border-blue-500/50 transition-all duration-500 h-full">
                <div className="flex items-start gap-4 mb-4">
                  <motion.div
                    whileHover={{ rotate: 360, scale: 1.1 }}
                    transition={{ duration: 0.6 }}
                    className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 flex-shrink-0"
                  >
                    <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </motion.div>
                  <div>
                    <h3 className="text-xl font-semibold text-white group-hover:text-blue-300 transition-colors">
                      {t('features.studio.title')}
                    </h3>
                  </div>
                </div>
                <p className="text-gray-400 mb-4 leading-relaxed">
                  {t('features.studio.description')}
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm text-gray-300">
                    <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {t('features.studio.bullets.generate')}
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-300">
                    <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {t('features.studio.bullets.edit')}
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-300">
                    <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {t('features.studio.bullets.promo')}
                  </li>
                </ul>
              </div>
            </motion.div>

            {/* Feature 2 - Explorer */}
            <motion.div
              variants={featureCardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              whileHover={{ y: -5, transition: { duration: 0.3 } }}
              className="group relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-green-600/20 to-emerald-600/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative bg-gray-900/50 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-8 hover:border-green-500/50 transition-all duration-500 h-full">
                <div className="flex items-start gap-4 mb-4">
                  <motion.div
                    whileHover={{ rotate: 360, scale: 1.1 }}
                    transition={{ duration: 0.6 }}
                    className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/30 flex-shrink-0"
                  >
                    <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </motion.div>
                  <div>
                    <h3 className="text-xl font-semibold text-white group-hover:text-green-300 transition-colors">
                      {t('features.explorer.title')}
                    </h3>
                  </div>
                </div>
                <p className="text-gray-400 mb-4 leading-relaxed">
                  {t('features.explorer.description')}
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm text-gray-300">
                    <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {t('features.explorer.bullets.risk')}
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-300">
                    <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {t('features.explorer.bullets.stats')}
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-300">
                    <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {t('features.explorer.bullets.upcoming')}
                  </li>
                </ul>
              </div>
            </motion.div>

            {/* Feature 3 - Ownership */}
            <motion.div
              variants={featureCardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              whileHover={{ y: -5, transition: { duration: 0.3 } }}
              className="group relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative bg-gray-900/50 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-8 hover:border-purple-500/50 transition-all duration-500 h-full">
                <div className="flex items-start gap-4 mb-4">
                  <motion.div
                    whileHover={{ rotate: 360, scale: 1.1 }}
                    transition={{ duration: 0.6 }}
                    className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30 flex-shrink-0"
                  >
                    <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  </motion.div>
                  <div>
                    <h3 className="text-xl font-semibold text-white group-hover:text-purple-300 transition-colors">
                      {t('features.ownership.title')}
                    </h3>
                  </div>
                </div>
                <p className="text-gray-400 mb-4 leading-relaxed">
                  {t('features.ownership.description')}
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm text-gray-300">
                    <svg className="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {t('features.ownership.bullets.claim')}
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-300">
                    <svg className="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {t('features.ownership.bullets.edit')}
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-300">
                    <svg className="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {t('features.ownership.bullets.ai')}
                  </li>
                </ul>
              </div>
            </motion.div>

            {/* Feature 4 - Community */}
            <motion.div
              variants={featureCardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              whileHover={{ y: -5, transition: { duration: 0.3 } }}
              className="group relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-orange-600/20 to-yellow-600/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative bg-gray-900/50 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-8 hover:border-orange-500/50 transition-all duration-500 h-full">
                <div className="flex items-start gap-4 mb-4">
                  <motion.div
                    whileHover={{ rotate: 360, scale: 1.1 }}
                    transition={{ duration: 0.6 }}
                    className="w-14 h-14 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30 flex-shrink-0"
                  >
                    <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </motion.div>
                  <div>
                    <h3 className="text-xl font-semibold text-white group-hover:text-orange-300 transition-colors">
                      {t('features.community.title')}
                    </h3>
                  </div>
                </div>
                <p className="text-gray-400 mb-4 leading-relaxed">
                  {t('features.community.description')}
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm text-gray-300">
                    <svg className="w-4 h-4 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {t('features.community.bullets.comments')}
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-300">
                    <svg className="w-4 h-4 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {t('features.community.bullets.reactions')}
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-300">
                    <svg className="w-4 h-4 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {t('features.community.bullets.alerts')}
                  </li>
                </ul>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* $LAUNCH Token Section */}
      <section className="relative z-20 py-16 border-t border-gray-800/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-600/10 via-orange-600/10 to-red-600/10 rounded-3xl blur-3xl" />

            <div className="relative bg-gray-900/30 backdrop-blur-sm border border-yellow-500/20 rounded-3xl p-8 md:p-12">
              {/* Header */}
              <div className="text-center mb-12">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-yellow-500/30"
                  >
                    <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </motion.div>
                </div>
                <h3 className="text-3xl md:text-4xl font-bold text-white mb-2">{t('token.title')}</h3>
                <span className="inline-block px-4 py-1 bg-yellow-500/20 text-yellow-400 text-sm font-medium rounded-full">{t('token.subtitle')}</span>
                <p className="text-gray-400 mt-4 max-w-2xl mx-auto leading-relaxed">
                  {t('token.description')}
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Left - Holder Benefits */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="bg-gray-800/30 border border-gray-700/50 rounded-2xl p-6"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                      </svg>
                    </div>
                    <h4 className="text-xl font-semibold text-white">{t('token.holdersTitle')}</h4>
                  </div>

                  <ul className="space-y-3">
                    <li className="flex items-start gap-3 text-gray-300">
                      <svg className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>{t('token.features.discount')}</span>
                    </li>
                    <li className="flex items-start gap-3 text-gray-300">
                      <svg className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>{t('token.features.support')}</span>
                    </li>
                    <li className="flex items-start gap-3 text-gray-300">
                      <svg className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>{t('token.features.revenue')}</span>
                    </li>
                    <li className="flex items-start gap-3 text-gray-300">
                      <svg className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>{t('token.features.earlyAccess')}</span>
                    </li>
                  </ul>

                  {/* Revenue Share Highlight */}
                  <div className="mt-6 p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-xl">
                    <h5 className="text-sm font-semibold text-yellow-400 mb-2">{t('token.revenueTitle')}</h5>
                    <p className="text-sm text-gray-400 leading-relaxed">{t('token.revenueDescription')}</p>
                  </div>
                </motion.div>

                {/* Right - Premium Services */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="bg-gray-800/30 border border-gray-700/50 rounded-2xl p-6"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                    </div>
                    <h4 className="text-xl font-semibold text-white">{t('token.servicesTitle')}</h4>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-gray-300">{t('token.services.techSpecs')}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-gray-300">{t('token.services.landing')}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-gray-300">{t('token.services.marketing')}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-gray-300">{t('token.services.support')}</p>
                      </div>
                    </div>
                  </div>

                  {/* Token Visual */}
                  <div className="mt-6 flex justify-center">
                    <motion.div
                      animate={{
                        y: [0, -5, 0],
                        scale: [1, 1.02, 1]
                      }}
                      transition={{ duration: 3, repeat: Infinity }}
                      className="relative"
                    >
                      <div className="w-32 h-32 bg-gradient-to-br from-yellow-500 via-orange-500 to-red-500 rounded-full flex items-center justify-center shadow-xl shadow-yellow-500/30">
                        <div className="w-26 h-26 bg-gray-900/90 rounded-full flex items-center justify-center" style={{ width: '104px', height: '104px' }}>
                          <span className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">$LAUNCH</span>
                        </div>
                      </div>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0"
                      >
                        <div className="absolute top-0 left-1/2 w-2 h-2 bg-yellow-400 rounded-full shadow-lg shadow-yellow-400/50" />
                        <div className="absolute bottom-0 left-1/2 w-1.5 h-1.5 bg-orange-400 rounded-full shadow-lg shadow-orange-400/50" />
                      </motion.div>
                    </motion.div>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative z-20 py-12 border-t border-gray-800/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative text-center"
          >
            {/* Background glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10 rounded-3xl blur-3xl" />

            <div className="relative bg-gray-900/30 backdrop-blur-sm border border-gray-800/50 rounded-3xl p-8 md:p-12">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-3xl md:text-5xl font-bold mb-4"
              >
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {t('cta.title')}
                </span>
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="text-gray-400 mb-8 max-w-xl mx-auto text-lg"
              >
                {t('cta.subtitle')}
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-4"
              >
                <Link href="/studio">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="inline-block"
                  >
                    <Button size="lg" className="px-10 py-5 text-xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-500 hover:via-purple-500 hover:to-pink-500 border-0 shadow-2xl shadow-purple-500/30">
                      {tCommon('createToken')}
                    </Button>
                  </motion.div>
                </Link>
                <Link href="/explorer">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="inline-block"
                  >
                    <Button variant="outline" size="lg" className="px-10 py-5 text-xl border-gray-600 hover:border-purple-500 hover:bg-purple-500/10">
                      {tCommon('exploreTokens')}
                    </Button>
                  </motion.div>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
