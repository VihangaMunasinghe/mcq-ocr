import React from "react";
import Image from "next/image";
import { Input } from "../../../../components/UI/Input";
import { Select } from "../../../../components/UI/Select";
import { Card } from "../../../../components/UI/Card";
import { Template } from "@/models/template";
import { MarkingJobForm, JobPriority } from "./types";

interface MetadataStepProps {
  formData: MarkingJobForm;
  errors: Partial<Record<keyof MarkingJobForm, string>>;
  templates: Template[];
  loadingTemplates: boolean;
  templatesError: string | null;
  onInputChange: (field: keyof MarkingJobForm, value: string | boolean) => void;
}

export function MetadataStep({
  formData,
  errors,
  templates,
  loadingTemplates,
  templatesError,
  onInputChange,
}: MetadataStepProps) {
  const templateOptions = loadingTemplates
    ? [{ value: "", label: "Loading templates..." }]
    : templatesError
    ? [{ value: "", label: "Error loading templates" }]
    : templates.length === 0
    ? [{ value: "", label: "No templates available" }]
    : templates
        .filter((template) => template.status === "completed")
        .map((template) => ({
          value: template.id.toString(),
          label: `${template.name} (${template.num_questions} questions)`,
        }));

  return (
    <div className="space-y-8">
      {/* Error Summary */}
      {(errors.name || errors.template_id) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Please fix the following errors:
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <ul className="list-disc pl-5 space-y-1">
                  {errors.name && <li>{errors.name}</li>}
                  {errors.template_id && <li>{errors.template_id}</li>}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Left Column - Form Fields */}
        <Card className="h-fit">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-6">
                Job Information
              </h3>

              <div className="space-y-6">
                <Input
                  label="Job Name"
                  placeholder="e.g., Math Quiz - Grade 10"
                  value={formData.name}
                  onChange={(e) => onInputChange("name", e.target.value)}
                  error={errors.name}
                  required
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    rows={3}
                    placeholder="Optional description for this marking job"
                    value={formData.description}
                    onChange={(e) =>
                      onInputChange("description", e.target.value)
                    }
                  />
                </div>

                <Select
                  label="Priority"
                  value={formData.priority}
                  onChange={(e) =>
                    onInputChange("priority", e.target.value as JobPriority)
                  }
                  options={[
                    { value: "normal", label: "Normal" },
                    { value: "urgent", label: "Urgent" },
                  ]}
                  error={errors.priority}
                />

                <Select
                  label="Template"
                  value={formData.template_id}
                  onChange={(e) => onInputChange("template_id", e.target.value)}
                  options={templateOptions}
                  disabled={
                    loadingTemplates ||
                    !!templatesError ||
                    templates.length === 0
                  }
                  error={errors.template_id}
                  required
                />

                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      type="checkbox"
                      id="save_intermediate_results"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      checked={formData.save_intermediate_results}
                      onChange={(e) =>
                        onInputChange(
                          "save_intermediate_results",
                          e.target.checked
                        )
                      }
                    />
                  </div>
                  <div className="ml-3">
                    <label
                      htmlFor="save_intermediate_results"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Save intermediate results
                    </label>
                    <p className="text-sm text-gray-500 mt-1">
                      Store progress periodically during processing for recovery
                      if interrupted.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Right Column - Template Preview */}
        <Card
          title="Template Preview"
          subtitle="Preview of selected template"
          className="h-fit"
        >
          <div className="space-y-6">
            {formData.template_id && templates.length > 0 ? (
              (() => {
                const selectedTemplate = templates.find(
                  (t) => t.id.toString() === formData.template_id
                );
                if (selectedTemplate) {
                  const templateImageUrl = selectedTemplate.template_file_path
                    ? `${
                        process.env.NEXT_PUBLIC_BACKEND_URL ||
                        "http://localhost:8000"
                      }/api/files/${selectedTemplate.template_file_path}`
                    : null;

                  return (
                    <div className="space-y-4">
                      {/* Template Info */}
                      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="font-medium text-gray-900">
                            {selectedTemplate.name}
                          </h5>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {selectedTemplate.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Questions:</span>
                            <span className="text-gray-900 font-medium">
                              {selectedTemplate.num_questions}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Options:</span>
                            <span className="text-gray-900 font-medium">
                              {selectedTemplate.options_per_question}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Template Image */}
                      <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                        {templateImageUrl ? (
                          <div className="relative">
                            <Image
                              src={templateImageUrl}
                              alt={`Template: ${selectedTemplate.name}`}
                              width={400}
                              height={300}
                              className="w-full h-auto max-h-64 object-contain"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = "none";
                                const parent = target.parentElement;
                                if (parent) {
                                  parent.innerHTML = `
                                    <div class="flex flex-col items-center justify-center py-8 text-gray-500">
                                      <svg class="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                      </svg>
                                      <p class="text-sm">Template image not available</p>
                                    </div>
                                  `;
                                }
                              }}
                            />
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                            <svg
                              className="w-8 h-8 mb-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                            <p className="text-sm">No image available</p>
                          </div>
                        )}
                      </div>

                      {/* Template Details */}
                      {selectedTemplate.description && (
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <h6 className="font-medium text-gray-900 mb-2">
                            Description
                          </h6>
                          <p className="text-sm text-gray-700">
                            {selectedTemplate.description}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              })()
            ) : (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg
                    className="w-6 h-6 text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h5 className="text-lg font-medium text-gray-900 mb-2">
                  No Template Selected
                </h5>
                <p className="text-gray-500 text-sm">
                  Select a template above to see its preview.
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
