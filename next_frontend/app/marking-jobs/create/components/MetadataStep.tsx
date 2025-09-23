import React from "react";
import { Input } from "../../../../components/UI/Input";
import { Select } from "../../../../components/UI/Select";
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
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1">
        <h3 className="text-lg font-medium text-gray-900 mb-6">
          Job Information
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Left Column - All Form Fields */}
          <div className="space-y-6">
            <Input
              label="Job Name *"
              placeholder="e.g., Math Quiz - Grade 10"
              value={formData.name}
              onChange={(e) => onInputChange("name", e.target.value)}
              error={errors.name}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                rows={4}
                placeholder="Optional description for this marking job"
                value={formData.description}
                onChange={(e) => onInputChange("description", e.target.value)}
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
            />

            <Select
              label="Template *"
              value={formData.template_id}
              onChange={(e) => onInputChange("template_id", e.target.value)}
              options={
                loadingTemplates
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
                      }))
              }
              disabled={
                loadingTemplates || !!templatesError || templates.length === 0
              }
              error={errors.template_id}
            />

            <div className="flex items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
              <input
                type="checkbox"
                id="save_intermediate_results"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                checked={formData.save_intermediate_results}
                onChange={(e) =>
                  onInputChange("save_intermediate_results", e.target.checked)
                }
              />
              <label
                htmlFor="save_intermediate_results"
                className="ml-3 block text-sm text-gray-900"
              >
                Save intermediate results during processing
              </label>
            </div>
          </div>

          {/* Right Column - Template Image Preview */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200 h-full">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                Template Preview
              </h4>

              {formData.template_id && templates.length > 0 ? (
                (() => {
                  const selectedTemplate = templates.find(
                    (t) => t.id.toString() === formData.template_id
                  );
                  if (selectedTemplate) {
                    const templateImageUrl = selectedTemplate.template_file_id
                      ? `${
                          process.env.NEXT_PUBLIC_BACKEND_URL ||
                          "http://localhost:8000"
                        }/api/files/${selectedTemplate.template_file_id}`
                      : null;

                    return (
                      <div className="space-y-4">
                        {/* Template Info Header */}
                        <div className="bg-white rounded-lg p-4 border border-blue-100 shadow-sm">
                          <h5 className="font-medium text-gray-900 mb-2">
                            {selectedTemplate.name}
                          </h5>
                          <div className="flex items-center justify-between text-sm text-gray-600">
                            <span>
                              {selectedTemplate.num_questions} questions
                            </span>
                            <span>
                              {selectedTemplate.options_per_question} options
                              each
                            </span>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {selectedTemplate.status}
                            </span>
                          </div>
                        </div>

                        {/* Template Image Preview */}
                        <div className="bg-white rounded-lg border border-blue-100 shadow-sm overflow-hidden">
                          {templateImageUrl ? (
                            <div className="relative">
                              <img
                                src={templateImageUrl}
                                alt={`Template: ${selectedTemplate.name}`}
                                className="w-full h-auto max-h-96 object-contain bg-gray-50"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = "none";
                                  const parent = target.parentElement;
                                  if (parent) {
                                    parent.innerHTML = `
                                      <div class="flex flex-col items-center justify-center py-12 text-gray-500">
                                        <svg class="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <p class="text-sm">Image not available</p>
                                      </div>
                                    `;
                                  }
                                }}
                              />
                              <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                                Template Image
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                              <svg
                                className="w-12 h-12 mb-3"
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
                          <div className="bg-white rounded-lg p-4 border border-blue-100 shadow-sm">
                            <h6 className="font-medium text-gray-900 mb-2">
                              Description
                            </h6>
                            <p className="text-sm text-gray-700">
                              {selectedTemplate.description}
                            </p>
                          </div>
                        )}

                        {/* Quick Stats */}
                        <div className="bg-white rounded-lg p-4 border border-blue-100 shadow-sm">
                          <h6 className="font-medium text-gray-900 mb-3">
                            Template Details
                          </h6>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-500">Type:</span>
                              <span className="text-gray-900 capitalize">
                                {selectedTemplate.config_type}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">ID:</span>
                              <span className="text-gray-900 font-mono">
                                #{selectedTemplate.id}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Created:</span>
                              <span className="text-gray-900">
                                {new Date(
                                  selectedTemplate.created_at
                                ).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Updated:</span>
                              <span className="text-gray-900">
                                {new Date(
                                  selectedTemplate.updated_at
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-blue-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <h5 className="text-lg font-medium text-gray-900 mb-2">
                    No Template Selected
                  </h5>
                  <p className="text-gray-500 text-sm max-w-sm mx-auto">
                    Select a template from the dropdown to see its image preview
                    here.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
