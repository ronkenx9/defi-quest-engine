'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MissionForm } from '@/components/MissionForm';
import { createMission, CreateMissionInput } from '@/lib/supabase-services';
import { CheckCircle, XCircle } from 'lucide-react';

export default function CreateMissionPage() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleSubmit = async (missionData: any) => {
        setIsSubmitting(true);
        setError(null);

        try {
            // Build requirement object based on mission type
            const requirement: Record<string, unknown> = {};

            if (missionData.type === 'swap') {
                if (missionData.inputToken) requirement.inputMint = missionData.inputToken;
                if (missionData.outputToken) requirement.outputMint = missionData.outputToken;
                if (missionData.minAmount) requirement.minAmount = missionData.minAmount;
            } else if (missionData.type === 'volume') {
                requirement.minVolumeUsd = missionData.minVolumeUsd || 0;
            } else if (missionData.type === 'streak') {
                requirement.consecutiveDays = missionData.streakDays || 7;
            } else if (missionData.type === 'price') {
                requirement.targetPrice = missionData.targetPrice || 0;
                requirement.condition = missionData.priceCondition || 'below';
            }

            const input: CreateMissionInput = {
                name: missionData.name,
                description: missionData.description,
                type: missionData.type,
                difficulty: missionData.difficulty,
                points: missionData.points,
                reset_cycle: missionData.resetCycle,
                requirement,
            };

            await createMission(input);
            setSuccess(true);

            // Redirect to manage page after success
            setTimeout(() => {
                router.push('/missions/manage');
            }, 1500);
        } catch (err) {
            console.error('Failed to create mission:', err);
            setError(err instanceof Error ? err.message : 'Failed to create mission. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="animate-fade-in max-w-3xl font-mono mx-auto">
            <div className="mb-8 p-6 bg-[#000000] border-2 border-[#4ade80]" style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%)' }}>
                <div className="inline-flex items-center gap-2 mb-2 bg-[#4ade80]/10 px-2 py-1 border border-[#4ade80]/30 text-[10px] tracking-widest text-[#4ade80] uppercase">
                    SYS_WRITE_PROXY
                </div>
                <h1 className="text-3xl font-black mb-2 uppercase tracking-tighter text-white">Generate_Payload</h1>
                <p className="text-[#4ade80]/60 text-sm lowercase">{'>>'} forge a new mission directive for the network</p>
            </div>

            {success && (
                <div className="bg-[#4ade80]/20 border-l-4 border-[#4ade80] text-[#4ade80] px-4 py-3 mb-6 animate-fade-in flex items-center gap-3">
                    <CheckCircle size={18} />
                    <span className="font-bold tracking-widest uppercase text-xs">Mission injected successfully. Rerouting...</span>
                </div>
            )}

            {error && (
                <div className="bg-red-500/20 border-l-4 border-red-500 text-red-500 px-4 py-3 mb-6 animate-fade-in flex items-center gap-3">
                    <XCircle size={18} />
                    <span className="font-bold tracking-widest uppercase text-xs">{error}</span>
                </div>
            )}

            <div className="bg-[#000000] border border-[#4ade80]/50 p-6 relative" style={{ clipPath: 'polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)' }}>
                {/* Corner accent */}
                <div className="absolute top-0 left-0 w-5 h-5 border-l-2 border-t-2 border-[#4ade80]"></div>
                <div className="absolute bottom-0 right-0 w-5 h-5 border-r-2 border-b-2 border-[#4ade80]"></div>

                <MissionForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
            </div>
        </div>
    );
}
