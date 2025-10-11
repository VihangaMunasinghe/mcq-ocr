"use client";

import { useState, useEffect } from "react";
import { Button } from "../../components/UI/Button";
import { VerificationModal } from "../../components/Modals/VerificationModal";
import { useToast } from "../../hooks/useToast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { Template } from "@/models/template";
import TemplateCard from "./components/template_card";
import ViewTemplateModal from "./components/view-template-modal";
import { useRouter } from "next/navigation";

export default function Templates() {
  const router = useRouter();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [viewingTemplate, setViewingTemplate] = useState<Template | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
  // Fetch templates from API
  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        skip: "0",
        limit: "20",
      });

      // Make sure the API endpoint matches your backend route
      const response = await fetch(`${BACKEND_URL}/api/templates?${params}`, {
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
    } catch (err) {
      console.error("Error fetching templates:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch templates"
      );
      showToast("Failed to load templates", "error");
    } finally {
      setLoading(false);
    }
  };

  // Fetch templates on component mount
  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleDeleteTemplate = () => {
    // In a real app, this would make an API call to delete the template
    console.log(`Deleting template with ID: ${selectedTemplate}`);
    showToast("Template deleted successfully", "success");
    setIsDeleteModalOpen(false);
    setSelectedTemplate(null);
    // Refresh the templates list after deletion
    fetchTemplates();
  };

  const viewTemplate = (template: Template) => {
    setViewingTemplate(template);
    setIsViewModalOpen(true);
  };

  const confirmDelete = (id: number) => {
    setSelectedTemplate(id);
    setIsDeleteModalOpen(true);
  };

  return (
    <>
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">My Templates</h2>
        <Button
          variant="primary"
          icon={<FontAwesomeIcon icon={faPlus} className="h-4 w-4" />}
          onClick={() => router.push('/templates/create')}
        >
          New Template
        </Button>
      </div>

      <div className="bg-white p-4 rounded-md shadow-sm mb-4">
        <p className="text-sm text-gray-600">
          Upload your MCQ templates or other grading templates. Supported
          formats include Excel (.xlsx), CSV, and PDF with structured format.
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="text-gray-600">Loading templates...</div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
          <div className="text-red-800 text-sm">Error: {error}</div>
          <Button variant="secondary" onClick={fetchTemplates} className="mt-2">
            Retry
          </Button>
        </div>
      )}

      {/* Templates Grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {templates.length > 0 ? (
            templates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                viewTemplate={viewTemplate}
                confirmDelete={confirmDelete}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-8">
              <div className="text-gray-500">No templates found</div>
              <Button
                variant="primary"
                onClick={() => router.push('/templates/create')}
                className="mt-4"
              >
                Create Your First Template
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <VerificationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteTemplate}
        title="Delete Template"
        message="Are you sure you want to delete this template? This action cannot be undone."
        confirmText="Delete"
        type="warning"
      />

      {/* View Template Modal */}
      {viewingTemplate && (
        <ViewTemplateModal
          isViewModalOpen={isViewModalOpen}
          setIsViewModalOpen={setIsViewModalOpen}
          viewingTemplate={viewingTemplate}
        />
      )}
    </>
  );
}
