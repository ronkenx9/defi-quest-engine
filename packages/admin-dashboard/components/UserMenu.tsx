'use client';

import { useState, useRef, useEffect } from 'react';
import { LogOut, ChevronDown } from 'lucide-react';

export function UserMenu() {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 p-3 w-full rounded-xl bg-surface-1 border border-white/[0.06] hover:border-primary/20 transition-all group"
            >
                {/* Avatar */}
                <div className="w-9 h-9 rounded-lg bg-glow-gradient flex items-center justify-center text-black font-bold text-sm">
                    AD
                </div>

                {/* Info */}
                <div className="flex-1 text-left min-w-0">
                    <p className="text-xs text-gray-500 font-medium">Signed in as</p>
                    <p className="text-sm text-white truncate">Admin</p>
                </div>

                {/* Chevron */}
                <ChevronDown
                    size={16}
                    className={`text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute bottom-full left-0 right-0 mb-2 py-2 rounded-xl bg-surface-1 border border-white/[0.08] shadow-xl animate-fade-in z-50">
                    <button
                        onClick={() => setIsOpen(false)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                    >
                        <LogOut size={16} />
                        <span className="text-sm font-medium">Sign Out</span>
                    </button>
                </div>
            )}
        </div>
    );
}
