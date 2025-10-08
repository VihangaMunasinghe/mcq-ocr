"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { VerificationModal } from "../../components/Modals/VerificationModal";
import { useToast } from "../../hooks/useToast";

import { MarkingJobBasic, MarkingJobStatus } from "./types/types";
import { PageHeader } from "./components/PageHeader";
import { JobsTable } from "./components/JobsTable";
import { FiltersSection } from "./components/FiltersSection";
import { DescriptionCard } from "./components/DescriptionCard";

export default function MarkingJobs() {
  const router = useRouter();
  const [selectedJob, setSelectedJob] = useState<number | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  const BACKEND_URL =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
  const [loading, setLoading] = useState(true);
  const [markingJobs, setMarkingJobs] = useState<MarkingJobBasic[]>([]);
  const { showToast } = useToast();

  const filteredJobs =
    statusFilter === "all"
      ? markingJobs
      : markingJobs.filter((job) => job.status === statusFilter);

  const handleDeleteJob = () => {
    console.log(`Deleting job with ID: ${selectedJob}`);
    showToast("Job deleted successfully", "success");
    setIsDeleteModalOpen(false);
    setSelectedJob(null);
  };

  const confirmDelete = (id: number) => {
    setSelectedJob(id);
    setIsDeleteModalOpen(true);
  };

  const handleStopJob = (jobId: number) => {
    console.log(`Pausing job with ID: ${jobId}`);
    showToast("Job paused successfully", "info");
  };

  const handleEditJob = (job: MarkingJobBasic) => {
    router.push(`/marking-jobs/create?markingJobId=${job.id}`);
  };

  const handleViewResults = (job: MarkingJobBasic) => {
    router.push(`/marking-jobs/results/${job.id}`);
  };

  useEffect(() => {
    const progressWebsocket = (markingJobIds: number[]) => {
      const websocket = new WebSocket(`${BACKEND_URL}/api/markings/progress`);
      websocket.onopen = () => {
        websocket.send(JSON.stringify({ marking_job_ids: markingJobIds }));
      };
      websocket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.status === "connected") {
          console.log("WebSocket connection established");
          return;
        }
        if (data.status === "error") {
          console.error("WebSocket error:", data.message);
          websocket.close();
          return;
        }
        if (data.status === "processing") {
          const jobId = data.marking_job_id;
          const progress = data.progress;
          console.log("Processing update:", data);
          setMarkingJobs((prevJobs) =>
            prevJobs.map((job) =>
              job.id === jobId
                ? {
                    ...job,
                    status: MarkingJobStatus.PROCESSING,
                    processed_answer_sheets: progress.completed,
                    total_answer_sheets: progress.total,
                  }
                : job
            )
          );
        }
        if (data.status === "completed") {
          const jobId = data.marking_job_id;
          console.log("Completed update:", data);
          setMarkingJobs((prevJobs) =>
            prevJobs.map((job) =>
              job.id === jobId
                ? {
                    ...job,
                    status: MarkingJobStatus.COMPLETED,
                  }
                : job
            )
          );
        }
      };
      websocket.onerror = (error) => {
        console.error("WebSocket error:", error);
        websocket.close();
      };
      websocket.onclose = () => {
        console.log("WebSocket connection closed");
        websocket.close();
      };
    };

    const fetchMarkingJobs = async () => {
      setLoading(true);
      const response = await fetch(`${BACKEND_URL}/api/markings`);
      const markingJobs: MarkingJobBasic[] = await response.json();
      setMarkingJobs(markingJobs);
      progressWebsocket(
        markingJobs
          .map((job) =>
            job.status === MarkingJobStatus.PROCESSING ||
            job.status === MarkingJobStatus.QUEUED
              ? job.id
              : null
          )
          .filter((id) => id !== null)
      );
      setLoading(false);
    };
    fetchMarkingJobs();
  }, [BACKEND_URL]);

  return (
    <>
      <PageHeader onCreateNew={() => router.push("marking-jobs/create")} />

      <DescriptionCard />

      <FiltersSection
        totalJobs={markingJobs.length}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

      {loading ? (
        <div>Loading...</div>
      ) : (
        <JobsTable
          jobs={filteredJobs}
          onStopJob={handleStopJob}
          onEditJob={handleEditJob}
          onViewResults={handleViewResults}
          onDeleteJob={confirmDelete}
        />
      )}

      <VerificationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteJob}
        title="Delete Marking Job"
        message="Are you sure you want to delete this marking job? This action cannot be undone."
        confirmText="Delete"
        type="warning"
      />
    </>
  );
}
