"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faSpinner } from "@fortawesome/free-solid-svg-icons";
import { Button } from "../../../../components/UI/Button";
import { useToast } from "../../../../hooks/useToast";
import {
  JobInfo,
  ResultsData,
  StudentResult,
} from "@/app/marking-jobs/types/types";
import { _convertBlobToStudentResults, getMarkingSchemeBubbleData } from "../../utils";
import AnswerSheetModal from "./components/AnswerSheetModal";
import { JobInfoSection } from "./components/JobInfoSection";
import { ResultsTable } from "./components/ResultsTable";

const ResultsPage = () => {
  const router = useRouter();
  const { showToast } = useToast();
  const { job_id } = useParams<{ job_id: string }>();
  const [loading, setLoading] = useState(true);
  const [resultsData, setResultsData] = useState<ResultsData | null>(null);
  const [selectedResult, setSelectedResult] = useState<StudentResult | null>(
    null
  );
  const [isAnswerSheetModalOpen, setIsAnswerSheetModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

  useEffect(() => {
    const fetchResults = async () => {
      if (!job_id) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch job info
        const jobResponse = await fetch(
          `${BACKEND_URL}/api/markings/${job_id}/results`
        );
        if (!jobResponse.ok) {
          throw new Error("Failed to fetch job information");
        }
        const jobInfo: JobInfo = await jobResponse.json();

        const resultsResponse = await fetch(
          `${BACKEND_URL}/api/files/download?method=file_id&file_id=${jobInfo.result_sheet_file_id}`
        );
        if (!resultsResponse.ok) {
          throw new Error("Failed to fetch results");
        }
        const resultsBlob = await resultsResponse.blob();

        const results = await _convertBlobToStudentResults(resultsBlob);

        const markingScheme = await getMarkingSchemeBubbleData(jobInfo.marking_config_id);

        const resultsData: ResultsData = {
          job_info: jobInfo,
          marking_scheme: markingScheme,
          results: results,
          total_answer_sheets: results.length,
          processed_answer_sheets: results.length,
          failed_answer_sheets: 0,
        };

        setResultsData(resultsData);
      } catch (err) {
        console.error("Error fetching results:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch results"
        );
        showToast("Failed to load results", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [job_id, BACKEND_URL, showToast]);

  const handleViewMarkedPaper = (result: StudentResult) => {
    setSelectedResult(result);
    setIsAnswerSheetModalOpen(true);
  };

  const handleGoBack = () => {
    router.push("/marking-jobs");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <FontAwesomeIcon
            icon={faSpinner}
            className="h-8 w-8 animate-spin text-blue-600 mb-4"
          />
          <p className="text-gray-600">Loading results...</p>
        </div>
      </div>
    );
  }

  if (error || !resultsData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <p className="text-lg font-medium">Error Loading Results</p>
            <p className="text-sm">{error || "No data available"}</p>
          </div>
          <Button onClick={handleGoBack}>Go Back to Marking Jobs</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="secondary"
            icon={<FontAwesomeIcon icon={faArrowLeft} className="h-4 w-4" />}
            onClick={handleGoBack}
          >
            Back to Jobs
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">
            Results: {resultsData.job_info.name}
          </h1>
        </div>
      </div>

      {/* Job Information Section */}
      <JobInfoSection jobInfo={resultsData.job_info} />

      {/* Results Table */}
      <ResultsTable
        results={resultsData.results}
        onViewMarkedPaper={handleViewMarkedPaper}
      />
      {selectedResult && (
        <AnswerSheetModal
          isOpen={isAnswerSheetModalOpen}
          onClose={() => {
            console.log("onClose");
            setIsAnswerSheetModalOpen(false);
            setSelectedResult(null);
          }}
          result={selectedResult}
          updateResult={setSelectedResult}
          markingScheme={resultsData.marking_scheme}
        />
      )}
    </div>
  );
};

export default ResultsPage;
