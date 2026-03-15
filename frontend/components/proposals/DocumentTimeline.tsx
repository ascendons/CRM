"use client";

import React from "react";
import { ProposalStatus } from "@/types/proposal";

interface Step {
  key: ProposalStatus | string;
  label: string;
  icon: string;
}

const QUOTATION_STEPS: Step[] = [
  { key: "DRAFT", label: "Draft", icon: "✏️" },
  { key: "PENDING_APPROVAL", label: "Approval", icon: "🔍" },
  { key: "PENDING_ON_CUSTOMER", label: "Sent", icon: "📤" },
  { key: "ACCEPTED", label: "Accepted", icon: "✅" },
  { key: "CONVERTED", label: "Converted", icon: "🧾" },
];

const PROFORMA_STEPS: Step[] = [
  { key: "DRAFT", label: "Draft", icon: "✏️" },
  { key: "SENT", label: "Sent", icon: "📤" },
  { key: "ACCEPTED", label: "Accepted", icon: "✅" },
  { key: "VOIDED", label: "Voided", icon: "🚫" },
];

function getStepIndex(steps: Step[], status: string, hasBeenConverted?: boolean): number {
  if (hasBeenConverted) return steps.findIndex(s => s.key === "CONVERTED");
  if (status === "REJECTED") return -1; // special case
  return steps.findIndex(s => s.key === status);
}

interface DocumentTimelineProps {
  status: string;
  isProforma?: boolean;
  hasBeenConverted?: boolean;
  isRejected?: boolean;
}

export default function DocumentTimeline({ status, isProforma, hasBeenConverted, isRejected }: DocumentTimelineProps) {
  const steps = isProforma ? PROFORMA_STEPS : QUOTATION_STEPS;
  const currentIdx = getStepIndex(steps, status, hasBeenConverted);

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 mb-4 shadow-sm">
      <div className="flex items-center w-full relative">
        {/* Connecting line */}
        <div className="absolute left-0 right-0 top-5 h-0.5 bg-gray-200 z-0" />

        {steps.map((step, idx) => {
          const isActive = idx === currentIdx;
          const isDone = idx < currentIdx;
          const isVoided = status === "VOIDED" && step.key === "VOIDED";
          const isRejectedStep = isRejected && step.key === "DRAFT";

          return (
            <div key={step.key} className="flex-1 flex flex-col items-center relative z-10">
              <div
                className={`
                  w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-all
                  ${isVoided ? "border-red-400 bg-red-50 text-red-600" :
                    isRejectedStep ? "border-red-300 bg-red-50" :
                    isActive ? "border-blue-500 bg-blue-500 text-white shadow-md scale-110" :
                    isDone ? "border-green-400 bg-green-50 text-green-700" :
                    "border-gray-200 bg-gray-50 text-gray-400"}
                `}
              >
                {isDone && !isActive ? "✓" : step.icon}
              </div>
              <span className={`mt-1 text-xs font-medium text-center
                ${isActive ? "text-blue-600" :
                  isDone ? "text-green-600" :
                  isVoided ? "text-red-500" :
                  "text-gray-400"}
              `}>
                {step.label}
              </span>
              {isActive && (
                <span className="text-[10px] text-blue-400 font-semibold mt-0.5">Current</span>
              )}
            </div>
          );
        })}
      </div>

      {isRejected && (
        <div className="mt-3 flex items-center gap-2 text-red-600 text-xs font-medium bg-red-50 rounded-lg px-3 py-1.5">
          <span>❌</span> This document was internally rejected.
        </div>
      )}
    </div>
  );
}
