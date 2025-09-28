import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faCog } from "@fortawesome/free-solid-svg-icons";
import { FileUpload } from "../../../../components/UI/FileUpload";
import { Button } from "../../../../components/UI/Button";

interface MarkingSchemeStepProps {
  markingSchemeFile: File | null;
  error?: string;
  onFileChange: (file: File | null) => void;
  onConfigure: () => void;
  isConfiguring: boolean;
  markingJobId: number | null;
}

export function MarkingSchemeStep({
  markingSchemeFile,
  error,
  onFileChange,
  onConfigure,
  isConfiguring,
  markingJobId,
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
            <div className="flex justify-between items-start">
              <div className="flex">
                <div className="flex-shrink-0">
                  <FontAwesomeIcon
                    icon={faCheck}
                    className="h-5 w-5 text-blue-400"
                  />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Marking Scheme Selected
                  </h3>
                  <p className="mt-2 text-sm text-blue-700">
                    File "{markingSchemeFile.name}" is ready to be uploaded and
                    configured.
                  </p>
                </div>
              </div>
              <div className="flex-shrink-0 ml-4">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={onConfigure}
                  disabled={!markingJobId || isConfiguring}
                  loading={isConfiguring}
                  icon={<FontAwesomeIcon icon={faCog} className="h-4 w-4" />}
                >
                  {isConfiguring ? "Configuring..." : "Configure"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {!markingJobId && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-amber-800">
                  Complete Previous Step
                </h3>
                <p className="mt-2 text-sm text-amber-700">
                  You need to complete the metadata step first before uploading
                  the marking scheme.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
