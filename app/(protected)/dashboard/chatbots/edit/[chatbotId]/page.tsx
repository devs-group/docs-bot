"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { TabsInputChatbotForm } from "@/components/chatbot/TabsInputChatbotForm";
import { Toaster } from "@/components/ui/sonner";

export default function EditChatbotPage({ params }: { params: { chatbotId: string } }) {
  const router = useRouter();

  const handleChatbotUpdated = () => {
    // Redirect to the dashboard after successful update
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
          Edit Chatbot
        </h1>
      </div>

      <div className="p-1">
        <TabsInputChatbotForm 
          existingChatbotId={params.chatbotId} 
          onChatbotUpdated={handleChatbotUpdated} 
        />
      </div>

      <Toaster />
    </div>
  );
}
