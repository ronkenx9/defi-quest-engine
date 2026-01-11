import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: 'DeFi Quest Admin',
    description: 'Admin dashboard for DeFi Quest Engine',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className="font-sans antialiased" suppressHydrationWarning>
                {children}
            </body>
        </html>
    );
}
