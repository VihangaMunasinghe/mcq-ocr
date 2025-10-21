"use client";

import { useState, useEffect, useLayoutEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "../../../components/UI/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faImage } from "@fortawesome/free-solid-svg-icons";
import Image from "next/image";
import { useToast } from "../../../hooks/useToast";
import TemplateBubbleViewer from "../view/TemplateBubbleViewer";
import axiosInstance from "@/utils/axiosclient";
import { connectWebSocketWithPromise } from "@/utils/websocketClient";

interface TemplateForm {
  name: string;
  description: string;
  configType: "grid_based" | "cluster_based";
  templateImage: File | null;
  numColumns?: number;
  rowsPerColumn?: number[];
  optionsPerQuestion?: number;
}

interface UploadResponse {
  file_id: number;
}

export default function CreateTemplate() {
  const router = useRouter();
  const { showToast } = useToast();

  const [formData, setFormData] = useState<TemplateForm>({
    name: "",
    description: "",
    configType: "grid_based",
    templateImage: null,
  });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<
    Partial<Record<keyof TemplateForm, string>>
  >({});
  const [showViewer, setShowViewer] = useState(false);
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [configId, setConfigId] = useState<string | null>(null);
  const [configtype, setConfigType] = useState<string | null>(null);
  const [jobId, setJobId] = useState<number | null>(null);

  const searchParams = useSearchParams();
  useLayoutEffect(() => {
    // Reset to default values on component mount
    if (searchParams.get("reset") === "true") {
      setShowViewer(false);
      setErrors({});
      setTemplateId(null);
      setConfigId(null);
      setConfigType(null);
      setJobId(null);
    }
    router.replace("/templates/create");
  }, [searchParams, router]);
  // Handle image preview
  useEffect(() => {
    if (formData.templateImage) {
      const url = URL.createObjectURL(formData.templateImage);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [formData.templateImage]);

  // Reset cluster-based fields when configType changes
  useEffect(() => {
    if (formData.configType === "grid_based") {
      setFormData((prev) => ({
        ...prev,
        numColumns: undefined,
        rowsPerColumn: [],
        optionsPerQuestion: undefined,
      }));
    }
  }, [formData.configType]);

  const handleInputChange = (
    field: keyof TemplateForm,
    value: string | File | number | number[] | null
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleInputChange("templateImage", file);
    }
  };

  const handleRowsPerColumnChange = (columnIndex: number, value: string) => {
    const newRows = [...(formData.rowsPerColumn || [])];
    newRows[columnIndex] = parseInt(value) || 0;
    handleInputChange("rowsPerColumn", newRows);
  };

  // Validation logic
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof TemplateForm, string>> = {};

    if (!formData.name) newErrors.name = "Template name is required.";
    // Description is now optional - removed validation
    if (!formData.templateImage)
      newErrors.templateImage = "Template image is required.";

    if (formData.configType === "cluster_based") {
      if (!formData.numColumns || formData.numColumns <= 0)
        newErrors.numColumns = "Number of columns is required.";

      // Check if all rows per column are filled (no empty or zero values)
      if (
        !formData.rowsPerColumn ||
        formData.rowsPerColumn.length !== formData.numColumns
      ) {
        newErrors.rowsPerColumn = "Please fill all row counts for each column.";
      } else {
        // Check if any value is empty, zero, or invalid
        const hasEmptyOrInvalidRows = formData.rowsPerColumn.some(
          (rows) => !rows || rows <= 0 || isNaN(rows)
        );
        if (hasEmptyOrInvalidRows) {
          newErrors.rowsPerColumn =
            "All rows per column counts must be filled with valid numbers greater than 0.";
        }
      }

      if (!formData.optionsPerQuestion || formData.optionsPerQuestion <= 0)
        newErrors.optionsPerQuestion = "Options per question is required.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // WebSocket configuration using the authenticated WebSocket utility
  const configureTemplateViaWebSocket = async (jobId: number) => {
    interface WebSocketResponse {
      status: string;
      message?: string;
      data?: {
        template_file_id: number;
        configuration_file_id: number;
        config_type: string;
      };
    }

    try {
      const result = await connectWebSocketWithPromise<
        WebSocketResponse["data"]
      >(`/api/templates/${jobId}/configure`, {
        successCondition: (data: unknown) => {
          const response = data as WebSocketResponse;
          return response.status === "completed";
        },
        errorCondition: (data: unknown) => {
          const response = data as WebSocketResponse;
          return response.status === "error";
        },
        dataExtractor: (data: unknown) => {
          const response = data as WebSocketResponse;
          return response.data;
        },
      });

      if (result) {
        setTemplateId(String(result.template_file_id));
        setConfigId(String(result.configuration_file_id));
        setConfigType(String(result.config_type));
        setShowViewer(true);
      }
    } catch (error) {
      throw error; // Re-throw to be handled by the calling function
    }
  };

  const handleUpload = async () => {
    if (!validateForm()) {
      showToast("Please fill in all required fields.", "error");
      return;
    }

    try {
      const uploadFormData = new FormData();
      uploadFormData.append("file", formData.templateImage!);
      uploadFormData.append("file_type", "template");

      const uploadResponse = await axiosInstance.post(
        "/api/files/upload",
        uploadFormData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const uploadData: UploadResponse = uploadResponse.data as UploadResponse;

      const templatePayload: Record<string, string | number | number[]> = {
        name: formData.name,
        description: formData.description,
        config_type: formData.configType,
        template_file_id: uploadData.file_id,
      };

      if (formData.configType === "cluster_based") {
        if (formData.numColumns)
          templatePayload.num_of_columns = formData.numColumns;
        if (formData.rowsPerColumn)
          templatePayload.num_of_rows_per_column = formData.rowsPerColumn;
        if (formData.optionsPerQuestion)
          templatePayload.num_of_options_per_question =
            formData.optionsPerQuestion;
      }

      const createResponse = await axiosInstance.post(
        "/api/templates/",
        templatePayload
      );

      const { job_id } = createResponse.data as { job_id: number };
      if (typeof job_id === "number") {
        setJobId(job_id);
      } else if (typeof job_id === "string") {
        // Convert if it comes as string
        setJobId(parseInt(job_id, 10));
      } else {
        throw new Error("Invalid job_id format received");
      }
      // Start WebSocket configuration
      await configureTemplateViaWebSocket(Number(job_id));
      showToast("Template uploaded successfully!", "success");
    } catch (error) {
      console.error(error);
      showToast("Failed to upload template.", "error");
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="sm"
          icon={<FontAwesomeIcon icon={faArrowLeft} className="h-4 w-4" />}
          onClick={() => router.push("/templates")}
        >
          Back to Templates
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-6">Create New Template</h2>

        {/* Basic Info */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Template Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="Enter template name"
            />
            {errors.name && (
              <p className="text-sm text-red-500 mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description{" "}
              <span className="text-gray-400 text-xs">(optional)</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              rows={3}
              placeholder="Enter template description"
            />
            {errors.description && (
              <p className="text-sm text-red-500 mt-1">{errors.description}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Configuration Type
            </label>
            <select
              value={formData.configType}
              onChange={(e) => handleInputChange("configType", e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="grid_based">Grid Based</option>
              <option value="cluster_based">Cluster Based</option>
            </select>
          </div>
        </div>

        {formData.configType === "cluster_based" && (
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Number of Columns
              </label>
              <input
                type="number"
                min={1}
                onWheel={(e) => e.currentTarget.blur()}
                value={formData.numColumns || ""}
                onChange={(e) =>
                  handleInputChange("numColumns", parseInt(e.target.value))
                }
                className="w-full px-3 py-2 border rounded-md"
              />
              {errors.numColumns && (
                <p className="text-sm text-red-500 mt-1">{errors.numColumns}</p>
              )}
            </div>

            {formData.numColumns && formData.numColumns > 0 && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Rows per Column
                </label>
                <div className="grid grid-cols-3 gap-4">
                  {Array.from({ length: formData.numColumns }).map(
                    (_, index) => (
                      <input
                        key={index}
                        type="number"
                        min={1}
                        onWheel={(e) => e.currentTarget.blur()}
                        value={formData.rowsPerColumn?.[index] || ""}
                        onChange={(e) =>
                          handleRowsPerColumnChange(index, e.target.value)
                        }
                        className="px-3 py-2 border rounded-md"
                        placeholder={`Column ${index + 1}`}
                      />
                    )
                  )}
                </div>
                {errors.rowsPerColumn && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.rowsPerColumn}
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Options per Question
              </label>
              <input
                type="number"
                min={1}
                onWheel={(e) => e.currentTarget.blur()}
                value={formData.optionsPerQuestion || ""}
                onChange={(e) =>
                  handleInputChange(
                    "optionsPerQuestion",
                    parseInt(e.target.value)
                  )
                }
                className="w-full px-3 py-2 border rounded-md"
              />
              {errors.optionsPerQuestion && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.optionsPerQuestion}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Image Upload */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Template Image
          </label>
          <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <FontAwesomeIcon
                icon={faImage}
                className="h-12 w-12 text-gray-400 mb-3"
              />
              <p className="mb-2 text-sm text-gray-500">
                <span className="font-semibold">Click to upload</span> or drag
                and drop
              </p>
              <p className="text-xs text-gray-500">PNG, JPG, JPEG</p>
            </div>
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleImageUpload}
            />
          </label>
          {errors.templateImage && (
            <p className="text-sm text-red-500 mt-1">{errors.templateImage}</p>
          )}
        </div>

        {previewUrl && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preview
            </label>
            <div className="relative h-64 w-full border rounded-lg overflow-hidden">
              <Image
                src={previewUrl}
                alt="Template preview"
                fill
                style={{ objectFit: "contain" }}
              />
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-4">
          <Button variant="secondary" onClick={() => router.push("/templates")}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleUpload}>
            Upload
          </Button>
        </div>
      </div>

      {showViewer && templateId && configId && configtype && (
        <TemplateBubbleViewer
          configId={configId}
          templateId={templateId}
          configtype={configtype}
          jobId={jobId}
          onClose={() => setShowViewer(false)}
        />
      )}
    </div>
  );
}
