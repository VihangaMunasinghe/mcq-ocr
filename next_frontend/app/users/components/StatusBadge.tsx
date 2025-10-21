import React from "react";
import { UserRoles, VerifyStatus } from "../types/types";

interface StatusBadgeProps {
  status: VerifyStatus;
}

interface RoleBadgeProps {
  role: UserRoles;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const getStatusStyle = (status: VerifyStatus) => {
    switch (status) {
      case VerifyStatus.ADMINVERIFIED:
        return "bg-green-100 text-green-800 border-green-200";
      case VerifyStatus.EMAILVERIFIED:
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case VerifyStatus.NONE:
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusText = (status: VerifyStatus) => {
    switch (status) {
      case VerifyStatus.ADMINVERIFIED:
        return "Admin Verified";
      case VerifyStatus.EMAILVERIFIED:
        return "Email Verified";
      case VerifyStatus.NONE:
        return "Unverified";
      default:
        return "Unknown";
    }
  };

  const getStatusIcon = (status: VerifyStatus) => {
    switch (status) {
      case VerifyStatus.ADMINVERIFIED:
        return (
          <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        );
      case VerifyStatus.EMAILVERIFIED:
        return (
          <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        );
      case VerifyStatus.NONE:
        return (
          <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusStyle(
        status
      )}`}
    >
      {getStatusIcon(status)}
      {getStatusText(status)}
    </span>
  );
}

export function RoleBadge({ role }: RoleBadgeProps) {
  const getRoleStyle = (role: UserRoles) => {
    switch (role) {
      case UserRoles.SUPERADMIN:
        return "bg-red-100 text-red-800 border-red-200";
      case UserRoles.FACULTYADMIN:
        return "bg-purple-100 text-purple-800 border-purple-200";
      case UserRoles.BASIC:
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getRoleIcon = (role: UserRoles) => {
    switch (role) {
      case UserRoles.SUPERADMIN:
        return (
          <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M9.504 1.132a1 1 0 01.992 0l1.75 1a1 1 0 11-.992 1.736L10 3.152l-1.254.716a1 1 0 11-.992-1.736l1.75-1zM5.618 4.504a1 1 0 01-.372 1.364L5.016 6l.23.132a1 1 0 11-.992 1.736L3 7.723V8a1 1 0 01-2 0V6a.996.996 0 01.52-.878l1.734-.99a1 1 0 011.364.372zm8.764 0a1 1 0 011.364-.372l1.734.99A.996.996 0 0118 6v2a1 1 0 11-2 0v-.277l-1.254.145a1 1 0 11-.992-1.736L14.984 6l-.23-.132a1 1 0 01-.372-1.364zm-7 4a1 1 0 011.364-.372L10 8.848l1.254-.716a1 1 0 11.992 1.736L11 10.723V12a1 1 0 11-2 0v-1.277l-1.246-.855a1 1 0 01-.372-1.364zM3 11a1 1 0 011 1v1.277l1.254.145a1 1 0 11-.992 1.736L3.984 15l-.23.132a1 1 0 11-.992-1.736L3 12.723V12a1 1 0 011-1zm14 0a1 1 0 011 1v.723l.246.855a1 1 0 11-.992 1.736L16.984 15l-.23-.132a1 1 0 11-.992-1.736L17 12.277V12a1 1 0 011-1zm-9.618 5.504a1 1 0 011.364.372l.254.145V16a1 1 0 112 0v1.021l.254-.145a1 1 0 11.992 1.736l-1.735.992a.995.995 0 01-1.022 0l-1.735-.992a1 1 0 01-.372-1.364z"
              clipRule="evenodd"
            />
          </svg>
        );
      case UserRoles.FACULTYADMIN:
        return (
          <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M9.504 1.132a1 1 0 01.992 0l1.75 1a1 1 0 11-.992 1.736L10 3.152l-1.254.716a1 1 0 11-.992-1.736l1.75-1zM5.618 4.504a1 1 0 01-.372 1.364L5.016 6l.23.132a1 1 0 11-.992 1.736L3 7.723V8a1 1 0 01-2 0V6a.996.996 0 01.52-.878l1.734-.99a1 1 0 011.364.372z"
              clipRule="evenodd"
            />
          </svg>
        );
      case UserRoles.BASIC:
        return (
          <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
              clipRule="evenodd"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleStyle(
        role
      )}`}
    >
      {getRoleIcon(role)}
      {role}
    </span>
  );
}
