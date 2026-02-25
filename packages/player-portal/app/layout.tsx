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
                        if (typeof window !== 'undefined') {
                          var desc = Object.getOwnPropertyDescriptor(window, 'ethereum');
                          if (!desc || desc.configurable) {
                            // Define it as configurable so extensions can't lock it or we can modify it
                            Object.defineProperty(window, 'ethereum', {
                              value: window.ethereum,
                              writable: true,
                              configurable: true,
                              enumerable: true
                            });
                          }
                          
                          // Also shield other common conflict properties
                          ['bybit', 'tronLink', 'okxwallet'].forEach(function(prop) {
                            var pDesc = Object.getOwnPropertyDescriptor(window, prop);
                            if (!pDesc || pDesc.configurable) {
                              Object.defineProperty(window, prop, {
                                value: window[prop],
                                writable: true,
                                configurable: true,
                                enumerable: true
                              });
                            }
                          });
                        }
                      } catch (e) {
                        console.warn('Collision shield adjustment failed:', e);
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
