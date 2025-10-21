"use client";

import { useEffect, useState } from "react";
import { VerificationModal } from "../../components/Modals/VerificationModal";
import { useToast } from "../../hooks/useToast";
import axiosInstance from "@/utils/axiosclient";

import { User, UserRoles, VerifyStatus } from "./types/types";
import { PageHeader } from "./components/PageHeader";
import { StatsOverview } from "./components/StatsOverview";
import { FiltersSection } from "./components/FiltersSection";
import { UsersTable } from "./components/UsersTable";

export default function Users() {
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [verificationFilter, setVerificationFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentUserRole, setCurrentUserRole] = useState<UserRoles>(
    UserRoles.BASIC
  );

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const { showToast } = useToast();

  // Filter and sort users
  const filteredUsers = users
    .filter((user) => {
      // Filter by verification status
      const verificationMatch =
        verificationFilter === "all" ||
        user.verify_status === verificationFilter;

      // Filter by role
      const roleMatch = roleFilter === "all" || user.role === roleFilter;

      // Filter by search query (search in name and email)
      const searchMatch =
        searchQuery.trim() === "" ||
        `${user.first_name} ${user.last_name}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase());

      return verificationMatch && roleMatch && searchMatch;
    })
    .sort((a, b) => {
      // Sort by verification status: unverified first, then faculty admins
      if (
        a.verify_status !== VerifyStatus.ADMINVERIFIED &&
        b.verify_status === VerifyStatus.ADMINVERIFIED
      ) {
        return -1;
      }
      if (
        a.verify_status === VerifyStatus.ADMINVERIFIED &&
        b.verify_status !== VerifyStatus.ADMINVERIFIED
      ) {
        return 1;
      }
      // If both have same verification status, sort by role: faculty admins first
      if (
        a.role === UserRoles.FACULTYADMIN &&
        b.role !== UserRoles.FACULTYADMIN
      ) {
        return -1;
      }
      if (
        a.role !== UserRoles.FACULTYADMIN &&
        b.role === UserRoles.FACULTYADMIN
      ) {
        return 1;
      }
      // Finally sort by name
      return `${a.first_name} ${a.last_name}`.localeCompare(
        `${b.first_name} ${b.last_name}`
      );
    });

  // Pagination calculations
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const handleVerificationFilterChange = (status: string) => {
    setVerificationFilter(status);
    setCurrentPage(1); // Reset to first page when changing filter
  };

  const handleRoleFilterChange = (role: string) => {
    setRoleFilter(role);
    setCurrentPage(1); // Reset to first page when changing filter
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleVerifyUser = async (userId: number) => {
    try {
      await axiosInstance.patch(`/api/users/${userId}/verify`);
      showToast("User verified successfully", "success");

      // Update local state
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === userId
            ? { ...user, verify_status: VerifyStatus.ADMINVERIFIED }
            : user
        )
      );
    } catch (error) {
      console.error("Failed to verify user:", error);
      showToast("Failed to verify user", "error");
    }
  };

  const handleToggleRole = async (userId: number, newRole: UserRoles) => {
    try {
      await axiosInstance.patch(`/api/users/${userId}/update-role`, {
        role: newRole,
      });
      showToast(`User role updated to ${newRole}`, "success");

      // Update local state
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === userId ? { ...user, role: newRole } : user
        )
      );
    } catch (error) {
      console.error("Failed to update user role:", error);
      showToast("Failed to update user role", "error");
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      await axiosInstance.delete(`/api/users/${selectedUser}`);
      showToast("User deleted successfully", "success");

      // Update local state
      setUsers((prevUsers) =>
        prevUsers.filter((user) => user.id !== selectedUser)
      );
      setIsDeleteModalOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error("Failed to delete user:", error);
      showToast("Failed to delete user", "error");
    }
  };

  const confirmDelete = (userId: number) => {
    setSelectedUser(userId);
    setIsDeleteModalOpen(true);
  };

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get("/api/users");
        const usersData: User[] = response.data as User[];
        setUsers(usersData);
      } catch (error) {
        console.error("Failed to fetch users:", error);
        showToast("Failed to load users", "error");
      } finally {
        setLoading(false);
      }
    };

    // Also get current user role from context or token
    // For now, assuming we can get it from the auth context
    const getCurrentUserRole = async () => {
      try {
        // This would typically come from your auth context
        // For now, we'll assume Faculty Admin role
        setCurrentUserRole(UserRoles.FACULTYADMIN);
      } catch (error) {
        console.error("Failed to get current user role:", error);
      }
    };

    fetchUsers();
    getCurrentUserRole();
  }, [showToast]);

  return (
    <div className="space-y-6">
      <PageHeader />

      <StatsOverview users={users} />

      <FiltersSection
        totalUsers={users.length}
        verificationFilter={verificationFilter}
        roleFilter={roleFilter}
        searchQuery={searchQuery}
        onVerificationFilterChange={handleVerificationFilterChange}
        onRoleFilterChange={handleRoleFilterChange}
        onSearchChange={handleSearchChange}
      />

      {loading ? (
        <div className="bg-white rounded-lg border border-gray-100 p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading users...</p>
        </div>
      ) : (
        <UsersTable
          users={paginatedUsers}
          currentUserRole={currentUserRole}
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          totalItems={filteredUsers.length}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
          onVerifyUser={handleVerifyUser}
          onToggleRole={handleToggleRole}
          onDeleteUser={confirmDelete}
        />
      )}

      <VerificationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteUser}
        title="Delete User"
        message="Are you sure you want to delete this user? This action cannot be undone."
        confirmText="Delete"
        type="warning"
      />
    </div>
  );
}
