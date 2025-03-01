import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { MessageSquare, Mic } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="container mx-auto py-8 space-y-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-foreground mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-card border-border shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Chatbots
            </CardTitle>
            <CardDescription>
              Create and manage AI chatbots based on your documents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/dashboard/chatbots">View Chatbots</Link>
            </Button>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5" />
              Voice Content
            </CardTitle>
            <CardDescription>
              Generate voice narrations from your documents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/dashboard/voice">View Voice Content</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
