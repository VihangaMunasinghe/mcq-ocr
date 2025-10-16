"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/UI/Button";

interface EditTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, description: string) => void;
  existingName?: string;
  existingDescription?: string;
}

export function EditTemplateModal({
  isOpen,
  onClose,
  onSave,
  existingName = "",
  existingDescription = "",
}: EditTemplateModalProps) {
  const [name, setName] = useState(existingName);
  const [description, setDescription] = useState(existingDescription);

  useEffect(() => {
    // When the modal opens, prefill with existing values
    if (isOpen) {
      setName(existingName);
      setDescription(existingDescription);
    }
  }, [isOpen, existingName, existingDescription]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">
          Edit Template
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring focus:ring-blue-200 focus:outline-none"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter new name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring focus:ring-blue-200 focus:outline-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter new description"
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => onSave(name.trim(), description.trim())}
          >
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
