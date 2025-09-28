"use client";

import { useState } from "react";
import { Button } from "../../../components/UI/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faFileText,
  faUpload,
  faPlay,
} from "@fortawesome/free-solid-svg-icons";
import {
  ProgressSteps,
  MetadataStep,
  MarkingSchemeStep,
  AnswerSheetsStep,
  MarkingJobForm,
  Step,
  NavigationButtons,
} from "./components";
import CreateMarkingProvider from "@/hooks/useCreateMarking";
import { useRouter } from "next/navigation";

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

function CreateMarkingJobContent() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState<MarkingJobForm>({
    name: "",
    description: "",
    priority: "normal",
    template_id: "",
    markingSchemeFile: null,
    answerSheetsFile: null,
    save_intermediate_results: false,
  });

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
    setCurrentStep((prev) => Math.min(prev + 1, steps.length));
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const renderStepContent = () => {
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
            onNext={nextStep}
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
    <>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="flex items-center mb-2">
            <Button
              variant="ghost"
              size="sm"
              icon={<FontAwesomeIcon icon={faArrowLeft} className="h-4 w-4" />}
              onClick={() => router.push("/marking-jobs")}
            >
              Back to Jobs
            </Button>
          </div>
          <h2 className="text-xl font-semibold text-gray-900">
            Create New Marking Job
          </h2>
        </div>
      </div>

      {/* Description Card */}
      <div className="bg-white p-4 rounded-md shadow-sm mb-6">
        <p className="text-sm text-gray-600">
          Follow the steps below to create and start a new marking job. Upload
          your marking scheme and answer sheets to begin automatic grading.
        </p>
      </div>

      {/* Progress Steps */}
      <div className="mb-6">
        <ProgressSteps steps={steps} currentStep={currentStep} />
      </div>

      {/* Step Content */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="p-6">{renderStepContent()}</div>

        {/* Navigation */}

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
          <NavigationButtons
            currentStep={currentStep}
            totalSteps={steps.length}
            isSubmitting={false}
            onPrevStep={prevStep}
            onNextStep={nextStep}
            onSubmit={() => {}}
            hideNext={currentStep === 2}
          />
        </div>
      </div>
    </>
  );
}

export default function CreateMarkingJob() {
  return (
    <CreateMarkingProvider>
      <CreateMarkingJobContent />
    </CreateMarkingProvider>
  );
}
