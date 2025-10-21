import React from "react";
import { Select } from "../../../components/UI/Select";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilter, faSearch } from "@fortawesome/free-solid-svg-icons";
import { FilterOption } from "../types/types";

interface FiltersSectionProps {
  totalUsers: number;
  verificationFilter: string;
  roleFilter: string;
  searchQuery: string;
  onVerificationFilterChange: (status: string) => void;
  onRoleFilterChange: (role: string) => void;
  onSearchChange: (query: string) => void;
}

const verificationFilterOptions: FilterOption[] = [
  { value: "all", label: "All Verification Status" },
  { value: "admin_verified", label: "Admin Verified" },
  { value: "email_verified", label: "Email Verified" },
  { value: "none", label: "Unverified" },
];

const roleFilterOptions: FilterOption[] = [
  { value: "all", label: "All Roles" },
  { value: "Super User", label: "Super Admin" },
  { value: "Faculty Admin", label: "Faculty Admin" },
  { value: "Basic User", label: "Basic User" },
];

export function FiltersSection({
  totalUsers,
  verificationFilter,
  roleFilter,
  searchQuery,
  onVerificationFilterChange,
  onRoleFilterChange,
  onSearchChange,
}: FiltersSectionProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-100 p-6 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        {/* Search Bar */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span className="font-medium">{totalUsers} Users Total</span>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <FontAwesomeIcon
                icon={faFilter}
                className="h-4 w-4 text-gray-400"
              />
              <Select
                value={verificationFilter}
                onChange={(e) => onVerificationFilterChange(e.target.value)}
                options={verificationFilterOptions}
                className="w-48"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Select
                value={roleFilter}
                onChange={(e) => onRoleFilterChange(e.target.value)}
                options={roleFilterOptions}
                className="w-40"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
