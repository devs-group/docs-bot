import EditChatbotPage from "./EditChatbotPage";

interface EditChatbotPageProps {
  params: Promise<{ chatbotId: string }>;
}

export default async function Wrapper({ params }: EditChatbotPageProps) {
  const resolvedParams = await params;
  return <EditChatbotPage params={resolvedParams} />;
}
