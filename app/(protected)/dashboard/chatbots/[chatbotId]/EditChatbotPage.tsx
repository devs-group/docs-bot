"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ChatbotCreationForm } from "@/components/chatbot/ChatbotCreationForm";
import { Toaster } from "@/components/ui/sonner";

interface EditChatbotPageProps {
  params: { chatbotId: string }; // Params is now a resolved object
}

export default function EditChatbotPage({ params }: EditChatbotPageProps) {
  const { chatbotId } = params; // Safe to destructure, no Promise
  const router = useRouter();

  const handleChatbotUpdated = () => {
    router.push("/dashboard");
  };

  return (
    <div className="container mx-auto py-8 space-y-6 max-w-4xl">
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="h-10 w-10"
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-3xl font-bold text-foreground">Edit Chatbot</h1>
      </div>

      <div className="p-1">
        <ChatbotCreationForm
          existingChatbotId={chatbotId}
          onChatbotUpdated={handleChatbotUpdated}
          onChatbotCreated={() => {}} // Not used in edit mode
        />
      </div>

      <Toaster />
    </div>
  );
}
