'use client';

import { useEffect } from 'react';
import Button from '@/components/ui/Button';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('Dashboard Error:', error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-3xl mb-4">
                ⚠️
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong!</h2>
            <p className="text-gray-600 mb-6 max-w-md">
                We encountered an unexpected error in the dashboard. Our team has been notified.
            </p>
            <div className="flex gap-4">
                <Button 
                    onClick={() => reset()}
                    className="bg-[#059669] hover:bg-[#047857] text-white"
                >
                    Try again
                </Button>
                <Button 
                    variant="outline"
                    onClick={() => window.location.href = '/'}
                >
                    Go Home
                </Button>
            </div>
        </div>
    );
}
