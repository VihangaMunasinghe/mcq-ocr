"use client";

import { useState, useEffect } from "react";
import { Button } from "../../components/UI/Button";
import { VerificationModal } from "../../components/Modals/VerificationModal";
import { useToast } from "../../hooks/useToast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { Template } from "@/models/template";
import TemplateCard from "./components/template_card";
import { EditTemplateModal } from "./components/EditTemplateModal";
import ViewTemplateModal from "./components/ViewTemplateModal";


//import ViewTemplateModal from "./components/view-template-modal";
import { useRouter } from "next/navigation";
//import { FormUploadModal } from "@/components/Modals/FormUploadModal";

//const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000/api";

const selectFormConfig = [
  {
    name: "config_type",
    label: "Config Type",
    options: [
      { value: "grid_based", label: "Grid Based" },
      { value: "cluster_based", label: "Cluster Based" },
    ],
    defaultValue: "grid_based",
  },
  {
    name: "save_intermediate_results",
    label: "Save Intermediate Results",
    options: [
      { value: "true", label: "Yes" },
      { value: "false", label: "No" },
    ],
    defaultValue: "false",
  },
];

const inputFormConfig = [
  {
    name: "name",
    label: "Name",
    type: "text",
    placeholder: "Enter name",
    required: true,
    defaultValue: "",
  },
  {
    name: "description",
    label: "Description",
    type: "text",
    placeholder: "Enter description",
    defaultValue: "",
  },
  {
    name: "num_of_columns",
    label: "Number of Columns",
    type: "number",
    placeholder: "3",
    defaultValue: "3",
  },
  {
    name: "num_of_rows_per_column",
    label: "Rows per Column",
    type: "number",
    placeholder: "30",
    defaultValue: "30",
  },
  {
    name: "num_of_options_per_question",
    label: "Options per Question",
    type: "number",
    placeholder: "5",
    defaultValue: "5",
  },
];

const fileFormConfig = [
  {
    name: "template_image", // required
    label: "Upload your template image",
    accept: ".jpg,.jpeg,.png", // correct key
    maxSize: 10 * 1024 * 1024, // correct key
    maxFiles: 1,
    required: true,
    fullWidth: true,
  },
];

export default function Templates() {
  const router = useRouter();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
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

  const handleDeleteTemplate = async() => {
      if (!selectedTemplate) return;

      try {
      const response = await fetch(`${BACKEND_URL}/api/templates/${selectedTemplate}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`Failed to delete template: ${response.statusText}`);
      }

      showToast("Template deleted successfully", "success");

      // Refresh template list
      await fetchTemplates();
    } catch (err) {
      console.error("Error deleting template:", err);
      showToast("Failed to delete template", "error");
    } finally {
      setIsDeleteModalOpen(false);
      setSelectedTemplate(null);
    }
  };

const handleEditTemplateSave = async (name: string, description: string) => {
  if (!selectedTemplate) return;

  try {
    const payload = { 
          name: name,
          description: description
        };
    console.log('Sending payload:', payload);
    const response = await fetch(`${BACKEND_URL}/api/templates/edit/${selectedTemplate}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
          payload
       ),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error details:', errorData);
      throw new Error(`Failed to update template: ${response.statusText}`);
    }

    showToast("Template updated successfully", "success");
    console.log(response)
    await fetchTemplates(); // refresh templates
    setIsEditModalOpen(false);
    setSelectedTemplate(null);
  } catch (err) {
    console.error("Error updating template:", err);
    showToast("Failed to update template", "error");
  }
};



  const viewTemplate = (template: Template) => {
    setViewingTemplate(template);
    setIsViewModalOpen(true);
  };

  const confirmDelete = (id: number) => {
    setSelectedTemplate(id);
    setIsDeleteModalOpen(true);
  };
 
  const editTemplate = (id: number) => {
    setSelectedTemplate(id);
    setIsEditModalOpen(true);
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
                editTemplate={editTemplate}
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

      <EditTemplateModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleEditTemplateSave}
        existingName={
          templates.find((t) => t.id === selectedTemplate)?.name || ""
        }
        existingDescription={
          templates.find((t) => t.id === selectedTemplate)?.description || ""
        }
      />
      {/* View Template Modal */}
      <ViewTemplateModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        template={viewingTemplate}
        
      />


    </>
  );
}
