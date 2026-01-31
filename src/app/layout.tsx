import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { isRtl, type Locale } from '@/i18n/config';
import { WalletProvider } from '@/lib/wallet';
import { ConnectWalletModal } from '@/components/wallet';

const inter = Inter({
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  title: "Axiome Launch Suite",
  description: "Create, launch and discover tokens on Axiome blockchain. AI-powered token studio with auto-generated landing pages and risk scoring.",
  keywords: ["Axiome", "blockchain", "token", "crypto", "launch", "AI"],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale() as Locale;
  const messages = await getMessages();
  const rtl = isRtl(locale);

  return (
    <html lang={locale} dir={rtl ? 'rtl' : 'ltr'} className="dark">
      <body className={`${inter.className} bg-gray-950 text-white min-h-screen flex flex-col`}>
        <NextIntlClientProvider messages={messages}>
          <WalletProvider>
            <Header />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
            <ConnectWalletModal />
          </WalletProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
