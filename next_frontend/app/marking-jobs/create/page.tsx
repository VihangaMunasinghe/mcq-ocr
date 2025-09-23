"use client";

import { useState, useEffect, useCallback } from "react";
import { ProtectedRoute } from "../../../components/ProtectedRoute";
import MainLayout from "../../../components/Layout/MainLayout";
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

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;

    setIsSubmitting(true);

    try {
      // Upload marking scheme file first
      const marking_file_formData = new FormData();
      marking_file_formData.append("file", formData.markingSchemeFile!);
      marking_file_formData.append("file_type", "marking_scheme");

      const uploadResponse = await fetch(`${BACKEND_URL}/files/upload`, {
        method: "POST",
        body: marking_file_formData,
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload marking scheme file");
      }

      const uploadData = await uploadResponse.json();
      const marking_filePath = uploadData.path;

      // Upload answer sheets file
      const answer_sheets_formData = new FormData();
      answer_sheets_formData.append("file", formData.answerSheetsFile!);
      answer_sheets_formData.append("file_type", "answer_sheet");

      const zip_uploadResponse = await fetch(`${BACKEND_URL}/files/upload`, {
        method: "POST",
        body: answer_sheets_formData,
      });

      if (!zip_uploadResponse.ok) {
        throw new Error("Failed to upload answer sheets file");
      }

      const zip_uploadData = await zip_uploadResponse.json();
      const answer_sheets_folderPath = zip_uploadData.path;

      // Create marking job
      const marking_job_payload = {
        name: formData.name,
        description: formData.description,
        template_id: parseInt(formData.template_id, 10),
        marking_scheme_path: marking_filePath,
        answer_sheets_folder_path: answer_sheets_folderPath,
        save_intermediate_results: formData.save_intermediate_results,
        priority: formData.priority,
      };

      const processResponse = await fetch(`${BACKEND_URL}/markings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(marking_job_payload),
      });

      if (!processResponse.ok) {
        throw new Error("Failed to create marking job");
      }

      const processData = await processResponse.json();
      console.log("Marking job created successfully:", processData);

      showToast("Marking job created successfully", "success");

      // Redirect to marking jobs page
      window.location.href = "/marking-jobs";
    } catch (err) {
      console.error("Error creating marking job:", err);
      showToast(
        err instanceof Error ? err.message : "Failed to create marking job",
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
    <ProtectedRoute>
      <MainLayout>
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <Button
                variant="ghost"
                size="sm"
                icon={
                  <FontAwesomeIcon icon={faArrowLeft} className="h-4 w-4" />
                }
                onClick={() => (window.location.href = "/marking-jobs")}
              >
                Back to Jobs
              </Button>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              Create New Marking Job
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Follow the steps below to create and start a new marking job.
            </p>
          </div>

          {/* Progress Steps */}
          <ProgressSteps steps={steps} currentStep={currentStep} />

          {/* Step Content */}
          <div className="bg-white shadow rounded-lg flex-1 flex flex-col">
            <div className="px-6 py-8 flex-1">{renderStepContent()}</div>

            {/* Navigation */}
            <NavigationButtons
              currentStep={currentStep}
              totalSteps={steps.length}
              isSubmitting={isSubmitting}
              onPrevStep={prevStep}
              onNextStep={nextStep}
              onSubmit={handleSubmit}
            />
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}
