"use client";

import { useState } from "react";
import { ProtectedRoute } from "../../components/ProtectedRoute";
import MainLayout from "../../components/Layout/MainLayout";
import { Button } from "../../components/UI/Button";
import { FileUploadModal } from "../../components/Modals/FileUploadModal";
import { VerificationModal } from "../../components/Modals/VerificationModal";
import { useToast } from "../../hooks/useToast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { Template } from "@/models/template";
import TemplateCard from "./components/template_card";
import ViewTemplateModal from "./components/view-template-modal";
import { FormUploadModal } from "@/components/Modals/FormUploadModal";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000/api";

const selectFormConfig= [
  {
    name: "config_type",
    label: "Config Type",
    options: [
      { value: "grid_based", label: "Grid Based" },
      { value: "clustering_based", label: "Cluster Based" }
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
      name: "template_image",           // required
      label: "Upload your template image",
      accept: ".jpg,.jpeg,.png",       // correct key
      maxSize: 10 * 1024 * 1024,       // correct key
      maxFiles: 1,
      required: true,
      fullWidth: true,
    },
  ];

export default function Templates() {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [viewingTemplate, setViewingTemplate] = useState<Template | null>(null);
  const { showToast } = useToast();

  const templates: Template[] = [
    {
      id: 1,
      name: "Math Quiz MCQ Template",
      type: "MCQ",
      created: "2023-04-01",
      lastUsed: "2023-04-10",
      status: "active",
      questionCount: 30,
      description: "Multiple choice questions for 10th grade math exam",
    },
    {
      id: 2,
      name: "English Grammar MCQ",
      type: "MCQ",
      created: "2023-03-15",
      lastUsed: "2023-04-05",
      status: "active",
      questionCount: 25,
      description: "Grammar assessment for high school students",
    },
    {
      id: 3,
      name: "Science Lab Report",
      type: "Report",
      created: "2023-02-28",
      lastUsed: "2023-03-20",
      status: "active",
    },
    {
      id: 4,
      name: "History Assignment Rubric",
      type: "Rubric",
      created: "2023-01-10",
      lastUsed: "2023-02-15",
      status: "inactive",
    },
    {
      id: 5,
      name: "Programming Test MCQ",
      type: "MCQ",
      created: "2023-03-05",
      lastUsed: "2023-04-12",
      status: "active",
      questionCount: 40,
      description: "Computer science fundamentals assessment",
    },
    {
      id: 6,
      name: "Geography Project Rubric",
      type: "Rubric",
      created: "2023-02-20",
      lastUsed: "2023-03-10",
      status: "active",
    },
  ];

  const handleDeleteTemplate = () => {
    // In a real app, this would make an API call to delete the template
    console.log(`Deleting template with ID: ${selectedTemplate}`);
    showToast("Template deleted successfully", "success");
    setIsDeleteModalOpen(false);
    setSelectedTemplate(null);
  };

  const viewTemplate = (template: Template) => {
    setViewingTemplate(template);
    setIsViewModalOpen(true);
  };

  const confirmDelete = (id: number) => {
    setSelectedTemplate(id);
    setIsDeleteModalOpen(true);
  };

  const handleUpload = async (formData: FormData) => {
    console.log("Uploading form:", formData);

    const file_formData = new FormData();
    const file = formData.get("template_image") as File;
    file_formData.append("file", file);
    file_formData.append("file_type", "template");
    const uploadResponse = await fetch(`${BACKEND_URL}/files/upload`, {
      method: 'POST',
      body: file_formData,
    });

    if (!uploadResponse.ok) {
      console.error('Upload failed:', uploadResponse.statusText);
      showToast("File upload failed", "error");
      return;
    }

    const uploadData = await uploadResponse.json();
    console.log('Upload success:', uploadData);

    showToast("Template uploaded successfully", "success");
    const filePath = uploadData.path; // <-- key returned from backend
    
    const template_json_payload = JSON.stringify(
      {
        name: formData.get("name"),
        description: formData.get("description"),
        config_type: formData.get("config_type"),
        template_path: filePath,
        save_intermediate_results: formData.get("save_intermediate_results") === "true",
        num_of_columns: parseInt(formData.get("num_of_columns") as string, 10),
        num_of_rows_per_column: parseInt(formData.get("num_of_rows_per_column") as string, 10),
        num_of_options_per_question: parseInt(formData.get("num_of_options_per_question") as string, 10),
      }
    );


    const processResponse = await fetch(`${BACKEND_URL}/templates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: template_json_payload,
    })
    if (!processResponse.ok) {
      console.error('Processing failed:', processResponse.statusText);
      showToast("Template processing failed", "error");
      return;}
    const processData = await processResponse.json();
    console.log('Processing success:', processData);
    setIsUploadModalOpen(false);
    };

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">
              My Templates
            </h2>
            <Button
              variant="primary"
              icon={<FontAwesomeIcon icon={faPlus} className="h-4 w-4" />}
              onClick={() => setIsUploadModalOpen(true)}
            >
              New Template
            </Button>
          </div>

          <div className="bg-white p-4 rounded-md shadow-sm mb-4">
            <p className="text-sm text-gray-600">
              Upload your MCQ templates or other grading templates. Supported
              formats include Excel (.xlsx), CSV, and PDF with structured
              format.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                viewTemplate={viewTemplate}
                confirmDelete={confirmDelete}
              />
            ))}
          </div>

          {/* File Upload Modal */}
          <FormUploadModal
            isOpen={isUploadModalOpen}
            onClose={() => setIsUploadModalOpen(false)}
            onUpload={handleUpload}
            type="template"
            title="Upload MCQ Template"
            fileFormConfig={fileFormConfig}
            selectFormConfig={selectFormConfig}
            inputFormConfig={inputFormConfig}
          />

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
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}
