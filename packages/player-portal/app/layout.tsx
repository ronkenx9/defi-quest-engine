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
        <script
          dangerouslySetInnerHTML={{
            __html: `
                    (function() {
                      try {
                        console.log('[CollisionShield] Activating...');
                        var shieldProperty = function(obj, prop) {
                          try {
                            var desc = Object.getOwnPropertyDescriptor(obj, prop);
                            if (!desc || desc.configurable) {
                              Object.defineProperty(obj, prop, {
                                value: obj[prop],
                                writable: true,
                                configurable: true,
                                enumerable: true
                              });
                              console.log('[CollisionShield] Shielded:', prop);
                            }
                          } catch (e) { }
                        };

                        if (typeof window !== 'undefined') {
                          shieldProperty(window, 'ethereum');
                          ['bybit', 'tronLink', 'okxwallet', 'phantom', 'solflare'].forEach(function(p) {
                            shieldProperty(window, p);
                          });
                        }
                      } catch (e) {
                        console.warn('[CollisionShield] Error:', e);
                      }
                    })();
                    `
          }}
        />
      </head>
      <body className="bg-[#050507] text-white antialiased">
        <PlayerWrapper>
          {children}
        </PlayerWrapper>
      </body>
    </html>
  );
}
