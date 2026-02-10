"use client";

import Link from 'next/link';
import { cn } from "@/lib/utils/cn";
import React from 'react';

export interface EmptyStateProps {
  icon?: string | React.ElementType;
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  customAction?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon = "inbox",
  title,
  description,
  action,
  customAction,
  className = "",
}: EmptyStateProps) {
  return (
    <div className={cn("text-center py-12 px-4", className)}>
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
        {typeof Icon === "string" ? (
          <span className="material-symbols-outlined text-4xl text-slate-400">{Icon}</span>
        ) : (
          <Icon className="h-8 w-8 text-slate-400" />
        )}
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">{description}</p>

      {customAction ? (
        customAction
      ) : action ? (
        <>
          {action.href ? (
            <Link
              href={action.href}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold text-sm hover:bg-primary/90 transition-all shadow-sm"
            >
              {action.label}
            </Link>
          ) : (
            <button
              onClick={action.onClick}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold text-sm hover:bg-primary/90 transition-all shadow-sm"
            >
              {action.label}
            </button>
          )}
        </>
      ) : null}
    </div>
  );
}
