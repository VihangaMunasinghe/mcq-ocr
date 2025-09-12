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

  const handleUpload = (files: File[]) => {
    // In a real app, this would make an API call to upload the files
    console.log("Uploading files:", files);
    showToast("Template uploaded successfully", "success");
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
          <FileUploadModal
            isOpen={isUploadModalOpen}
            onClose={() => setIsUploadModalOpen(false)}
            onUpload={handleUpload}
            title="Upload MCQ Template"
            acceptedFileTypes="jpg, jpeg, png"
            maxFiles={1}
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
