"use client";

import React from "react";
import { Card } from "~/components/ui/card";

interface AssetSelectorSkeletonProps {
  className?: string;
}

export const AssetSelectorSkeleton: React.FC<AssetSelectorSkeletonProps> = ({
  className = "",
}) => {
  return (
    <Card className={`p-4 ${className}`}>
      <div className="space-y-3">
        {/* Header skeleton */}
        <div className="flex items-center gap-2">
          <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
          <div className="h-4 bg-gray-100 rounded w-8 animate-pulse" />
        </div>
        
        {/* Search input skeleton */}
        <div className="h-10 bg-gray-100 rounded-md animate-pulse" />
        
        {/* Filter buttons skeleton */}
        <div className="flex gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div 
              key={i} 
              className="h-6 bg-gray-200 rounded-full w-12 animate-pulse" 
            />
          ))}
        </div>
        
        {/* Asset options skeleton */}
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-2 rounded-md">
              <div className="flex items-center gap-3">
                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
                <div className="space-y-1">
                  <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
                  <div className="h-3 bg-gray-100 rounded w-24 animate-pulse" />
                </div>
              </div>
              <div className="h-3 bg-gray-100 rounded w-8 animate-pulse" />
            </div>
          ))}
        </div>
        
        {/* Load more skeleton */}
        <div className="text-center pt-2">
          <div className="h-3 bg-gray-100 rounded w-20 mx-auto animate-pulse" />
        </div>
      </div>
    </Card>
  );
};