"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toaster } from "@/components/ui/sonner";
import { ChatbotCreationForm } from "./ChatbotCreationForm";
import { ChatbotTester } from "./ChatbotTester";
import { EmptyChatbotState } from "./EmptyChatbotState";

export default function ChatbotForm() {
  const [chatbotId, setChatbotId] = useState("");
  const [activeTab, setActiveTab] = useState<"create" | "test">("create");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChatbotCreated = (newChatbotId: string) => {
    setChatbotId(newChatbotId);
    setActiveTab("test"); // Switch to test tab after successful creation
  };

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => setActiveTab(value as "create" | "test")}
      className="w-full"
    >
      <TabsList className="grid w-full grid-cols-2 mb-6">
        <TabsTrigger value="create" disabled={isSubmitting}>
          Create Chatbot
        </TabsTrigger>
        <TabsTrigger value="test" disabled={!chatbotId}>
          Test Chatbot
        </TabsTrigger>
      </TabsList>

      <TabsContent value="create">
        <ChatbotCreationForm onChatbotCreated={handleChatbotCreated} />
      </TabsContent>

      <TabsContent value="test">
        {chatbotId ? (
          <ChatbotTester chatbotId={chatbotId} />
        ) : (
          <EmptyChatbotState onCreateClick={() => setActiveTab("create")} />
        )}
      </TabsContent>
      <Toaster />
    </Tabs>
  );
}
