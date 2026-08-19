/* eslint-disable jsx-a11y/alt-text */
"use client";

import { CheckCircle2 } from "lucide-react";
import { STEP_LABELS } from "@/features/donor-registration/validations/donor-registration";
import { cn } from "@/lib/utils";

interface StepProgressProps {
  currentStep: number;
  completedSteps: Set<number>;
  onStepClick?: (step: number) => void;
  donorType: "sperm" | "egg";
}

export function StepProgress({ currentStep, completedSteps, onStepClick, donorType }: StepProgressProps) {
  const accent = donorType === "egg" ? "rose" : "teal";

  return (
    <div className="w-full">
      {/* Desktop: Horizontal progress */}
      <div className="hidden lg:block">
        <div className="flex items-center justify-between relative">
          {/* Background line */}
          <div className="absolute top-5 left-8 right-8 h-0.5 bg-slate-200 dark:bg-slate-800" />
          <div
            className={cn(
              "absolute top-5 left-8 h-0.5 transition-all duration-500",
              accent === "rose" ? "bg-rose-500" : "bg-teal-500"
            )}
            style={{ width: `${Math.min(((currentStep - 1) / (STEP_LABELS.length - 1)) * 100, 100)}%`, maxWidth: "calc(100% - 4rem)" }}
          />

          {STEP_LABELS.map((label, idx) => {
            const step = idx + 1;
            const isCompleted = completedSteps.has(step);
            const isCurrent = currentStep === step;
            const isClickable = isCompleted || step <= currentStep;

            return (
              <div
                key={step}
                className={cn(
                  "flex flex-col items-center relative z-10 cursor-default",
                  isClickable && "cursor-pointer"
                )}
                onClick={() => isClickable && onStepClick?.(step)}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2",
                    isCompleted
                      ? `${accent === "rose" ? "bg-rose-500 border-rose-500" : "bg-teal-500 border-teal-500"} text-white`
                      : isCurrent
                      ? `${accent === "rose" ? "bg-rose-500 border-rose-500 shadow-md shadow-rose-500/20" : "bg-teal-500 border-teal-500 border-2 shadow-md shadow-teal-500/20"} text-white`
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-400"
                  )}
                >
                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : step}
                </div>
                <span
                  className={cn(
                    "text-[9px] font-semibold mt-2 text-center w-16 leading-tight",
                    isCurrent
                      ? `${accent === "rose" ? "text-rose-600" : "text-teal-600"}`
                      : isCompleted
                      ? "text-slate-600 dark:text-slate-400"
                      : "text-slate-400"
                  )}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile: Compact progress bar */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between mb-2">
          <span className={cn("text-xs font-bold", accent === "rose" ? "text-rose-600" : "text-teal-600")}>
            Step {currentStep} of {STEP_LABELS.length}
          </span>
          <span className="text-xs text-slate-500 font-medium">
            {STEP_LABELS[currentStep - 1] || "Review"}
          </span>
        </div>
        <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              accent === "rose" ? "bg-rose-500" : "bg-teal-500"
            )}
            style={{ width: `${(currentStep / STEP_LABELS.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
