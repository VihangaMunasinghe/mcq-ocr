"use client";
import React, { useEffect, useState } from "react";
import Grid_based_viewer from "../components/Grid_based_viewer";
import Cluster_based_viewer from "../components/Cluster_based_viewer";
import { useToast } from "../../../hooks/useToast";
import axiosInstance from "@/utils/axiosclient";

interface TemplateBubbleViewerProps {
  templateId: string | null;
  configId: string | null;
  configtype: string | null;
  jobId: number | null;
  onClose: () => void;
}

const TemplateBubbleViewer: React.FC<TemplateBubbleViewerProps> = ({
  templateId,
  configId,
  configtype,
  jobId,
  onClose,
}) => {
  const { showToast } = useToast();
  const [templateImage, setTemplateImage] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [configData, setConfigData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    // Skip if already loaded
    if (templateImage && configData) {
      return;
    }

    const MAX_RETRIES = 3;
    const RETRY_DELAY = 1000; // 1 second between retries

    /**
     * Fetch with retry logic for handling NFS propagation delays
     */
    const fetchWithRetry = async (
      url: string,
      retries: number = MAX_RETRIES
    ): Promise<{ blob: () => Promise<Blob>; json: () => Promise<unknown> }> => {
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          const response = await axiosInstance.get(url, {
            responseType: "blob",
          });

          // Success - reset retry count display
          if (attempt > 1) {
            console.log(
              `✓ File fetched successfully after ${attempt} attempts`
            );
          }
          return {
            blob: () => Promise.resolve(response.data as Blob),
            json: async () => {
              if (response.data instanceof Blob) {
                const text = await response.data.text();
                return JSON.parse(text);
              }
              return response.data;
            },
          };
        } catch (error: unknown) {
          const axiosError = error as { response?: { status?: number } };
          // Handle 404 with retry
          if (axiosError.response?.status === 404 && attempt < retries) {
            console.warn(
              `File not found (attempt ${attempt}/${retries}). ` +
                `Retrying in ${RETRY_DELAY}ms... This may be due to NFS propagation delay.`
            );
            setRetryCount(attempt);
            await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
            continue;
          }

          // Network or fetch error
          if (attempt === retries) {
            throw error;
          }

          console.warn(
            `Fetch failed (attempt ${attempt}/${retries}):`,
            error instanceof Error ? error.message : "Unknown error",
            `\nRetrying in ${RETRY_DELAY}ms...`
          );
          setRetryCount(attempt);
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
        }
      }

      throw new Error(`Failed to fetch after ${retries} attempts`);
    };

    const fetchFiles = async () => {
      if (!templateId || !configId || !configtype) {
        console.error("Missing required props:", {
          templateId,
          configId,
          configtype,
        });
        showToast("Missing required template information", "error");
        onClose();
        return;
      }

      try {
        setLoading(true);
        setRetryCount(0);

        const BACKEND_URL =
          process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

        // Fetch template image with retry
        console.log(`Fetching template image (ID: ${templateId})...`);
        const templateResponse = await fetchWithRetry(
          `${BACKEND_URL}/api/files/download?method=file_id&file_id=${templateId}`
        );

        const templateBlob = await templateResponse.blob();

        // Validate blob
        if (templateBlob.size === 0) {
          throw new Error("Template image is empty");
        }

        const templateUrl = URL.createObjectURL(templateBlob);
        setTemplateImage(templateUrl);
        console.log("✓ Template image loaded successfully");

        // Fetch config file with retry
        console.log(`Fetching config file (ID: ${configId})...`);
        const configResponse = await fetchWithRetry(
          `${BACKEND_URL}/api/files/download?method=file_id&file_id=${configId}`
        );

        const configJson = await configResponse.json();

        // Validate config data
        if (!configJson || typeof configJson !== "object") {
          throw new Error("Invalid configuration data received");
        }

        setConfigData(configJson);
        console.log("✓ Configuration loaded successfully");

        setLoading(false);
        setRetryCount(0);
      } catch (error) {
        console.error("Error fetching template files:", error);

        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";

        showToast(
          `Failed to load template files: ${errorMessage}. Please try again.`,
          "error"
        );

        // Clean up and close
        setLoading(false);
        onClose();
      }
    };

    fetchFiles();

    // Cleanup function to revoke object URLs
    return () => {
      if (templateImage) {
        URL.revokeObjectURL(templateImage);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId, configId, configtype]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-6xl h-[90vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            Template Configuration Viewer
          </h2>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-[80vh] space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            <p className="text-gray-600">Loading template files...</p>
            {retryCount > 0 && (
              <p className="text-sm text-amber-600">
                Retrying... (Attempt {retryCount}/3)
              </p>
            )}
          </div>
        ) : (
          <>
            {configtype === "grid" ? (
              <Grid_based_viewer
                templateImage={templateImage}
                configData={configData}
                configId={configId}
                jobId={jobId}
                onClose={onClose}
              />
            ) : (
              <Cluster_based_viewer
                templateImage={templateImage}
                configData={configData}
                configId={configId}
                jobId={jobId}
                onClose={onClose}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TemplateBubbleViewer;
