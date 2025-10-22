import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faPlay } from "@fortawesome/free-solid-svg-icons";
import { FileUpload } from "../../../../components/UI/FileUpload";
import { useCreateMarking } from "../../../../hooks/useCreateMarking";
import { useToast } from "../../../../hooks/useToast";
import { useRouter } from "next/navigation";
import { MarkingJob } from "../../types/types";
import axiosInstance from "@/utils/axiosclient";

interface AnswerSheetsStepProps {
  answerSheetsFile: File | null;
  error?: string;
  onFileChange: (file: File | null) => void;
}

export function AnswerSheetsStep({
  answerSheetsFile,
  error,
  onFileChange,
}: AnswerSheetsStepProps) {
  const [markingJob, setMarkingJob] = useCreateMarking();
  const { showToast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Added state for optional data file (CSV/XLSX)
  const [dataFile, setDataFile] = useState<File | null>(null);

  const BACKEND_URL =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

  const validateStep = (): boolean => {
    return answerSheetsFile !== null;
  };

  const handleSubmit = async () => {
    if (!validateStep() || !markingJob.id || !answerSheetsFile) {
      showToast("Missing required data", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload answer sheets file
      const answer_sheets_formData = new FormData();
      answer_sheets_formData.append("file", answerSheetsFile);
      answer_sheets_formData.append("file_type", "answer_sheet");

      const uploadResponse = await axiosInstance.post(
        "/api/files/upload",
        answer_sheets_formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const uploadData = uploadResponse.data as { file_id: number };
      setMarkingJob((prev: MarkingJob) => ({
        ...prev,
        answer_sheets_folder_id: uploadData.file_id,
      }));

      // Attempt to upload optional data file (CSV/XLSX) — do not block the main flow if this fails
      if (dataFile) {
        try {
          const data_formData = new FormData();
          data_formData.append("file", dataFile);
          data_formData.append("file_type", "data_file");

          const dataUploadResp = await fetch(`${BACKEND_URL}/api/files/upload`, {
            method: "POST",
            body: data_formData,
          });

          if (!dataUploadResp.ok) {
            // show error but don't throw so the main flow continues
            showToast("Failed to upload optional data file", "error");
          } else {
            const dataUploadData = await dataUploadResp.json();
            showToast("Index Number data file uploaded", "success");
            console.log("Index Number data file uploaded with ID:", dataUploadData.file_id);
            console.log("Please implement the attacher here, or I will forget!");
            // attach-index-list endpoint
            const fileAttachResponse = await fetch(
              `${BACKEND_URL}/api/markings/${markingJob.id}/attach-index-list`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ index_list_file_id: dataUploadData.file_id }),
              }
            );
            if (!fileAttachResponse.ok) {
              showToast("Failed to attach index number data file", "error");
            }
          }
        } catch (e) {
          // Non-fatal: inform user but continue
          showToast(
            e instanceof Error ? e.message : "Error uploading index number data file",
            "error"
          );
        }
      }

      // Attach answer sheets to marking job
      const attachResponse = await fetch(
        `${BACKEND_URL}/api/markings/${markingJob.id}/attach-answer-sheets`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answer_sheets_folder_id: uploadData.file_id }),
        }
      );

      if (!attachResponse.ok) {
        throw new Error("Failed to attach answer sheets");
      }

      // Start the marking process
      const startResponse = await axiosInstance.post(
        `/api/markings/${markingJob.id}/start-marking`
      );

      const startData = startResponse.data;
      console.log("Marking process started successfully:", startData);

      showToast("Marking process started successfully", "success");

      // Redirect to marking jobs page
      router.push("/marking-jobs");
    } catch (err) {
      console.error("Error starting marking process:", err);
      showToast(
        err instanceof Error ? err.message : "Failed to start marking process",
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Answer Sheets
        </h3>
        <p className="text-sm text-gray-600">
          Upload a ZIP file containing all the answer sheets you want to mark
          automatically.
        </p>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6">
          <h4 className="text-base font-semibold text-gray-900 mb-4">
            Upload Answer Sheets
          </h4>
          <FileUpload
            label="Upload Answer Sheets *"
            hint="Upload a ZIP file containing all answer sheets to be marked"
            accept=".zip"
            maxFiles={1}
            maxSize={200 * 1024 * 1024} // 200MB
            onFilesChange={(files) => onFileChange(files[0] || null)}
            error={error}
          />
        </div>

        {/* Index List File Upload Section */}
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6">
          <h4 className="text-base font-semibold text-gray-900 mb-4">
            Index List File
          </h4>
          <FileUpload
            label="Upload Data File (CSV or XLSX)"
            hint="Upload a file containting all available stundent index numbers under 'Index No' column."
            accept=".csv,.xlsx"
            maxFiles={1}
            maxSize={10 * 1024 * 1024} // 10MB
            onFilesChange={(files) => setDataFile(files[0] || null)}
            error={undefined}
          />
          {dataFile && (
            <p className="mt-2 text-sm text-gray-600">Selected: {dataFile.name}</p>
          )}
        </div>

        {answerSheetsFile && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <FontAwesomeIcon
                  icon={faCheck}
                  className="h-5 w-5 text-green-400"
                />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">
                  Ready to Start Marking
                </h3>
                <p className="mt-2 text-sm text-green-700">
                  File &quot;{answerSheetsFile.name}&quot; has been uploaded.
                  All files are ready - click &quot;Start Marking&quot; to begin
                  the automatic grading process.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Start Marking Button */}
        {answerSheetsFile && (
          <div className="flex justify-end mt-8">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !validateStep()}
              className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FontAwesomeIcon icon={faPlay} className="mr-2 h-4 w-4" />
              {isSubmitting ? "Starting Marking..." : "Start Marking Process"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
