import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface CountdownTimerProps {
    createdAt: string;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({ createdAt }) => {
    const [timeLeft, setTimeLeft] = useState<string>('');
    const [isOverdue, setIsOverdue] = useState(false);
    const [percentageElapsed, setPercentageElapsed] = useState(0);

    useEffect(() => {
        const calculateTimeLeft = () => {
            const created = new Date(createdAt).getTime();
            const twoHoursInMs = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
            const deadline = created + twoHoursInMs;
            const now = Date.now();
            const remaining = deadline - now;

            // Calculate percentage elapsed (0-100)
            const elapsed = twoHoursInMs - remaining;
            const percentage = Math.min(100, Math.max(0, (elapsed / twoHoursInMs) * 100));
            setPercentageElapsed(percentage);

            if (remaining <= 0) {
                setIsOverdue(true);
                const overdue = Math.abs(remaining);
                const hours = Math.floor(overdue / (1000 * 60 * 60));
                const minutes = Math.floor((overdue % (1000 * 60 * 60)) / (1000 * 60));
                setTimeLeft(`${hours}h ${minutes}m OVERDUE`);
            } else {
                setIsOverdue(false);
                const hours = Math.floor(remaining / (1000 * 60 * 60));
                const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
                setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
            }
        };

        calculateTimeLeft();
        const interval = setInterval(calculateTimeLeft, 1000);

        return () => clearInterval(interval);
    }, [createdAt]);

    // Determine color based on time remaining
    const getColorClass = () => {
        if (isOverdue) return 'bg-red-100 border-red-500 text-red-700';
        if (percentageElapsed > 75) return 'bg-orange-100 border-orange-500 text-orange-700';
        if (percentageElapsed > 50) return 'bg-yellow-100 border-yellow-500 text-yellow-700';
        return 'bg-green-100 border-green-500 text-green-700';
    };

    return (
        <div className={`flex items-center gap-2 px-3 py-2 rounded border-2 font-mono text-sm ${getColorClass()}`}>
            {isOverdue ? (
                <AlertTriangle size={16} className="animate-pulse" />
            ) : (
                <Clock size={16} />
            )}
            <span className="font-bold">{timeLeft}</span>
        </div>
    );
};
