"use client";
import React, { useEffect, useState } from "react";
import Grid_based_viewer from "../components/Grid_based_viewer";
import Cluster_based_viewer from "../components/Cluster_based_viewer";
import { useToast } from "../../../hooks/useToast";

interface TemplateBubbleViewerProps {
  templateId: string | null;
  configId: string | null;
  configtype: string | null;
  onClose: () => void;
}

const TemplateBubbleViewer: React.FC<TemplateBubbleViewerProps> = ({ 
  templateId, 
  configId, 
  configtype, 
  onClose 
}) => {
  const { showToast } = useToast();
  const [templateImage, setTemplateImage] = useState<string | null>(null);
  const [configData, setConfigData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFiles = async () => {
      if (!templateId || !configId || !configtype) {
        console.error('Missing required props');
        onClose();
        return;
      }

      try {
        const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
        
        // Fetch template image
        const templateResponse = await fetch(
          `${BACKEND_URL}/api/files/download?method=file_id&file_id=${templateId}`
        );
        if (!templateResponse.ok) throw new Error('Failed to fetch template image');
        const templateBlob = await templateResponse.blob();
        const templateUrl = URL.createObjectURL(templateBlob);
        setTemplateImage(templateUrl);

        // Fetch config file
        const configResponse = await fetch(
          `${BACKEND_URL}/api/files/download?method=file_id&file_id=${configId}`
        );
        if (!configResponse.ok) throw new Error('Failed to fetch config file');
        const configJson = await configResponse.json();
        setConfigData(configJson);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching files:', error);
        showToast((error as Error).message, "error");
        onClose();
      }
    };

    fetchFiles();
  }, [templateId, configId, configtype, onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg w-full max-w-6xl h-[90vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Template Viewer</h2>
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            Close
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-[80vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          configtype === "grid_based" ? (
            <Grid_based_viewer
              templateImage={templateImage}
              configData={configData}
              configId={configId}
            />
          ) : (
            <Cluster_based_viewer
              templateImage={templateImage}
              configData={configData}
              configId={configId}
            />
          )
        )}
      </div>
    </div>
  );
};

export default TemplateBubbleViewer;
