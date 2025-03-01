"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ChatbotList } from "@/components/chatbot/ChatbotList";

export default function ChatbotsPage() {
  const router = useRouter();

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-foreground">Chatbots</h1>
        <Button
          onClick={() => router.push("/dashboard/chatbots/create")}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create New
        </Button>
      </div>

      <div className="mt-6">
        <ChatbotList />
      </div>
    </div>
  );
}
