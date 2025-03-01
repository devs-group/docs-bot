"use client";

import { redirect, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import UserDropdownMenu from "@/components/UserDropdownMenu";
import Link from "next/link";
import { useEffect } from "react";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status } = useSession();
  const router = useRouter();

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Show loading state while checking authentication
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background text-foreground dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground dark">
      <header className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <Link href="/dashboard" className="text-xl font-semibold tracking-tight text-foreground hover:text-primary transition-colors">
              DocsBot
            </Link>
            <nav className="hidden md:flex items-center space-x-4">
              <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Dashboard
              </Link>
              <Link href="/dashboard/chatbots" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Chatbots
              </Link>
              <Link href="/dashboard/voice" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Voice
              </Link>
            </nav>
          </div>
          <UserDropdownMenu />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
}
