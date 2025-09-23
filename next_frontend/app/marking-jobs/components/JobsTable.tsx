import React from "react";
import { Table, TableColumn } from "../../../components/UI/Table";
import { MarkingJob } from "./types";
import { StatusBadge } from "./StatusBadge";
import { ProgressBar } from "./ProgressBar";
import { JobActions } from "./JobActions";

interface JobsTableProps {
  jobs: MarkingJob[];
  onStartJob: (jobId: number) => void;
  onPauseJob: (jobId: number) => void;
  onReviewJob: (job: MarkingJob) => void;
  onViewResults: (job: MarkingJob) => void;
  onDeleteJob: (jobId: number) => void;
}

export function JobsTable({
  jobs,
  onStartJob,
  onPauseJob,
  onReviewJob,
  onViewResults,
  onDeleteJob,
}: JobsTableProps) {
  const columns: TableColumn<MarkingJob>[] = [
    { header: "Name", accessor: "name", sortable: true },
    { header: "Template", accessor: "template", sortable: true },
    { header: "Type", accessor: "templateType", sortable: true },
    { header: "Created", accessor: "created", sortable: true },
    {
      header: "Status",
      accessor: (job: MarkingJob) => <StatusBadge status={job.status} />,
      sortable: true,
    },
    {
      header: "Progress",
      accessor: (job: MarkingJob) => <ProgressBar job={job} />,
    },
    {
      header: "Actions",
      accessor: (job: MarkingJob) => (
        <JobActions
          job={job}
          onStart={onStartJob}
          onPause={onPauseJob}
          onReview={onReviewJob}
          onViewResults={onViewResults}
          onDelete={onDeleteJob}
        />
      ),
    },
  ];

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <Table
        columns={columns}
        data={jobs}
        keyField="id"
        pagination={true}
        itemsPerPage={5}
        searchable={true}
        searchPlaceholder="Search marking jobs..."
        emptyMessage="No marking jobs found"
      />
    </div>
  );
}
