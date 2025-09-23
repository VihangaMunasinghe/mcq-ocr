import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "../hooks/useAuth";
import { ToastProvider } from "../hooks/useToast";

export const metadata: Metadata = {
  title: "UOM MCQ Auto Grader",
  description: "Automated MCQ grading system for University of Moratuwa",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="antialiased h-full m-0 p-0">
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
