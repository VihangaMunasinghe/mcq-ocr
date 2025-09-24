"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../../../components/UI/Button";
import { useToast } from "../../../hooks/useToast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faFileText,
  faUpload,
  faPlay,
} from "@fortawesome/free-solid-svg-icons";
import { Template } from "@/models/template";
import {
  ProgressSteps,
  MetadataStep,
  MarkingSchemeStep,
  AnswerSheetsStep,
  NavigationButtons,
  MarkingJobForm,
  Step,
} from "./components";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000/api";

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

export default function CreateMarkingJob() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [templatesError, setTemplatesError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  const [formData, setFormData] = useState<MarkingJobForm>({
    name: "",
    description: "",
    priority: "normal",
    template_id: "",
    markingSchemeFile: null,
    answerSheetsFile: null,
    save_intermediate_results: false,
  });

  const [markingJobId, setMarkingJobId] = useState<number | null>(null);
  const [markingSchemeFileId, setMarkingSchemeFileId] = useState<number | null>(
    null
  );
  const [answerSheetsFileId, setAnswerSheetsFileId] = useState<number | null>(
    null
  );

  const [errors, setErrors] = useState<
    Partial<Record<keyof MarkingJobForm, string>>
  >({});

  const fetchTemplates = useCallback(async () => {
    try {
      setLoadingTemplates(true);
      setTemplatesError(null);

      const params = new URLSearchParams({
        skip: "0",
        limit: "20",
      });

      const response = await fetch(`${BACKEND_URL}/templates?${params}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch templates: ${response.statusText}`);
      }

      const data = await response.json();
      setTemplates(data);

      // Set default template if available
      if (data.length > 0) {
        setFormData((prev) => ({
          ...prev,
          template_id: data[0].id.toString(),
        }));
      }
    } catch (err) {
      console.error("Error fetching templates:", err);
      setTemplatesError(
        err instanceof Error ? err.message : "Failed to fetch templates"
      );
      showToast("Failed to load templates", "error");
    } finally {
      setLoadingTemplates(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

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

  const validateStep = (step: number): boolean => {
    const newErrors: Partial<Record<keyof MarkingJobForm, string>> = {};

    switch (step) {
      case 1:
        if (!formData.name.trim()) {
          newErrors.name = "Job name is required";
        }
        if (!formData.template_id) {
          newErrors.template_id = "Template selection is required";
        }
        break;
      case 2:
        if (!formData.markingSchemeFile) {
          newErrors.markingSchemeFile = "Marking scheme file is required";
        }
        break;
      case 3:
        if (!formData.answerSheetsFile) {
          newErrors.answerSheetsFile = "Answer sheets file is required";
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = async () => {
    if (!validateStep(currentStep)) return;

    // Step 1: Create marking job with metadata
    if (currentStep === 1) {
      setIsSubmitting(true);
      try {
        const marking_job_payload = {
          name: formData.name,
          description: formData.description,
          template_id: parseInt(formData.template_id, 10),
          save_intermediate_results: formData.save_intermediate_results,
          priority: formData.priority,
        };

        const response = await fetch(`${BACKEND_URL}/markings`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(marking_job_payload),
        });

        if (!response.ok) {
          throw new Error("Failed to create marking job");
        }

        const data = await response.json();
        setMarkingJobId(data.id);
        console.log("Marking job created successfully:", data);
        showToast("Marking job created successfully", "success");

        setCurrentStep((prev) => Math.min(prev + 1, steps.length));
      } catch (err) {
        console.error("Error creating marking job:", err);
        showToast(
          err instanceof Error ? err.message : "Failed to create marking job",
          "error"
        );
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleMarkingSchemeUploadAndConfigure = async () => {
    if (!markingJobId || !formData.markingSchemeFile) {
      showToast("Missing marking job ID or file", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      // Upload marking scheme file
      const marking_file_formData = new FormData();
      marking_file_formData.append("file", formData.markingSchemeFile);
      marking_file_formData.append("file_type", "marking_scheme");

      const uploadResponse = await fetch(`${BACKEND_URL}/files/upload`, {
        method: "POST",
        body: marking_file_formData,
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload marking scheme file");
      }

      const uploadData = await uploadResponse.json();
      setMarkingSchemeFileId(uploadData.id);

      // Configure marking job with the uploaded file
      const configureResponse = await fetch(
        `${BACKEND_URL}/markings/${markingJobId}/configure`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ marking_scheme_id: uploadData.id }),
        }
      );

      if (!configureResponse.ok) {
        throw new Error("Failed to configure marking scheme");
      }

      const configureData = await configureResponse.json();
      console.log("Marking scheme configured successfully:", configureData);
      showToast(
        "Marking scheme uploaded and configured successfully",
        "success"
      );

      setCurrentStep((prev) => Math.min(prev + 1, steps.length));
    } catch (err) {
      console.error("Error uploading/configuring marking scheme:", err);
      showToast(
        err instanceof Error
          ? err.message
          : "Failed to upload/configure marking scheme",
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(3) || !markingJobId || !formData.answerSheetsFile) {
      showToast("Missing required data", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload answer sheets file
      const answer_sheets_formData = new FormData();
      answer_sheets_formData.append("file", formData.answerSheetsFile);
      answer_sheets_formData.append("file_type", "answer_sheets_folder");

      const uploadResponse = await fetch(`${BACKEND_URL}/files/upload`, {
        method: "POST",
        body: answer_sheets_formData,
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload answer sheets file");
      }

      const uploadData = await uploadResponse.json();
      setAnswerSheetsFileId(uploadData.id);

      // Attach answer sheets to marking job
      const attachResponse = await fetch(
        `${BACKEND_URL}/markings/${markingJobId}/answer-sheets`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answer_sheets_folder_id: uploadData.id }),
        }
      );

      if (!attachResponse.ok) {
        throw new Error("Failed to attach answer sheets");
      }

      // Start the marking process
      const startResponse = await fetch(
        `${BACKEND_URL}/markings/${markingJobId}/start`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!startResponse.ok) {
        throw new Error("Failed to start marking process");
      }

      const startData = await startResponse.json();
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

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <MetadataStep
            formData={formData}
            errors={errors}
            templates={templates}
            loadingTemplates={loadingTemplates}
            templatesError={templatesError}
            onInputChange={handleInputChange}
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
            onConfigure={handleMarkingSchemeUploadAndConfigure}
            isConfiguring={isSubmitting}
            markingJobId={markingJobId}
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
            isSubmitting={isSubmitting}
            onPrevStep={prevStep}
            onNextStep={nextStep}
            onSubmit={handleSubmit}
            hideNext={currentStep === 2}
          />
        </div>
      </div>
    </>
  );
}
