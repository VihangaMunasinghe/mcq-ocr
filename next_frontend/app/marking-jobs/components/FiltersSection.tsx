import React from "react";
import { Select } from "../../../components/UI/Select";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilter, faSearch } from "@fortawesome/free-solid-svg-icons";
import { StatusFilterOption } from "../types/types";

interface FiltersSectionProps {
  totalJobs: number;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
}

const statusFilterOptions: StatusFilterOption[] = [
  { value: "all", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "in-progress", label: "In Progress" },
  { value: "review-required", label: "Review Required" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export function FiltersSection({
  totalJobs,
  statusFilter,
  onStatusFilterChange,
}: FiltersSectionProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-100 p-6 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        {/* Search Bar */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <input
              type="text"
              placeholder="Search marking jobs..."
              className="w-full px-4 py-2 pl-10 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-3">
              <FontAwesomeIcon
                icon={faSearch}
                className="h-4 w-4 text-gray-400"
              />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span className="font-medium">{totalJobs} Jobs Total</span>
          </div>

          <div className="flex items-center space-x-2">
            <FontAwesomeIcon
              icon={faFilter}
              className="h-4 w-4 text-gray-400"
            />
            <Select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              options={statusFilterOptions}
              className="w-48"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
