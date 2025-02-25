"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ChatbotCreationForm } from "@/components/chatbot/ChatbotCreationForm";
import { Toaster } from "@/components/ui/sonner";

export default function CreateChatbotPage() {
  const router = useRouter();

  const handleChatbotCreated = (chatbotId: string) => {
    // Redirect to the dashboard after successful creation
    console.log("Chatbot created with ID:", chatbotId);
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
        <h1 className="text-3xl font-bold text-foreground">
          Create New Chatbot
        </h1>
      </div>

      <div className="p-1">
        <ChatbotCreationForm onChatbotCreated={handleChatbotCreated} />
      </div>

      <Toaster />
    </div>
  );
}
