import './globals.css';
import type { Metadata } from 'next';
import PlayerWrapper from '@/components/PlayerWrapper';
import Script from 'next/script';

export const metadata: Metadata = {
    title: 'Matrix Protocol - Player Portal',
    description: 'Complete DeFi missions, earn XP, and mint NFT achievement badges.',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600;700&display=swap"
                    rel="stylesheet"
                />
                <Script id="collision-shield" strategy="beforeInteractive">
                    {`
                    (function() {
                      try {
                        if (typeof window !== 'undefined' && !window.ethereum) {
                          // Pre-emptively define ethereum as configurable to avoid "Cannot redefine property" errors
                          // caused by conflicting wallet extensions (like Bybit/OKX)
                          Object.defineProperty(window, 'ethereum', {
                            value: undefined,
                            writable: true,
                            configurable: true
                          });
                        }
                      } catch (e) {
                        // Silent catch - we just want to avoid the crash
                      }
                    })();
                    `}
                </Script>
            </head>
            <body className="bg-[#050507] text-white antialiased">
                <PlayerWrapper>
                    {children}
                </PlayerWrapper>
            </body>
        </html>
    );
}
