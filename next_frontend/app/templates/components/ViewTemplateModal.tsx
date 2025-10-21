"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/UI/Button";
import { Template } from "@/models/template";
import { useToast } from "@/hooks/useToast";
import axiosInstance from "@/utils/axiosclient";

interface ViewTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: Template | null;
}

export default function ViewTemplateModal({
  isOpen,
  onClose,
  template,
}: ViewTemplateModalProps) {
  const { showToast } = useToast();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loadingImage, setLoadingImage] = useState(false);

  useEffect(() => {
    if (!isOpen || !template?.template_file_id) return;

    const fetchImage = async () => {
      setLoadingImage(true);
      try {
        const response = await axiosInstance.get(
          `/api/files/download?method=file_id&file_id=${template.template_file_id}`,
          { responseType: "blob" }
        );

        const blob = response.data as Blob;
        const url = URL.createObjectURL(blob);
        setImageUrl(url);
      } catch (err) {
        console.error(err);
        showToast("Failed to load template image", "error");
      } finally {
        setLoadingImage(false);
      }
    };

    fetchImage();
  }, [isOpen, template?.template_file_id]);

  if (!isOpen || !template) return null;

  // Format rows per column nicely if it's an array or string
  const formatRowsPerColumn = (rows: any) => {
    if (!rows) return "-";
    let arr = Array.isArray(rows)
      ? rows
      : typeof rows === "string"
      ? rows.split(",").map((n) => n.trim())
      : [rows];

    return (
      <div className="mt-1 space-y-1">
        {arr.map((r, idx) => (
          <div
            key={idx}
            className="text-gray-700 text-sm bg-gray-50 border border-gray-200 rounded-md px-3 py-1"
          >
            Column {idx + 1}: <span className="font-medium">{r} rows</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-3xl overflow-y-auto max-h-[90vh]">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">
          Template Details
        </h2>

        <div className="space-y-3 text-gray-700">
          <div>
            <label className="block text-sm font-medium text-gray-600">
              Name
            </label>
            <div className="mt-1 border border-gray-200 rounded-md px-3 py-2 bg-gray-50">
              {template.name}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600">
              Description
            </label>
            <div className="mt-1 border border-gray-200 rounded-md px-3 py-2 bg-gray-50">
              {template.description || "-"}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600">
              Number of Questions
            </label>
            <div className="mt-1 border border-gray-200 rounded-md px-3 py-2 bg-gray-50">
              {template.num_questions}
            </div>
          </div>

          {template.config_type === "cluster_based" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  Number of Columns
                </label>
                <div className="mt-1 border border-gray-200 rounded-md px-3 py-2 bg-gray-50">
                  {template.num_of_columns}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600">
                  Rows per Column
                </label>
                {formatRowsPerColumn(template.num_of_rows_per_column)}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600">
                  Options per Question
                </label>
                <div className="mt-1 border border-gray-200 rounded-md px-3 py-2 bg-gray-50">
                  {template.num_of_options_per_question}
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-600">
              Template Image
            </label>
            <div className="mt-2">
              {loadingImage ? (
                <div className="text-gray-600">Loading image...</div>
              ) : imageUrl ? (
                <img
                  src={imageUrl}
                  alt={`Template ${template.name}`}
                  className="max-w-full border border-gray-300 rounded-lg"
                />
              ) : (
                <div className="text-gray-400">No image available</div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <Button variant="primary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
