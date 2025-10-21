import React from "react";
import { User, UserRoles, VerifyStatus } from "../types/types";

interface StatsOverviewProps {
  users: User[];
}

export function StatsOverview({ users }: StatsOverviewProps) {
  const totalUsers = users.length;
  const verifiedUsers = users.filter(
    (user) => user.verify_status === VerifyStatus.ADMINVERIFIED
  ).length;
  const unverifiedUsers = users.filter(
    (user) => user.verify_status !== VerifyStatus.ADMINVERIFIED
  ).length;
  const facultyAdmins = users.filter(
    (user) => user.role === UserRoles.FACULTYADMIN
  ).length;
  const basicUsers = users.filter(
    (user) => user.role === UserRoles.BASIC
  ).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
      <div className="bg-white rounded-lg border border-gray-100 p-6">
        <div className="flex items-center">
          <div className="p-2 bg-blue-100 rounded-lg">
            <svg
              className="h-6 w-6 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
              />
            </svg>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {totalUsers}
            </h3>
            <p className="text-sm text-gray-600">Total Users</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-100 p-6">
        <div className="flex items-center">
          <div className="p-2 bg-green-100 rounded-lg">
            <svg
              className="h-6 w-6 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {verifiedUsers}
            </h3>
            <p className="text-sm text-gray-600">Verified</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-100 p-6">
        <div className="flex items-center">
          <div className="p-2 bg-yellow-100 rounded-lg">
            <svg
              className="h-6 w-6 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {unverifiedUsers}
            </h3>
            <p className="text-sm text-gray-600">Pending Verification</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-100 p-6">
        <div className="flex items-center">
          <div className="p-2 bg-purple-100 rounded-lg">
            <svg
              className="h-6 w-6 text-purple-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {facultyAdmins}
            </h3>
            <p className="text-sm text-gray-600">Faculty Admins</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-100 p-6">
        <div className="flex items-center">
          <div className="p-2 bg-gray-100 rounded-lg">
            <svg
              className="h-6 w-6 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {basicUsers}
            </h3>
            <p className="text-sm text-gray-600">Basic Users</p>
          </div>
        </div>
      </div>
    </div>
  );
}
