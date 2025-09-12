import { Card } from "@/components/UI/Card";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import {
  faFileText,
  faTrash,
  faEdit,
  faEllipsisH,
  faFile,
  faCalendar,
  faCheckCircle,
} from "@fortawesome/free-solid-svg-icons";
import { Template, TemplateType } from "@/models/template";
import { Button } from "@/components/UI/Button";

interface TemplateCardProps {
  template: Template;
  viewTemplate: (template: Template) => void;
  confirmDelete: (id: number) => void;
}

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
        <FontAwesomeIcon icon={faFileText} className="h-6 w-6 text-blue-600" />
      );
  }
};

const TemplateCard = ({ template, viewTemplate, confirmDelete }: TemplateCardProps) => {
  return (
    <Card key={template.id} className="hover:shadow-md transition-shadow">
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
          <FontAwesomeIcon icon={faCalendar} className="h-4 w-4 mr-1" />
          Created: {template.created}
        </div>
        <div className="flex items-center text-sm text-gray-500">
          <FontAwesomeIcon icon={faFile} className="h-4 w-4 mr-1" />
          Last used: {template.lastUsed}
        </div>
        {template.questionCount && (
          <div className="flex items-center text-sm text-gray-500">
            <FontAwesomeIcon icon={faCheckCircle} className="h-4 w-4 mr-1" />
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
            {template.status.charAt(0).toUpperCase() + template.status.slice(1)}
          </span>
        </div>
      </div>

      <div className="mt-4 flex space-x-2">
        <Button
          variant="outline"
          size="sm"
          icon={<FontAwesomeIcon icon={faFileText} className="h-4 w-4" />}
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
          icon={<FontAwesomeIcon icon={faTrash} className="h-4 w-4" />}
          onClick={() => confirmDelete(template.id)}
        >
          Delete
        </Button>
      </div>
    </Card>
  );
};

export default TemplateCard;
