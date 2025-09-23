import React from "react";
import { Button } from "../../../components/UI/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlay,
  faPause,
  faTrash,
  faExclamationTriangle,
  faEye,
} from "@fortawesome/free-solid-svg-icons";
import { MarkingJob } from "./types";

interface JobActionsProps {
  job: MarkingJob;
  onStart: (jobId: number) => void;
  onPause: (jobId: number) => void;
  onReview: (job: MarkingJob) => void;
  onViewResults: (job: MarkingJob) => void;
  onDelete: (jobId: number) => void;
}

export function JobActions({
  job,
  onStart,
  onPause,
  onReview,
  onViewResults,
  onDelete,
}: JobActionsProps) {
  return (
    <div className="flex space-x-2">
      {job.status === "pending" && (
        <Button
          variant="outline"
          size="sm"
          icon={<FontAwesomeIcon icon={faPlay} className="h-4 w-4" />}
          onClick={() => onStart(job.id)}
        >
          Start
        </Button>
      )}
      {job.status === "in-progress" && (
        <Button
          variant="outline"
          size="sm"
          icon={<FontAwesomeIcon icon={faPause} className="h-4 w-4" />}
          onClick={() => onPause(job.id)}
        >
          Pause
        </Button>
      )}
      {job.status === "review-required" && (
        <Button
          variant="outline"
          size="sm"
          icon={
            <FontAwesomeIcon icon={faExclamationTriangle} className="h-4 w-4" />
          }
          onClick={() => onReview(job)}
        >
          Review
        </Button>
      )}
      {job.status === "completed" && (
        <Button
          variant="outline"
          size="sm"
          icon={<FontAwesomeIcon icon={faEye} className="h-4 w-4" />}
          onClick={() => onViewResults(job)}
        >
          Results
        </Button>
      )}
      <Button
        variant="outline"
        size="sm"
        icon={<FontAwesomeIcon icon={faTrash} className="h-4 w-4" />}
        onClick={() => onDelete(job.id)}
      >
        Delete
      </Button>
    </div>
  );
}
