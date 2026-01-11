'use client';

import { useState } from 'react';
import { MissionForm } from '@/components/MissionForm';

export default function CreateMissionPage() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (missionData: any) => {
        setIsSubmitting(true);
        try {
            // In production, this would call Supabase
            console.log('Creating mission:', missionData);
            await new Promise(resolve => setTimeout(resolve, 1000));
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (error) {
            console.error('Failed to create mission:', error);
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
                <div className="bg-success/20 border border-success text-success px-4 py-3 rounded-lg mb-6 animate-fade-in">
                    ✓ Mission created successfully!
                </div>
            )}

            <MissionForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
        </div>
    );
}
