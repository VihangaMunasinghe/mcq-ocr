"use client";

import { useState } from "react";
import { ProtectedRoute } from "../../components/ProtectedRoute";
import MainLayout from "../../components/Layout/MainLayout";
import { Table, TableColumn } from "../../components/UI/Table";
import { Button } from "../../components/UI/Button";
import { Select } from "../../components/UI/Select";
import { Modal } from "../../components/UI/Modal";
import { FileUploadModal } from "../../components/Modals/FileUploadModal";
import { VerificationModal } from "../../components/Modals/VerificationModal";
import { useToast } from "../../hooks/useToast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faClipboardCheck,
  faPlay,
  faPause,
  faTrash,
  faFileText,
  faCheckCircle,
  faExclamationTriangle,
  faEye,
  faFile,
} from "@fortawesome/free-solid-svg-icons";

type JobStatus =
  | "pending"
  | "processing"
  | "in-progress"
  | "review-required"
  | "completed"
  | "cancelled";

interface MarkingJob {
  id: number;
  name: string;
  template: string;
  templateType: string;
  created: string;
  deadline: string;
  status: JobStatus;
  submissions: number;
  marked: number;
  flaggedQuestions?: number[];
}

interface ReviewQuestion {
  id: number;
  question: string;
  options: string[];
  markedAnswer: string;
  suggestedAnswer: string;
  issue: string;
}

