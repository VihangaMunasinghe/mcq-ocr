"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "../../../components/UI/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faFileText,
  faUpload,
  faPlay,
} from "@fortawesome/free-solid-svg-icons";
import CreateMarkingProvider, {
  useCreateMarking,
} from "@/hooks/useCreateMarking";
import { useToast } from "@/hooks/useToast";
import { useRouter } from "next/navigation";
import axiosInstance from "@/utils/axiosclient";
import {
  MarkingJobForm,
  Step,
  MarkingJob,
  JobPriority,
  MarkingJobStatus,
} from "../types/types";
import { MetadataStep } from "./components/MetadataStep";
import { MarkingSchemeStep } from "./components/MarkingSchemeStep";
import { AnswerSheetsStep } from "./components/AnswerSheetsStep";
import { ProgressSteps } from "./components/ProgressSteps";
import { NavigationButtons } from "./components/NavigationButtons";

const steps: Step[] = [
  {
    id: 1,
    title: "Job Metadata",
    description: "Basic information about your marking job",
    icon: faFileText,
  },
  {
    id: 2,
    title: "Marking Scheme",
    description: "Upload and configure marking scheme",
    icon: faUpload,
  },
  {
    id: 3,
    title: "Answer Sheets",
    description: "Upload answer sheets and start marking",
    icon: faPlay,
  },
];

// Utility function to check if a step is accessible based on job status
const isStepAccessible = (
  stepNumber: number,
  jobStatus: MarkingJobStatus | null
): boolean => {
  if (!jobStatus) return stepNumber === 1; // Only first step accessible for new jobs

  switch (stepNumber) {
    case 1: // Metadata step - always accessible
      return true;
    case 2: // Marking Scheme step - accessible if job is initialized or above
      return [
        MarkingJobStatus.INITIALIZED,
        MarkingJobStatus.MARKING_SCHEME_CONFIGURED,
        MarkingJobStatus.MARKING_SCHEME_VERIFIED,
        MarkingJobStatus.ANSWER_SHEETS_ATTACHED,
        MarkingJobStatus.QUEUED,
        MarkingJobStatus.PROCESSING,
        MarkingJobStatus.COMPLETED,
        MarkingJobStatus.FAILED,
        MarkingJobStatus.CANCELLED,
      ].includes(jobStatus);
    case 3: // Answer Sheets step - accessible if marking scheme is verified or above
      return [
        MarkingJobStatus.MARKING_SCHEME_VERIFIED,
        MarkingJobStatus.ANSWER_SHEETS_ATTACHED,
        MarkingJobStatus.QUEUED,
        MarkingJobStatus.PROCESSING,
        MarkingJobStatus.COMPLETED,
        MarkingJobStatus.FAILED,
        MarkingJobStatus.CANCELLED,
      ].includes(jobStatus);
    default:
      return false;
  }
};

