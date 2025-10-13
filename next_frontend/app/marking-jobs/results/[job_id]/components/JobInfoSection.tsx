import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFileAlt,
  faCalendarAlt,
  faFlag,
  faChartLine,
} from "@fortawesome/free-solid-svg-icons";
import { StatusBadge } from "@/app/marking-jobs/components/StatusBadge";
import { JobInfo, MarkingJobStatus } from "@/app/marking-jobs/types/types";

interface JobInfoSectionProps {
  jobInfo: JobInfo;
}

export function JobInfoSection({ jobInfo }: JobInfoSectionProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getProcessingDuration = () => {
    if (jobInfo.processing_started_at && jobInfo.processing_completed_at) {
      const start = new Date(jobInfo.processing_started_at);
      const end = new Date(jobInfo.processing_completed_at);
      const duration = Math.round((end.getTime() - start.getTime()) / 1000);
      return `${duration}s`;
    }
    return "N/A";
  };

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
          <FontAwesomeIcon
            icon={faFileAlt}
            className="h-5 w-5 mr-2 text-gray-500"
          />
          Job Information
        </h2>
        <StatusBadge status={jobInfo.status as MarkingJobStatus} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
            Basic Information
          </h3>
          <div className="space-y-2">
            <div>
              <span className="text-sm text-gray-500">Job Name:</span>
              <p className="text-sm font-medium text-gray-900">
                {jobInfo.name}
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Template:</span>
              <p className="text-sm font-medium text-gray-900">
                {jobInfo.template_name}
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Priority:</span>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ml-2 ${
                  jobInfo.priority === "high"
                    ? "bg-red-100 text-red-800"
                    : jobInfo.priority === "medium"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-green-100 text-green-800"
                }`}
              >
                <FontAwesomeIcon icon={faFlag} className="h-3 w-3 mr-1" />
                {jobInfo.priority}
              </span>
            </div>
          </div>
        </div>

        {/* Timing Info */}
        <div className="space-y-4 ">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
            Timing
          </h3>
          <div className="space-y-2">
            <div>
              <span className="text-sm text-gray-500 flex items-center">
                <FontAwesomeIcon
                  icon={faCalendarAlt}
                  className="h-3 w-3 mr-1"
                />
                Created:
              </span>
              <p className="text-sm font-medium text-gray-900">
                {formatDate(jobInfo.created_at)}
              </p>
            </div>
            {jobInfo.processing_started_at && (
              <div>
                <span className="text-sm text-gray-500">Started:</span>
                <p className="text-sm font-medium text-gray-900">
                  {formatDate(jobInfo.processing_started_at)}
                </p>
              </div>
            )}
            {jobInfo.processing_completed_at && (
              <div>
                <span className="text-sm text-gray-500">Completed:</span>
                <p className="text-sm font-medium text-gray-900">
                  {formatDate(jobInfo.processing_completed_at)}
                </p>
              </div>
            )}
          </div>
        </div>
        {/* Duration Info */}
        <div className="space-y-4 ">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
            Duration
          </h3>
          <div className="space-y-2">
            <div>
              <span className="text-sm text-gray-500 flex items-center">
                <FontAwesomeIcon icon={faChartLine} className="h-3 w-3 mr-1" />
                Duration:
              </span>
              <p className="text-sm font-medium text-gray-900">
                {getProcessingDuration()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
