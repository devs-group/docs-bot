"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export default function LogoutButton() {
  const handleSignOut = async () => {
    try {
      await signOut({ callbackUrl: "/login" });
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <Button
      variant="ghost"
      className="text-muted-foreground hover:text-foreground hover:bg-muted flex items-center gap-2"
      onClick={handleSignOut}
    >
      <LogOut className="h-4 w-4" />
      Sign Out
    </Button>
  );
}