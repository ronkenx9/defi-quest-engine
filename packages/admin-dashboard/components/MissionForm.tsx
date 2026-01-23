'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

interface MissionFormData {
    name: string;
    description: string;
    type: string;
    difficulty: string;
    points: number;
    resetCycle: string;
    inputToken?: string;
    outputToken?: string;
    minUsdValue?: number;
    minVolumeUsd?: number;
    streakDays?: number;
    targetPrice?: number;
    priceCondition?: 'above' | 'below';
}

interface MissionFormProps {
    onSubmit: (data: MissionFormData) => void;
    isSubmitting: boolean;
    initialData?: Partial<MissionFormData>;
}

// Unique ID generator for dropdown instances
let dropdownIdCounter = 0;
const getDropdownId = () => `dropdown-${++dropdownIdCounter}`;

// Custom Dropdown using Portal - Bulletproof Implementation
function CustomSelect({
    label,
    value,
    onChange,
    options,
    placeholder = 'Select...'
}: {
    label?: string;
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
    placeholder?: string;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0, width: 0, flipUp: false });

    const triggerRef = useRef<HTMLButtonElement>(null);
    const dropdownId = useRef(getDropdownId());

    const currentLabel = options.find(o => o.value === value)?.label || placeholder;

    // Mount check for Portal
    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    // Calculate position and open - with smart flip detection
    const openDropdown = () => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            const dropdownHeight = 280; // Approximate max height of dropdown
            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;

            // Flip upward if not enough space below but enough above
            const shouldFlipUp = spaceBelow < dropdownHeight && spaceAbove > dropdownHeight;

            setPosition({
                top: shouldFlipUp ? rect.top - 8 : rect.bottom + 8,
                left: rect.left,
                width: rect.width,
                flipUp: shouldFlipUp,
            });
            setIsOpen(true);
        }
    };

    const closeDropdown = () => setIsOpen(false);

    const handleToggle = () => {
        if (isOpen) {
            closeDropdown();
        } else {
            openDropdown();
        }
    };

    // Handle all close triggers
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            // Check if click is on trigger button
            if (triggerRef.current?.contains(target)) return;
            // Check if click is inside the dropdown portal (using data attribute)
            if (target.closest(`[data-dropdown-id="${dropdownId.current}"]`)) return;
            closeDropdown();
        };

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') closeDropdown();
        };

        const handleResize = () => {
            // Recalculate position on resize
            if (triggerRef.current) {
                const rect = triggerRef.current.getBoundingClientRect();
                const dropdownHeight = 280;
                const spaceBelow = window.innerHeight - rect.bottom;
                const spaceAbove = rect.top;
                const shouldFlipUp = spaceBelow < dropdownHeight && spaceAbove > dropdownHeight;

                setPosition({
                    top: shouldFlipUp ? rect.top - 8 : rect.bottom + 8,
                    left: rect.left,
                    width: rect.width,
                    flipUp: shouldFlipUp,
                });
            }
        };

        const handleScroll = (e: Event) => {
            // Close dropdown on scroll, but ignore scroll events from the dropdown itself
            const target = e.target as HTMLElement | null;
            if (target?.closest?.(`[data-dropdown-id="${dropdownId.current}"]`)) return;
            closeDropdown();
        };

        // Use capture phase for reliable detection
        document.addEventListener('mousedown', handleClickOutside, true);
        document.addEventListener('keydown', handleEscape);
        window.addEventListener('resize', handleResize);
        window.addEventListener('scroll', handleScroll, true);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside, true);
            document.removeEventListener('keydown', handleEscape);
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [isOpen]);

    // Select an option
    const handleSelect = (optionValue: string) => {
        onChange(optionValue);
        closeDropdown();
    };

    // Render dropdown via Portal
    const dropdownPortal = isOpen && mounted ? createPortal(
        <div
            data-dropdown-id={dropdownId.current}
            className="fixed bg-surface/95 backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-glass-lg overflow-hidden"
            style={{
                top: position.top,
                left: position.left,
                width: position.width,
                zIndex: 99999,
                transform: position.flipUp ? 'translateY(-100%)' : 'none',
            }}
        >
            <div className="px-4 py-3 bg-surface-1 border-b border-white/[0.06]">
                <span className="text-[10px] text-gray-500 uppercase tracking-[0.15em] font-display font-medium">
                    Select an option
                </span>
            </div>
            <div className="max-h-64 overflow-y-auto py-1.5">
                {options.map((option) => (
                    <button
                        key={option.value}
                        type="button"
                        onClick={() => handleSelect(option.value)}
                        className={`
                            w-full text-left px-4 py-3 text-sm transition-all duration-200
                            flex items-center justify-between gap-3
                            ${value === option.value
                                ? 'bg-primary/12 text-primary font-medium'
                                : 'text-gray-400 hover:bg-surface-2 hover:text-white'}
                        `}
                    >
                        <span>{option.label}</span>
                        {value === option.value && <Check size={16} className="text-primary drop-shadow-[0_0_4px_rgba(199,242,132,0.5)]" />}
                    </button>
                ))}
            </div>
        </div>,
        document.body
    ) : null;

    return (
        <div className="relative">
            {label && (
                <label className="block text-sm font-medium text-gray-400 mb-2 font-display uppercase tracking-wider">
                    {label}
                </label>
            )}
            <button
                ref={triggerRef}
                type="button"
                onClick={handleToggle}
                className={`
                    w-full bg-black/30 border rounded-xl px-4 py-3.5 text-left
                    flex items-center justify-between gap-3 transition-all duration-300
                    ${isOpen
                        ? 'border-primary ring-2 ring-primary/20 shadow-[0_0_20px_rgba(199,242,132,0.15)]'
                        : 'border-white/10 hover:border-white/20'}
                `}
            >
                <span className={value ? 'text-white' : 'text-gray-500'}>
                    {currentLabel}
                </span>
                <ChevronDown
                    size={18}
                    className={`text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-primary' : ''}`}
                />
            </button>
            {dropdownPortal}
        </div>
    );
}

