import React from "react";
import { Button } from "../../../components/UI/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserPlus } from "@fortawesome/free-solid-svg-icons";

interface PageHeaderProps {
  onCreateNew?: () => void;
}

export function PageHeader({ onCreateNew }: PageHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">
            Manage users, roles, and verification status
          </p>
        </div>
        {onCreateNew && (
          <Button
            variant="primary"
            icon={<FontAwesomeIcon icon={faUserPlus} className="h-4 w-4" />}
            onClick={onCreateNew}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Add New User
          </Button>
        )}
      </div>
    </div>
  );
}
