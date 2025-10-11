"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../../../components/UI/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faUpload, faImage } from "@fortawesome/free-solid-svg-icons";
import Image from "next/image";
import { useToast } from "../../../hooks/useToast";
import TemplateBubbleViewer from "../view/TemplateBubbleViewer";

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

interface WebSocketMessage {
  status: string;
  message?: string;
  data?: any;
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
  const [errors, setErrors] = useState<Partial<Record<keyof TemplateForm, string>>>({});

  const [showViewer, setShowViewer] = useState(false);
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [configId, setConfigId] = useState<string | null>(null);
  const [configtype, setConfigType] = useState<string | null>(null);

  // Handle image preview
  useEffect(() => {
    if (formData.templateImage) {
      const url = URL.createObjectURL(formData.templateImage);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [formData.templateImage]);

  // Update the handleInputChange function type definition
  const handleInputChange = (
    field: keyof TemplateForm,
    value: string | File | number | number[] | null
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user changes input
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

  // The handleRowsPerColumnChange can remain the same
  const handleRowsPerColumnChange = (columnIndex: number, value: string) => {
    const newRows = [...(formData.rowsPerColumn || [])];
    newRows[columnIndex] = parseInt(value) || 0;
    handleInputChange("rowsPerColumn", newRows);
  };

  // First, move the configureTemplateViaWebSocket function outside of handleUpload
  const configureTemplateViaWebSocket = (jobId: number): Promise<void> => {
    return new Promise((resolve, reject) => {
      const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
      const wsProtocol = BACKEND_URL.startsWith("https") ? "wss" : "ws";
      const host = BACKEND_URL.replace(/^https?:\/\//, "");
      const wsUrl = `${wsProtocol}://${host}/api/templates/${jobId}/configure`;

      console.log("Connecting to WebSocket:", wsUrl);
      const ws = new WebSocket(wsUrl);

      // Add connection timeout
      const connectionTimeout = setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          console.error("WebSocket connection timeout");
          ws.close();
          reject(new Error("Failed to connect to WebSocket server"));
        }
      }, 5000); // 5 second connection timeout

      ws.onopen = () => {
        console.log("WebSocket connected for template configuration");
        clearTimeout(connectionTimeout);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("WebSocket message received:", JSON.stringify(data, null, 2));

          if (data.status === "connected") {
            console.log("WebSocket connection established");
            showToast("Template configuration started", "success");
            return;
          }

          if (data.status === "queued") {
            console.log("Template configuration job queued");
            showToast("Template configuration job queued", "success");
            return;
          } else if (data.status === "error") {
            const errorMessage = data.message || "Unknown configuration error";
            console.error("WebSocket error message:", errorMessage);
            ws.close();
            showToast(`Configuration failed: ${errorMessage}`, "error");
            reject(new Error(`Configuration failed: ${errorMessage}`));
          } else if (data.status === "completed") {
            if (!data.data) {
              console.warn("Completed status received but no data provided");
            }
            console.log("Template configuration completed", data.data);
            showToast("Template configuration completed successfully", "success");
            ws.close();
            resolve();
            setTemplateId(String(data.data.template_file_id));
            setConfigId(String(data.data.configuration_file_id));
            setConfigType(String(data.data.config_type));
            setShowViewer(true);
            //router.push('/templates');
          } else {
            console.warn("Unknown WebSocket message status:", data.status);
          }
        } catch (err) {
          console.error("Error parsing WebSocket message:", err);
          ws.close();
          reject(new Error("Invalid WebSocket message format"));
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        clearTimeout(connectionTimeout);
        showToast("WebSocket connection failed", "error");
        ws.close();
        reject(new Error("WebSocket connection failed"));
      };

      ws.onclose = (event) => {
        clearTimeout(connectionTimeout);
        console.log(`WebSocket closed: code=${event.code}, reason=${event.reason}`);
        if (event.code !== 1000 && event.code !== 1001) {
          reject(
            new Error(
              `WebSocket closed unexpectedly: ${event.reason || "Unknown reason"}`
            )
          );
        }
      };

      // Set a timeout to prevent hanging
      setTimeout(() => {
        if (ws.readyState === WebSocket.OPEN) {
          console.log("WebSocket timeout reached, closing connection");
          ws.close();
          reject(new Error("Template configuration timeout"));
          showToast("Configuration timeout - please try again", "error");
        }
      }, 90000); // 90 second timeout
    });
  };

  const handleUpload = async () => {
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
    
    try {
      // First validate the form
      if (!formData.name || !formData.templateImage) {
        showToast("Please fill all required fields", "error");
        return;
      }

      // Step 1: Upload the template image
      const uploadFormData = new FormData();
      uploadFormData.append("file", formData.templateImage);
      uploadFormData.append("file_type", "template");

      const uploadResponse = await fetch(`${BACKEND_URL}/api/files/upload`, {
        method: "POST",
        body: uploadFormData,
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload template image");
      }

      const uploadData: UploadResponse = await uploadResponse.json();

      // Step 2: Create template
      const templatePayload: any = {
        name: formData.name,
        description: formData.description,
        config_type: formData.configType,
        template_file_id: uploadData.file_id,
      };

      // Add cluster-based specific fields if applicable
      if (formData.configType === "cluster_based") {
        templatePayload.num_of_columns = formData.numColumns;
        templatePayload.num_of_rows_per_column = formData.rowsPerColumn;
        templatePayload.num_of_options_per_question = formData.optionsPerQuestion;
      }

      const createResponse = await fetch(`${BACKEND_URL}/api/templates/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(templatePayload),
      });

      if (!createResponse.ok) {
        const errText = await createResponse.text();
        console.error("Backend error:", errText);
        throw new Error("Failed to create template");
      }

      const { job_id } = await createResponse.json();

      // Step 3: Configure template using WebSocket
      await configureTemplateViaWebSocket(job_id);

    } catch (error) {
      console.error("Error during upload process:", error);
      showToast(
        error instanceof Error ? error.message : "Failed to process template",
        "error"
      );
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
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

        {/* Basic Information */}
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
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              rows={3}
              placeholder="Enter template description"
            />
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

        {/* Conditional Fields Based on Config Type */}
        {formData.configType === "cluster_based" && (
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Number of Columns
              </label>
              <input
                type="number"
                min={1}
                value={formData.numColumns || ""}
                onChange={(e) => handleInputChange("numColumns", parseInt(e.target.value))}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            {formData.numColumns && formData.numColumns > 0 && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Rows per Column
                </label>
                <div className="grid grid-cols-3 gap-4">
                  {Array.from({ length: formData.numColumns }).map((_, index) => (
                    <input
                      key={index}
                      type="number"
                      min={1}
                      value={formData.rowsPerColumn?.[index] || ""}
                      onChange={(e) => handleRowsPerColumnChange(index, e.target.value)}
                      className="px-3 py-2 border rounded-md"
                      placeholder={`Column ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Options per Question
              </label>
              <input
                type="number"
                min={1}
                value={formData.optionsPerQuestion || ""}
                onChange={(e) => handleInputChange("optionsPerQuestion", parseInt(e.target.value))}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>
        )}

        {/* Template Image Upload */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Template Image
          </label>
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <FontAwesomeIcon icon={faImage} className="h-12 w-12 text-gray-400 mb-3" />
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500">PNG, JPG or JPEG (MAX. 800x400px)</p>
              </div>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
              />
            </label>
          </div>
        </div>

        {/* Image Preview */}
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

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4">
          <Button
            variant="secondary"
            onClick={() => router.push("/templates")}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleUpload}
            disabled={!formData.name || !formData.templateImage}
          >
            Upload
          </Button>
        </div>
      </div>
       {showViewer && templateId && (
        <TemplateBubbleViewer
          configId={configId}
          templateId={templateId}
          configtype={configtype}
          onClose={() => setShowViewer(false)}
        />
      )}
    </div>
  );
}

