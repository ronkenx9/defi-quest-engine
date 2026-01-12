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
        <div className="animate-fade-in max-w-3xl">
            <div className="mb-8">
                <h1 className="text-2xl font-bold mb-2">Create Mission</h1>
                <p className="text-gray-500">Define a new mission for your users</p>
            </div>

            {success && (
                <div className="bg-success/20 border border-success text-success px-4 py-3 rounded-lg mb-6 animate-fade-in flex items-center gap-2">
                    <CheckCircle size={18} />
                    Mission created successfully! Redirecting...
                </div>
            )}

            {error && (
                <div className="bg-error/20 border border-error text-error px-4 py-3 rounded-lg mb-6 animate-fade-in flex items-center gap-2">
                    <XCircle size={18} />
                    {error}
                </div>
            )}

            <MissionForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
        </div>
    );
}
