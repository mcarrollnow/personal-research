"use client"

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/admin/admin-layout";
import { adminAuthService } from "@/lib/admin-auth";

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    // Check if admin is authenticated
    const checkAuth = async () => {
      if (!adminAuthService.isAuthenticated()) {
        router.push("/admin/login");
        return;
      }

      // Validate session
      const isValid = await adminAuthService.validateSession();
      if (!isValid) {
        router.push("/admin/login");
        return;
      }
    };

    checkAuth();
  }, [router]);

  // Don't render anything while checking authentication
  if (!adminAuthService.isAuthenticated()) {
    return null;
  }

  return <AdminLayout>{children}</AdminLayout>;
}
