import { ChatbotList } from "@/components/chatbot/ChatbotList";

export default function DashboardPage() {
  return (
    <div className="container mx-auto py-8 space-y-6 max-w-4xl">
      <ChatbotList />
    </div>
  );
}
