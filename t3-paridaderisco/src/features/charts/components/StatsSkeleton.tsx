"use client";

import React from "react";
import { Card } from "~/components/ui/card";
import { Activity } from "lucide-react";

interface StatsSkeletonProps {
  className?: string;
}

export const StatsSkeleton: React.FC<StatsSkeletonProps> = ({
  className = "",
}) => {
  return (
    <Card className={`p-4 ${className}`}>
      <div className="space-y-3">
        {/* Header skeleton */}
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-gray-300" />
          <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
        </div>
        
        {/* Stats items skeleton */}
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex justify-between items-center">
              <div className="h-3 bg-gray-100 rounded w-16 animate-pulse" />
              <div className="h-5 bg-gray-200 rounded-full w-14 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};