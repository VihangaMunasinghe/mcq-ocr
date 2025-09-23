import React from "react";
import { MarkingJob } from "./types";

interface ProgressBarProps {
  job: MarkingJob;
}

export function ProgressBar({ job }: ProgressBarProps) {
  const percentage =
    job.submissions > 0 ? (job.marked / job.submissions) * 100 : 0;

  const getProgressBarColor = () => {
    switch (job.status) {
      case "completed":
        return "bg-green-500";
      case "review-required":
        return "bg-amber-500";
      case "processing":
        return "bg-blue-500";
      case "in-progress":
        return "bg-yellow-500";
      case "cancelled":
        return "bg-red-500";
      default:
        return "bg-gray-400";
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-between text-xs mb-1">
        <span>
          {job.marked} / {job.submissions}
        </span>
        <span>{Math.round(percentage)}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${getProgressBarColor()}`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
}
