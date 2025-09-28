import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import { FileUpload } from "../../../../components/UI/FileUpload";

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
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Answer Sheets
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Upload a ZIP file containing all the answer sheets you want to mark
          automatically.
        </p>
      </div>

      <div className="max-w-3xl mx-auto space-y-6">
        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
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
                  File "{answerSheetsFile.name}" has been uploaded. All files
                  are ready - click "Start Marking" to begin the automatic
                  grading process.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
