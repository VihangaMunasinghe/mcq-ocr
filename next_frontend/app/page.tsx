"use client";

import { ProtectedRoute } from "../components/ProtectedRoute";
import MainLayout from "../components/Layout/MainLayout";
import Dashboard from "./dashboard/page";

export default function Home() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <Dashboard />
      </MainLayout>
    </ProtectedRoute>
  );
}
