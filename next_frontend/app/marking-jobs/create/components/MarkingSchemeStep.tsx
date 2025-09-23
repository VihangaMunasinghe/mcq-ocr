import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import { FileUpload } from "../../../../components/UI/FileUpload";

interface MarkingSchemeStepProps {
  markingSchemeFile: File | null;
  error?: string;
  onFileChange: (file: File | null) => void;
}

export function MarkingSchemeStep({
  markingSchemeFile,
  error,
  onFileChange,
}: MarkingSchemeStepProps) {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Marking Scheme
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Upload your marking scheme image that will be used as the answer key
          for automatic grading.
        </p>
      </div>

      <div className="max-w-3xl mx-auto space-y-6">
        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
          <FileUpload
            label="Upload Marking Scheme *"
            hint="Upload an image file (JPG, JPEG, PNG) containing your marking scheme"
            accept=".jpg,.jpeg,.png"
            maxFiles={1}
            maxSize={10 * 1024 * 1024} // 10MB
            onFilesChange={(files) => onFileChange(files[0] || null)}
            error={error}
          />
        </div>

        {markingSchemeFile && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <FontAwesomeIcon
                  icon={faCheck}
                  className="h-5 w-5 text-blue-400"
                />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Marking Scheme Ready
                </h3>
                <p className="mt-2 text-sm text-blue-700">
                  File "{markingSchemeFile.name}" has been uploaded and will be
                  processed when you create the job.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
