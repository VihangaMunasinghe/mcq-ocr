"use client";

import { useState } from "react";
import { ProtectedRoute } from "../../components/ProtectedRoute";
import MainLayout from "../../components/Layout/MainLayout";
import { Card } from "../../components/UI/Card";
import { Button } from "../../components/UI/Button";
import { FileUploadModal } from "../../components/Modals/FileUploadModal";
import { VerificationModal } from "../../components/Modals/VerificationModal";
import { useToast } from "../../hooks/useToast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faFileText,
  faTrash,
  faEdit,
  faDownload,
  faEllipsisH,
  faFile,
  faCalendar,
  faCheckCircle,
} from "@fortawesome/free-solid-svg-icons";

// Define template types for MCQ grading system
type TemplateType = "MCQ" | "Quiz" | "Rubric" | "Report" | "Test";

interface Template {
  id: number;
  name: string;
  type: TemplateType;
  created: string;
  lastUsed: string;
  status: "active" | "inactive";
  questionCount?: number;
  description?: string;
}

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

  const confirmDelete = (id: number) => {
    setSelectedTemplate(id);
    setIsDeleteModalOpen(true);
  };

  const handleUpload = (files: File[]) => {
    // In a real app, this would make an API call to upload the files
    console.log("Uploading files:", files);
    showToast("Template uploaded successfully", "success");
  };

  const viewTemplate = (template: Template) => {
    setViewingTemplate(template);
    setIsViewModalOpen(true);
  };

  const getTemplateIcon = (type: TemplateType) => {
    switch (type) {
      case "MCQ":
        return (
          <FontAwesomeIcon
            icon={faCheckCircle}
            className="h-6 w-6 text-green-600"
          />
        );
      default:
        return (
          <FontAwesomeIcon
            icon={faFileText}
            className="h-6 w-6 text-blue-600"
          />
        );
    }
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
              <Card
                key={template.id}
                className="hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between">
                  <div className="flex items-center">
                    <div
                      className={`p-2 rounded-md ${
                        template.type === "MCQ" ? "bg-green-50" : "bg-blue-50"
                      }`}
                    >
                      {getTemplateIcon(template.type)}
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-medium text-gray-900">
                        {template.name}
                      </h3>
                      <p className="text-sm text-gray-500">{template.type}</p>
                    </div>
                  </div>
                  <div className="relative">
                    <div className="dropdown inline-block relative">
                      <button className="p-1 rounded-full hover:bg-gray-100">
                        <FontAwesomeIcon
                          icon={faEllipsisH}
                          className="h-5 w-5 text-gray-500"
                        />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center text-sm text-gray-500">
                    <FontAwesomeIcon
                      icon={faCalendar}
                      className="h-4 w-4 mr-1"
                    />
                    Created: {template.created}
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <FontAwesomeIcon icon={faFile} className="h-4 w-4 mr-1" />
                    Last used: {template.lastUsed}
                  </div>
                  {template.questionCount && (
                    <div className="flex items-center text-sm text-gray-500">
                      <FontAwesomeIcon
                        icon={faCheckCircle}
                        className="h-4 w-4 mr-1"
                      />
                      Questions: {template.questionCount}
                    </div>
                  )}
                  <div className="flex items-center text-sm">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        template.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {template.status.charAt(0).toUpperCase() +
                        template.status.slice(1)}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={
                      <FontAwesomeIcon icon={faFileText} className="h-4 w-4" />
                    }
                    onClick={() => viewTemplate(template)}
                  >
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<FontAwesomeIcon icon={faEdit} className="h-4 w-4" />}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={
                      <FontAwesomeIcon icon={faTrash} className="h-4 w-4" />
                    }
                    onClick={() => confirmDelete(template.id)}
                  >
                    Delete
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {/* File Upload Modal */}
          <FileUploadModal
            isOpen={isUploadModalOpen}
            onClose={() => setIsUploadModalOpen(false)}
            onUpload={handleUpload}
            title="Upload MCQ Template"
            acceptedFileTypes=".xlsx,.csv,.pdf,.docx"
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
            <div
              className={`fixed inset-0 z-50 overflow-y-auto ${
                isViewModalOpen ? "block" : "hidden"
              }`}
            >
              <div className="flex items-center justify-center min-h-screen p-4">
                <div
                  className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                  onClick={() => setIsViewModalOpen(false)}
                ></div>
                <div className="bg-white rounded-lg overflow-hidden shadow-xl transform transition-all w-full max-w-2xl">
                  <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">
                      {viewingTemplate.name}
                    </h3>
                    <button
                      type="button"
                      className="text-gray-400 hover:text-gray-500 focus:outline-none"
                      onClick={() => setIsViewModalOpen(false)}
                    >
                      <span className="sr-only">Close</span>
                      <svg
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 gap-x-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">
                          Template Type
                        </h4>
                        <p className="mt-1 text-sm text-gray-900">
                          {viewingTemplate.type}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">
                          Created
                        </h4>
                        <p className="mt-1 text-sm text-gray-900">
                          {viewingTemplate.created}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">
                          Last Used
                        </h4>
                        <p className="mt-1 text-sm text-gray-900">
                          {viewingTemplate.lastUsed}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">
                          Status
                        </h4>
                        <p className="mt-1 text-sm text-gray-900">
                          {viewingTemplate.status}
                        </p>
                      </div>
                      {viewingTemplate.questionCount && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">
                            Question Count
                          </h4>
                          <p className="mt-1 text-sm text-gray-900">
                            {viewingTemplate.questionCount}
                          </p>
                        </div>
                      )}
                      {viewingTemplate.description && (
                        <div className="sm:col-span-2">
                          <h4 className="text-sm font-medium text-gray-500">
                            Description
                          </h4>
                          <p className="mt-1 text-sm text-gray-900">
                            {viewingTemplate.description}
                          </p>
                        </div>
                      )}
                    </div>
                    {viewingTemplate.type === "MCQ" && (
                      <div className="mt-6">
                        <h4 className="text-sm font-medium text-gray-900 mb-3">
                          Question Preview
                        </h4>
                        <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
                          <div className="space-y-4">
                            <div>
                              <p className="text-sm font-medium text-gray-700">
                                Question 1: What is the capital of France?
                              </p>
                              <div className="mt-2 ml-4 space-y-2">
                                <p className="text-sm text-gray-600">
                                  A. London
                                </p>
                                <p className="text-sm text-gray-600">
                                  B. Berlin
                                </p>
                                <p className="text-sm text-gray-600">
                                  C. Paris{" "}
                                  <span className="text-green-600">
                                    (Correct)
                                  </span>
                                </p>
                                <p className="text-sm text-gray-600">
                                  D. Madrid
                                </p>
                              </div>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-700">
                                Question 2: What is 2 + 2?
                              </p>
                              <div className="mt-2 ml-4 space-y-2">
                                <p className="text-sm text-gray-600">A. 3</p>
                                <p className="text-sm text-gray-600">
                                  B. 4{" "}
                                  <span className="text-green-600">
                                    (Correct)
                                  </span>
                                </p>
                                <p className="text-sm text-gray-600">C. 5</p>
                                <p className="text-sm text-gray-600">D. 6</p>
                              </div>
                            </div>
                            <p className="text-sm text-gray-500 italic text-center">
                              ... more questions ...
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="px-4 py-3 bg-gray-50 sm:px-6 flex justify-end">
                    <Button
                      variant="outline"
                      onClick={() => setIsViewModalOpen(false)}
                      className="mr-2"
                    >
                      Close
                    </Button>
                    <Button
                      variant="primary"
                      icon={
                        <FontAwesomeIcon
                          icon={faDownload}
                          className="h-4 w-4"
                        />
                      }
                    >
                      Download Template
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}
