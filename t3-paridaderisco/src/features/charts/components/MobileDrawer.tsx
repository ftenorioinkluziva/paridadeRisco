"use client";

import React from "react";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Settings } from "lucide-react";

interface MobileDrawerProps {
  trigger?: React.ReactNode;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  trigger,
  title = "Controles",
  children,
  className = "",
}) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="w-full lg:hidden">
            <Settings className="h-4 w-4 mr-2" />
            {title}
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className={`sm:max-w-md max-h-[85vh] overflow-y-auto ${className}`}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
};