"use client";

import React from "react";
import { Card } from "~/components/ui/card";

interface ChartSkeletonProps {
  height?: number;
  showHeader?: boolean;
  className?: string;
}

export const ChartSkeleton: React.FC<ChartSkeletonProps> = ({
  height = 400,
  showHeader = true,
  className = "",
}) => {
  return (
    <Card className={`p-6 ${className}`}>
      {showHeader && (
        <div className="space-y-3 mb-6">
          {/* Title skeleton */}
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-6 bg-gray-200 rounded-md w-48 animate-pulse" />
              <div className="h-4 bg-gray-100 rounded w-20 animate-pulse" />
            </div>
          </div>
        </div>
      )}
      
      {/* Chart area skeleton */}
      <div 
        className="relative bg-muted rounded-lg animate-pulse"
        style={{ height }}
      >
        {/* Y-axis skeleton */}
        <div className="absolute left-2 top-4 space-y-8">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-3 bg-gray-200 rounded w-8 animate-pulse" />
          ))}
        </div>
        
        {/* X-axis skeleton */}
        <div className="absolute bottom-4 left-12 right-4 flex justify-between">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-3 bg-gray-200 rounded w-8 animate-pulse" />
          ))}
        </div>
        
        {/* Chart line skeleton */}
        <div className="absolute inset-12">
          <svg className="w-full h-full" viewBox="0 0 400 200">
            <path
              d="M 20 150 Q 60 120 100 140 T 180 100 T 260 120 T 340 80 T 380 90"
              stroke="#e5e7eb"
              strokeWidth="3"
              fill="none"
              className="animate-pulse"
            />
            {/* Data points skeleton */}
            {[20, 100, 180, 260, 340, 380].map((x, i) => {
              const y = [150, 140, 100, 120, 80, 90][i];
              return (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r="4"
                  fill="#d1d5db"
                  className="animate-pulse"
                />
              );
            })}
          </svg>
        </div>
        
        {/* Grid lines skeleton */}
        <div className="absolute inset-12 opacity-30">
          {/* Horizontal grid lines */}
          {Array.from({ length: 4 }).map((_, i) => (
            <div 
              key={`h-${i}`}
              className="absolute left-0 right-0 h-px bg-gray-200"
              style={{ top: `${25 + (i * 25)}%` }}
            />
          ))}
          
          {/* Vertical grid lines */}
          {Array.from({ length: 5 }).map((_, i) => (
            <div 
              key={`v-${i}`}
              className="absolute top-0 bottom-0 w-px bg-gray-200"
              style={{ left: `${20 + (i * 20)}%` }}
            />
          ))}
        </div>
      </div>
    </Card>
  );
};