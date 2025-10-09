import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheckCircle,
  faClock,
  faExclamationTriangle,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import { MarkingJobBasic, MarkingJobStatus } from "../types/types";

interface RecentActivityProps {
  jobs: MarkingJobBasic[];
}

export function RecentActivity({ jobs }: RecentActivityProps) {
  // Get the 5 most recent jobs and create activity items
  const recentJobs = jobs
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, 5);

  const getActivityIcon = (status: MarkingJobStatus) => {
    switch (status) {
      case MarkingJobStatus.COMPLETED:
        return faCheckCircle;
      case MarkingJobStatus.PROCESSING:
        return faClock;
      case MarkingJobStatus.FAILED:
        return faExclamationTriangle;
      default:
        return faUser;
    }
  };

  const getActivityColor = (status: MarkingJobStatus) => {
    switch (status) {
      case MarkingJobStatus.COMPLETED:
        return "bg-green-50 text-green-600";
      case MarkingJobStatus.PROCESSING:
        return "bg-blue-50 text-blue-600";
      case MarkingJobStatus.FAILED:
        return "bg-red-50 text-red-600";
      default:
        return "bg-gray-50 text-gray-600";
    }
  };

  const getActivityDescription = (job: MarkingJobBasic) => {
    switch (job.status) {
      case MarkingJobStatus.COMPLETED:
        return `Completed marking ${
          job.total_answer_sheets || 0
        } answer sheets`;
      case MarkingJobStatus.PROCESSING:
        return `Processing ${job.processed_answer_sheets || 0}/${
          job.total_answer_sheets || 0
        } sheets`;
      case MarkingJobStatus.FAILED:
        return "Failed to complete marking";
      default:
        return "Created new marking job";
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-lg border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        <span className="text-sm text-gray-500">Last 5 jobs</span>
      </div>

      <div className="space-y-4">
        {recentJobs.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No recent activity</p>
        ) : (
          recentJobs.map((job) => (
            <div key={job.id} className="flex items-center space-x-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${getActivityColor(
                  job.status
                )}`}
              >
                <FontAwesomeIcon
                  icon={getActivityIcon(job.status)}
                  className="h-4 w-4"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{job.name}</p>
                <p className="text-sm text-gray-500">
                  {getActivityDescription(job)}
                </p>
              </div>
              <span className="text-sm text-gray-400 flex-shrink-0">
                {formatTimeAgo(job.created_at)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
