"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { VerificationModal } from "../../components/Modals/VerificationModal";
import { useToast } from "../../hooks/useToast";
import {
  PageHeader,
  DescriptionCard,
  FiltersSection,
  JobsTable,
  ReviewModal,
  ResultsModal,
  MarkingJob,
  ReviewQuestion,
} from "./components";

export default function MarkingJobs() {
  const router = useRouter();
  const [selectedJob, setSelectedJob] = useState<number | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [reviewQuestions, setReviewQuestions] = useState<ReviewQuestion[]>([]);
  const [selectedJobData, setSelectedJobData] = useState<MarkingJob | null>(
    null
  );
  const { showToast } = useToast();

  const markingJobs: MarkingJob[] = [
    {
      id: 1,
      name: "Math Quiz - Grade 10",
      template: "Math Quiz MCQ Template",
      templateType: "MCQ",
      created: "2023-04-01",
      status: "completed",
      submissions: 32,
      marked: 32,
    },
    {
      id: 2,
      name: "English Grammar - Grade 11",
      template: "English Grammar MCQ",
      templateType: "MCQ",
      created: "2023-04-05",
      status: "review-required",
      submissions: 28,
      marked: 24,
      flaggedQuestions: [3, 7, 12, 18],
    },
    {
      id: 3,
      name: "Science Test - Grade 9",
      template: "Science Test Template",
      templateType: "Test",
      created: "2023-04-02",
      status: "completed",
      submissions: 45,
      marked: 45,
    },
    {
      id: 4,
      name: "History Assignment - Grade 12",
      template: "History Assignment Rubric",
      templateType: "Rubric",
      created: "2023-04-08",
      status: "in-progress",
      submissions: 19,
      marked: 8,
    },
    {
      id: 5,
      name: "Geography Quiz - Grade 10",
      template: "Geography Quiz Template",
      templateType: "Quiz",
      created: "2023-04-10",
      status: "pending",
      submissions: 0,
      marked: 0,
    },
    {
      id: 6,
      name: "Physics Lab Report - Grade 11",
      template: "Science Lab Report",
      templateType: "Report",
      created: "2023-03-28",
      status: "completed",
      submissions: 24,
      marked: 24,
    },
    {
      id: 7,
      name: "Computer Science MCQ - Grade 12",
      template: "Programming Test MCQ",
      templateType: "MCQ",
      created: "2023-04-07",
      status: "processing",
      submissions: 22,
      marked: 0,
    },
    {
      id: 8,
      name: "Art Project - Grade 9",
      template: "Art Project Rubric",
      templateType: "Rubric",
      created: "2023-03-25",
      status: "cancelled",
      submissions: 18,
      marked: 5,
    },
  ];

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

  const handleStartJob = (jobId: number) => {
    console.log(`Starting job with ID: ${jobId}`);
    showToast("Job started successfully", "success");
  };

  const handlePauseJob = (jobId: number) => {
    console.log(`Pausing job with ID: ${jobId}`);
    showToast("Job paused successfully", "info");
  };

  const handleReviewJob = (job: MarkingJob) => {
    setSelectedJobData(job);
    const mockReviewQuestions: ReviewQuestion[] = [
      {
        id: 3,
        question: "What is the main function of mitochondria?",
        options: [
          "Cell division",
          "Protein synthesis",
          "Energy production",
          "Waste removal",
        ],
        markedAnswer: "Cell division",
        suggestedAnswer: "Energy production",
        issue: "Answer sheet unclear, possible marking error",
      },
    ];
    setReviewQuestions(mockReviewQuestions);
    setIsReviewModalOpen(true);
  };

  const handleReviewComplete = () => {
    console.log("Review completed for job:", selectedJobData?.id);
    showToast("Review completed successfully", "success");
    setIsReviewModalOpen(false);
  };

  const handleViewResults = (job: MarkingJob) => {
    setSelectedJobData(job);
    setIsResultModalOpen(true);
  };

  const handleDownloadResults = (format: "csv" | "pdf") => {
    console.log(
      `Downloading results in ${format} format for job:`,
      selectedJobData?.id
    );
    showToast(
      `Results downloaded successfully in ${format.toUpperCase()} format`,
      "success"
    );
  };

  return (
    <>
      <PageHeader onCreateNew={() => router.push("marking-jobs/create")} />

      <DescriptionCard />

      <FiltersSection
        totalJobs={markingJobs.length}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

      <JobsTable
        jobs={filteredJobs}
        onStartJob={handleStartJob}
        onPauseJob={handlePauseJob}
        onReviewJob={handleReviewJob}
        onViewResults={handleViewResults}
        onDeleteJob={confirmDelete}
      />

      <VerificationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteJob}
        title="Delete Marking Job"
        message="Are you sure you want to delete this marking job? This action cannot be undone."
        confirmText="Delete"
        type="warning"
      />

      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        job={selectedJobData}
        reviewQuestions={reviewQuestions}
        onReviewComplete={handleReviewComplete}
      />

      <ResultsModal
        isOpen={isResultModalOpen}
        onClose={() => setIsResultModalOpen(false)}
        job={selectedJobData}
        onDownloadResults={handleDownloadResults}
      />
    </>
  );
}
