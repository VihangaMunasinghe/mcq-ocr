import React from "react";
import { Button } from "../../../components/UI/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";

interface PageHeaderProps {
  onCreateNew: () => void;
}

export function PageHeader({ onCreateNew }: PageHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Marking Jobs</h1>
          <p className="text-gray-600 mt-1">
            Manage and monitor your MCQ grading tasks
          </p>
        </div>
        <Button
          variant="primary"
          icon={<FontAwesomeIcon icon={faPlus} className="h-4 w-4" />}
          onClick={onCreateNew}
          className="bg-blue-600 hover:bg-blue-700"
        >
          New Marking Job
        </Button>
      </div>
    </div>
  );
}