function CreateMarkingJobContent() {
  const searchParams = useSearchParams();
  const markingJobIdString = searchParams.get("markingJobId");
  const markingJobId = markingJobIdString ? parseInt(markingJobIdString) : null;

  const router = useRouter();
  const { showToast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [markingJob, setMarkingJob] = useCreateMarking();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<MarkingJobForm>({
    name: "",
    description: "",
    priority: "normal",
    template_id: "",
    markingSchemeFile: null,
    answerSheetsFile: null,
    save_intermediate_results: false,
  });

  useEffect(() => {
    async function fetchMarkingJob(jobId: number) {
      setIsLoading(true);
      try {
        const response = await axiosInstance.get(`/api/markings/${jobId}`);
        const data: MarkingJob = response.data as MarkingJob;
        console.log("Fetched marking job:", data);

        // Map MarkingJob to MarkingJobForm
        setFormData({
          name: data.name || "",
          description: data.description || "",
          priority: (data.priority as JobPriority) || "normal",
          template_id: data.template_id?.toString() || "",
          markingSchemeFile: null, // Files can't be fetched, user needs to re-upload if needed
          answerSheetsFile: null,
          save_intermediate_results: data.save_intermediate_results || false,
        });

        setMarkingJob(data);
      } catch (error) {
        console.error("Failed to fetch marking job:", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (markingJobId) {
      fetchMarkingJob(markingJobId as number);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markingJobId]);

  const [errors, setErrors] = useState<
    Partial<Record<keyof MarkingJobForm, string>>
  >({});

  const handleInputChange = (
    field: keyof MarkingJobForm,
    value: string | boolean | File | null
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const nextStep = () => {
    const nextStepNumber = Math.min(currentStep + 1, steps.length);

    // Special handling for step 1 to 2 transition - allow if job has been created/updated
    if (currentStep === 1) {
      setCurrentStep(nextStepNumber);
      return;
    }

    // For other steps, check accessibility based on status
    if (isStepAccessible(nextStepNumber, markingJob?.status || null)) {
      setCurrentStep(nextStepNumber);
    } else {
      showToast("Complete the previous step before proceeding", "warning");
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const renderStepContent = () => {
    // Check if current step is accessible based on job status
    if (!isStepAccessible(currentStep, markingJob?.status || null)) {
      return (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <FontAwesomeIcon icon={faFileText} className="h-12 w-12" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Step Not Available
          </h3>
          <p className="text-gray-600 mb-4">
            Complete the previous steps to access this step.
          </p>
          <p className="text-sm text-gray-500">
            Current status: {markingJob?.status || "Not started"}
          </p>
        </div>
      );
    }

    switch (currentStep) {
      case 1:
        return (
          <MetadataStep
            formData={formData}
            errors={errors}
            onInputChange={handleInputChange}
            onNext={nextStep}
            isSubmitting={false}
          />
        );

      case 2:
        return (
          <MarkingSchemeStep
            markingSchemeFile={formData.markingSchemeFile}
            error={errors.markingSchemeFile}
            onFileChange={(file) =>
              handleInputChange("markingSchemeFile", file)
            }
          />
        );

      case 3:
        return (
          <AnswerSheetsStep
            answerSheetsFile={formData.answerSheetsFile}
            error={errors.answerSheetsFile}
            onFileChange={(file) => handleInputChange("answerSheetsFile", file)}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="space-y-6">
        {/* Page Header - Match main page design */}
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center mb-2">
                <Button
                  variant="ghost"
                  size="sm"
                  icon={
                    <FontAwesomeIcon icon={faArrowLeft} className="h-4 w-4" />
                  }
                  onClick={() => router.push("/marking-jobs")}
                  className="text-gray-600 hover:text-gray-900 mr-2"
                >
                  Back to Jobs
                </Button>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                {markingJobId ? "Edit Marking Job" : "Create New Marking Job"}
              </h1>
              <p className="text-gray-600 mt-1">
                Follow the steps below to create and start a new marking job
              </p>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <ProgressSteps
          steps={steps}
          currentStep={currentStep}
          jobStatus={markingJob?.status || null}
          isStepAccessible={isStepAccessible}
        />

        {/* Step Content */}
        {isLoading ? (
          <div className="bg-white rounded-lg border border-gray-100 p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading marking job...</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-100 shadow-sm">
            <div className="p-6">{renderStepContent()}</div>

            {/* Navigation */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
              <NavigationButtons
                currentStep={currentStep}
                totalSteps={steps.length}
                onPrevStep={prevStep}
                onNextStep={nextStep}
                hideNext={false}
                disableNext={
                  !isStepAccessible(
                    currentStep + 1,
                    markingJob?.status || null
                  ) && currentStep < steps.length
                }
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CreateMarkingJob() {
  return (
    <div className="min-h-screen bg-gray-50">
      <CreateMarkingProvider>
        <Suspense
          fallback={
            <div className="bg-white rounded-lg border border-gray-100 p-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-500">Loading...</p>
            </div>
          }
        >
          <CreateMarkingJobContent />
        </Suspense>
      </CreateMarkingProvider>
    </div>
  );
}
