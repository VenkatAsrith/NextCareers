import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';
import Providers from './providers';
import Navigation from '../components/Navigation';
import ChatWidget from '../components/ChatWidget';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
});

export const metadata: Metadata = {
  title: 'NextCareers - AI Engineering Admission OS',
  description: 'AI-Powered Engineering Admission Operating System for TG EAPCET / EAMCET students. Discover colleges, prioritize options, predict seat probabilities, and optimize your web options counseling strategy.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className={`${outfit.variable} antialiased bg-[#0D0D0D] text-[#F2EFE9]`}>
        <Providers>
          {/* Glowing blur background spots */}
          <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
            <div className="glow-spot top-[-100px] left-[-100px]" />
            <div className="glow-spot bottom-[-200px] right-[-100px]" />
          </div>

          {/* Navigation Bar */}
          <Navigation />

          {/* Main content wrapper */}
          <main className="min-h-screen pt-28 pb-16 relative z-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            {children}
          </main>

          {/* Footer */}
          <footer className="relative z-10 py-8 border-t border-zinc-805 bg-black/40 text-center text-sm text-zinc-500">
            <div className="max-w-7xl mx-auto px-4">
              <p>© {new Date().getFullYear()} NextCareers Admission Operating System. All Rights Reserved.</p>
              <p className="mt-2 text-[11px] text-zinc-600">
                Disclaimer: Seat predictions are based on historical TG EAPCET/EAMCET statistics. Actual allocations may vary.
              </p>
            </div>
          </footer>

          {/* Floating AI Chatbot Assistant */}
          <ChatWidget />
        </Providers>
      </body>
    </html>
  );
}
