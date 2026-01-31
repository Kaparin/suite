'use client'

import { FloatingParticles } from '@/components/animations/FloatingParticles'
import { GlowingOrb } from '@/components/animations/GlowingOrb'
import { StarField } from '@/components/animations/StarField'
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
              
              {/* Cyan-blue glow layer - different shade */}
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
              
              {/* Inner soft core - bright white glow */}
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

      {/* Features Section */}
      <section className="relative z-20 py-12 border-t border-gray-800/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-3xl md:text-4xl font-bold text-center mb-8"
          >
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              {t('features.title')}
            </span>
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 - AI Studio */}
            <motion.div
              variants={featureCardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              whileHover={{ y: -10, transition: { duration: 0.3 } }}
              className="group relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative bg-gray-900/50 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-8 hover:border-blue-500/50 transition-all duration-500">
                <motion.div
                  whileHover={{ rotate: 360, scale: 1.1 }}
                  transition={{ duration: 0.6 }}
                  className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/30"
                >
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </motion.div>
                <h3 className="text-2xl font-semibold mb-3 text-white group-hover:text-blue-300 transition-colors">
                  {t('features.studio.title')}
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  {t('features.studio.description')}
                </p>
              </div>
            </motion.div>

            {/* Feature 2 - Landing Pages */}
            <motion.div
              variants={featureCardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              whileHover={{ y: -10, transition: { duration: 0.3 } }}
              className="group relative md:mt-12"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative bg-gray-900/50 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-8 hover:border-purple-500/50 transition-all duration-500">
                <motion.div
                  whileHover={{ rotate: 360, scale: 1.1 }}
                  transition={{ duration: 0.6 }}
                  className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-purple-500/30"
                >
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                  </svg>
                </motion.div>
                <h3 className="text-2xl font-semibold mb-3 text-white group-hover:text-purple-300 transition-colors">
                  {t('features.landing.title')}
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  {t('features.landing.description')}
                </p>
              </div>
            </motion.div>

            {/* Feature 3 - Explorer */}
            <motion.div
              variants={featureCardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              whileHover={{ y: -10, transition: { duration: 0.3 } }}
              className="group relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-green-600/20 to-emerald-600/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative bg-gray-900/50 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-8 hover:border-green-500/50 transition-all duration-500">
                <motion.div
                  whileHover={{ rotate: 360, scale: 1.1 }}
                  transition={{ duration: 0.6 }}
                  className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-green-500/30"
                >
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </motion.div>
                <h3 className="text-2xl font-semibold mb-3 text-white group-hover:text-green-300 transition-colors">
                  {t('features.explorer.title')}
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  {t('features.explorer.description')}
                </p>
              </div>
            </motion.div>
          </div>
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
              >
                <Link href="/studio">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="inline-block"
                  >
                    <Button size="lg" className="px-10 py-5 text-xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-500 hover:via-purple-500 hover:to-pink-500 border-0 shadow-2xl shadow-purple-500/30">
                      {tCommon('startBuilding')}
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