// Wrapper to match the onChange signature expected by form handlers
function SelectField({
    name,
    value,
    onChange,
    options,
    label
}: {
    name: string;
    value: string;
    onChange: (e: { target: { name: string; value: string } }) => void;
    options: { value: string; label: string }[];
    label?: string;
}) {
    return (
        <CustomSelect
            label={label}
            value={value}
            onChange={(newValue) => onChange({ target: { name, value: newValue } })}
            options={options}
        />
    );
}

export function MissionForm({ onSubmit, isSubmitting, initialData }: MissionFormProps) {
    const [formData, setFormData] = useState<MissionFormData>({
        name: initialData?.name || '',
        description: initialData?.description || '',
        type: initialData?.type || 'swap',
        difficulty: initialData?.difficulty || 'easy',
        points: initialData?.points || 50,
        resetCycle: initialData?.resetCycle || 'none',
        inputToken: initialData?.inputToken || '',
        outputToken: initialData?.outputToken || '',
        minUsdValue: initialData?.minUsdValue || 0,
        minVolumeUsd: initialData?.minVolumeUsd || 0,
        streakDays: initialData?.streakDays || 7,
        targetPrice: initialData?.targetPrice || 0,
        priceCondition: initialData?.priceCondition || 'below',
    });

    const handleChange = (e: { target: { name: string; value: string | number } }) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: typeof value === 'string' && !isNaN(Number(value)) && ['points', 'minUsdValue', 'minVolumeUsd', 'streakDays', 'targetPrice'].includes(name)
                ? parseFloat(value) || 0
                : value,
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const sectionClass = "glass-card p-6 border border-white/5 relative";
    const inputClass = "w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300";
    const labelClass = "block text-sm font-medium text-gray-400 mb-2 font-display uppercase tracking-wider";

    return (
        <form onSubmit={handleSubmit} className="space-y-6 pb-32">
            {/* Basic Info */}
            <div className={sectionClass}>
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 opacity-50 pointer-events-none"></div>

                <h3 className="text-xl font-bold font-display text-white mb-6 flex items-center gap-2">
                    <span className="w-1 h-6 bg-primary rounded-full shadow-glow"></span>
                    Basic Information
                </h3>

                <div className="space-y-6 relative z-10">
                    <div>
                        <label className={labelClass}>Mission Name</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="e.g., Swap 1 SOL to USDC"
                            required
                            className={inputClass}
                        />
                    </div>

                    <div>
                        <label className={labelClass}>Description</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Describe what users need to do..."
                            rows={3}
                            className={inputClass}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <SelectField
                            name="type"
                            label="Mission Type"
                            value={formData.type}
                            onChange={handleChange}
                            options={[
                                { value: 'swap', label: 'Swap' },
                                { value: 'volume', label: 'Volume' },
                                { value: 'streak', label: 'Streak' },
                                { value: 'price', label: 'Price-based' },
                                { value: 'routing', label: 'Routing' },
                            ]}
                        />

                        <SelectField
                            name="difficulty"
                            label="Difficulty"
                            value={formData.difficulty}
                            onChange={handleChange}
                            options={[
                                { value: 'easy', label: 'Easy' },
                                { value: 'medium', label: 'Medium' },
                                { value: 'hard', label: 'Hard' },
                                { value: 'legendary', label: 'Legendary' },
                            ]}
                        />
                    </div>
                </div>
            </div>

            {/* Type-specific Requirements */}
            <div className={sectionClass}>
                <h3 className="text-xl font-bold font-display text-white mb-6 flex items-center gap-2">
                    <span className="w-1 h-6 bg-secondary rounded-full shadow-[0_0_10px_#00BEBD]"></span>
                    Requirements
                </h3>

                <div className="relative z-10">
                    {formData.type === 'swap' && (
                        <div className="grid grid-cols-2 gap-6">
                            <SelectField
                                name="inputToken"
                                label="Input Token (optional)"
                                value={formData.inputToken || ''}
                                onChange={handleChange}
                                options={[
                                    { value: '', label: 'Any token' },
                                    { value: 'So11111111111111111111111111111111111111112', label: 'SOL' },
                                    { value: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', label: 'USDC' },
                                    { value: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', label: 'JUP' },
                                ]}
                            />
                            <SelectField
                                name="outputToken"
                                label="Output Token (optional)"
                                value={formData.outputToken || ''}
                                onChange={handleChange}
                                options={[
                                    { value: '', label: 'Any token' },
                                    { value: 'So11111111111111111111111111111111111111112', label: 'SOL' },
                                    { value: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', label: 'USDC' },
                                    { value: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', label: 'JUP' },
                                ]}
                            />
                            <div className="col-span-2">
                                <label className={labelClass}>Minimum USD Value</label>
                                <input
                                    type="number"
                                    name="minUsdValue"
                                    value={formData.minUsdValue}
                                    onChange={handleChange}
                                    min="0"
                                    step="0.01"
                                    placeholder="e.g., 10 = $10 minimum swap"
                                    className={inputClass}
                                />
                            </div>
                        </div>
                    )}

                    {formData.type === 'volume' && (
                        <div>
                            <label className={labelClass}>Minimum Volume (USD)</label>
                            <input
                                type="number"
                                name="minVolumeUsd"
                                value={formData.minVolumeUsd}
                                onChange={handleChange}
                                min="0"
                                step="1"
                                className={inputClass}
                            />
                        </div>
                    )}

                    {formData.type === 'streak' && (
                        <div>
                            <label className={labelClass}>Required Days</label>
                            <input
                                type="number"
                                name="streakDays"
                                value={formData.streakDays}
                                onChange={handleChange}
                                min="1"
                                className={inputClass}
                            />
                        </div>
                    )}

                    {formData.type === 'price' && (
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className={labelClass}>Target Price (USD)</label>
                                <input
                                    type="number"
                                    name="targetPrice"
                                    value={formData.targetPrice}
                                    onChange={handleChange}
                                    min="0"
                                    step="0.01"
                                    className={inputClass}
                                />
                            </div>
                            <SelectField
                                name="priceCondition"
                                label="Condition"
                                value={formData.priceCondition || 'below'}
                                onChange={handleChange}
                                options={[
                                    { value: 'below', label: 'Below target price' },
                                    { value: 'above', label: 'Above target price' },
                                ]}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Rewards */}
            <div className={sectionClass}>
                <h3 className="text-xl font-bold font-display text-white mb-6 flex items-center gap-2">
                    <span className="w-1 h-6 bg-accent rounded-full shadow-[0_0_10px_#7c3aed]"></span>
                    Rewards Config
                </h3>

                <div className="grid grid-cols-2 gap-6 relative z-10">
                    <div>
                        <label className={labelClass}>Points Reward</label>
                        <div className="relative">
                            <input
                                type="number"
                                name="points"
                                value={formData.points}
                                onChange={handleChange}
                                min="1"
                                required
                                className={`${inputClass} pl-10`}
                            />
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary">★</span>
                        </div>
                    </div>
                    <SelectField
                        name="resetCycle"
                        label="Reset Cycle"
                        value={formData.resetCycle}
                        onChange={handleChange}
                        options={[
                            { value: 'none', label: 'No reset (one-time)' },
                            { value: 'daily', label: 'Daily' },
                            { value: 'weekly', label: 'Weekly' },
                            { value: 'monthly', label: 'Monthly' },
                        ]}
                    />
                </div>
            </div>

            {/* Submit */}
            <div className="flex gap-4 pt-4">
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn btn-primary flex-1 h-14 text-lg shadow-[0_0_20px_rgba(199,242,132,0.3)] text-black font-bold"
                >
                    {isSubmitting ? 'Creating Mission...' : 'Create Mission'}
                </button>
                <a href="/missions/manage" className="btn btn-secondary px-8">
                    Cancel
                </a>
            </div>
        </form>
    );
}