export default function MarkingJobs() {
  const [selectedJob, setSelectedJob] = useState<number | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
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
      deadline: "2023-04-15",
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
      deadline: "2023-04-20",
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
      deadline: "2023-04-12",
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
      deadline: "2023-04-22",
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
      deadline: "2023-04-25",
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
      deadline: "2023-04-11",
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
      deadline: "2023-04-21",
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
      deadline: "2023-04-08",
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

  const handleNewJob = (files: File[]) => {
    console.log("Creating new job with files:", files);
    showToast("New marking job created successfully", "success");
    setIsUploadModalOpen(false);
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

  const getStatusBadge = (status: JobStatus) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Pending
          </span>
        );
      case "processing":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <svg
              className="animate-spin -ml-1 mr-1.5 h-2 w-2 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Processing
          </span>
        );
      case "in-progress":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            In Progress
          </span>
        );
      case "review-required":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
            <FontAwesomeIcon
              icon={faExclamationTriangle}
              className="h-3 w-3 mr-1"
            />
            Review Required
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <FontAwesomeIcon icon={faCheckCircle} className="h-3 w-3 mr-1" />
            Completed
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  const columns = [
    { header: "Name", accessor: "name", sortable: true },
    { header: "Template", accessor: "template", sortable: true },
    { header: "Type", accessor: "templateType", sortable: true },
    { header: "Created", accessor: "created", sortable: true },
    { header: "Deadline", accessor: "deadline", sortable: true },
    {
      header: "Status",
      accessor: (job: MarkingJob) => getStatusBadge(job.status),
      sortable: true,
    },
    {
      header: "Progress",
      accessor: (job: MarkingJob) => (
        <div className="w-full">
          <div className="flex justify-between text-xs mb-1">
            <span>
              {job.marked} / {job.submissions}
            </span>
            <span>
              {job.submissions > 0
                ? Math.round((job.marked / job.submissions) * 100)
                : 0}
              %
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${
                job.status === "completed"
                  ? "bg-green-500"
                  : job.status === "review-required"
                  ? "bg-amber-500"
                  : job.status === "processing"
                  ? "bg-blue-500"
                  : job.status === "in-progress"
                  ? "bg-yellow-500"
                  : job.status === "cancelled"
                  ? "bg-red-500"
                  : "bg-gray-400"
              }`}
              style={{
                width: `${
                  job.submissions > 0 ? (job.marked / job.submissions) * 100 : 0
                }%`,
              }}
            ></div>
          </div>
        </div>
      ),
    },
    {
      header: "Actions",
      accessor: (job: MarkingJob) => (
        <div className="flex space-x-2">
          {job.status === "pending" && (
            <Button
              variant="outline"
              size="sm"
              icon={<FontAwesomeIcon icon={faPlay} className="h-4 w-4" />}
              onClick={() => handleStartJob(job.id)}
            >
              Start
            </Button>
          )}
          {job.status === "in-progress" && (
            <Button
              variant="outline"
              size="sm"
              icon={<FontAwesomeIcon icon={faPause} className="h-4 w-4" />}
              onClick={() => handlePauseJob(job.id)}
            >
              Pause
            </Button>
          )}
          {job.status === "review-required" && (
            <Button
              variant="outline"
              size="sm"
              icon={
                <FontAwesomeIcon
                  icon={faExclamationTriangle}
                  className="h-4 w-4"
                />
              }
              onClick={() => handleReviewJob(job)}
            >
              Review
            </Button>
          )}
          {job.status === "completed" && (
            <Button
              variant="outline"
              size="sm"
              icon={<FontAwesomeIcon icon={faEye} className="h-4 w-4" />}
              onClick={() => handleViewResults(job)}
            >
              Results
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            icon={<FontAwesomeIcon icon={faTrash} className="h-4 w-4" />}
            onClick={() => confirmDelete(job.id)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">
              Marking Jobs
            </h2>
            <Button
              variant="primary"
              icon={<FontAwesomeIcon icon={faPlus} className="h-4 w-4" />}
              onClick={() => setIsUploadModalOpen(true)}
            >
              New Marking Job
            </Button>
          </div>

          <div className="bg-white p-4 rounded-md shadow-sm mb-4">
            <p className="text-sm text-gray-600">
              Upload answer sheets for automatic grading. The system will
              process them using the selected MCQ template.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 sm:space-x-4">
            <div className="flex items-center space-x-2">
              <FontAwesomeIcon
                icon={faClipboardCheck}
                className="h-5 w-5 text-gray-400"
              />
              <span className="text-gray-700 font-medium">
                Total Jobs: {markingJobs.length}
              </span>
            </div>
            <div className="w-full sm:w-64">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: "all", label: "All Statuses" },
                  { value: "pending", label: "Pending" },
                  { value: "processing", label: "Processing" },
                  { value: "in-progress", label: "In Progress" },
                  { value: "review-required", label: "Review Required" },
                  { value: "completed", label: "Completed" },
                  { value: "cancelled", label: "Cancelled" },
                ]}
              />
            </div>
          </div>

          <div className="bg-white shadow rounded-lg overflow-hidden">
            <Table
              columns={columns as TableColumn<MarkingJob>[]}
              data={filteredJobs}
              keyField="id"
              pagination={true}
              itemsPerPage={5}
              searchable={true}
              searchPlaceholder="Search marking jobs..."
              emptyMessage="No marking jobs found"
            />
          </div>

          <FileUploadModal
            isOpen={isUploadModalOpen}
            onClose={() => setIsUploadModalOpen(false)}
            onUpload={handleNewJob}
            title="Create New Marking Job"
            acceptedFileTypes=".pdf,.jpg,.jpeg,.png"
            maxFileSize={10 * 1024 * 1024}
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

          {/* Review Modal */}
          <Modal
            isOpen={isReviewModalOpen}
            onClose={() => setIsReviewModalOpen(false)}
            title={`Review Required: ${selectedJobData?.name}`}
            size="xl"
          >
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <FontAwesomeIcon
                      icon={faExclamationTriangle}
                      className="h-5 w-5 text-amber-400"
                    />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-amber-800">
                      Manual Review Required
                    </h3>
                    <p className="mt-2 text-sm text-amber-700">
                      The system has flagged {reviewQuestions.length} questions
                      that need manual review.
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                {reviewQuestions.map((question) => (
                  <div
                    key={question.id}
                    className="bg-white border border-gray-200 rounded-md p-4 shadow-sm"
                  >
                    <div className="flex justify-between">
                      <h4 className="text-sm font-medium text-gray-900">
                        Question {question.id}
                      </h4>
                      <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                        Needs Review
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-gray-700">
                      {question.question}
                    </p>
                    <div className="mt-3 grid grid-cols-1 gap-y-2 sm:grid-cols-2 sm:gap-x-4">
                      <div>
                        <h5 className="text-xs font-medium text-gray-500">
                          Options
                        </h5>
                        <ul className="mt-1 space-y-1">
                          {question.options.map((option, i) => (
                            <li key={i} className="text-sm text-gray-600">
                              {String.fromCharCode(65 + i)}. {option}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <h5 className="text-xs font-medium text-gray-500">
                            Marked Answer
                          </h5>
                          <p className="mt-1 text-sm text-red-600">
                            {question.markedAnswer}
                          </p>
                        </div>
                        <div>
                          <h5 className="text-xs font-medium text-gray-500">
                            Suggested Answer
                          </h5>
                          <p className="mt-1 text-sm text-green-600">
                            {question.suggestedAnswer}
                          </p>
                        </div>
                        <div>
                          <h5 className="text-xs font-medium text-gray-500">
                            Issue
                          </h5>
                          <p className="mt-1 text-xs text-gray-600">
                            {question.issue}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setIsReviewModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleReviewComplete}
                icon={
                  <FontAwesomeIcon icon={faCheckCircle} className="h-4 w-4" />
                }
              >
                Complete Review
              </Button>
            </div>
          </Modal>

          {/* Results Modal */}
          <Modal
            isOpen={isResultModalOpen}
            onClose={() => setIsResultModalOpen(false)}
            title={`Results: ${selectedJobData?.name}`}
            size="lg"
          >
            <div className="space-y-6">
              <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <h4 className="text-xs font-medium text-gray-500">
                      Total Submissions
                    </h4>
                    <p className="mt-1 text-lg font-medium text-gray-900">
                      {selectedJobData?.submissions}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-xs font-medium text-gray-500">
                      Marked
                    </h4>
                    <p className="mt-1 text-lg font-medium text-gray-900">
                      {selectedJobData?.marked}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-xs font-medium text-gray-500">
                      Completion
                    </h4>
                    <p className="mt-1 text-lg font-medium text-green-600">
                      {selectedJobData && selectedJobData.submissions > 0
                        ? `${Math.round(
                            (selectedJobData.marked /
                              selectedJobData.submissions) *
                              100
                          )}%`
                        : "0%"}
                    </p>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Summary
                </h3>
                <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Metric
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Value
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          Average Score
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          78.5%
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          Highest Score
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">98%</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          Lowest Score
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">45%</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          Median Score
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">82%</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          Pass Rate
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          87.5%
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => handleDownloadResults("csv")}
                icon={<FontAwesomeIcon icon={faFileText} className="h-4 w-4" />}
              >
                Download CSV
              </Button>
              <Button
                variant="outline"
                onClick={() => handleDownloadResults("pdf")}
                icon={<FontAwesomeIcon icon={faFile} className="h-4 w-4" />}
              >
                Download PDF
              </Button>
              <Button
                variant="primary"
                onClick={() => setIsResultModalOpen(false)}
              >
                Close
              </Button>
            </div>
          </Modal>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}
