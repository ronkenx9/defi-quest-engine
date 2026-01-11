'use client';

import { AuthProvider } from '../../contexts/AuthContext';

export default function LoginLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Login page only needs AuthProvider, not AuthGuard
    return <AuthProvider>{children}</AuthProvider>;
}
