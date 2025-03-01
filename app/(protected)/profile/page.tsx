"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Calendar, Mail, User } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect } from "react";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);
  
  // Format the date when the account was created
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "PPP"); // Format: "April 29, 2023"
    } catch (error) {
      return "Invalid date";
    }
  };

  const userInitials = session?.user?.name
    ? session.user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2)
    : "U";

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
          Profile
        </h1>
      </div>

      <Card className="w-full bg-card border-border shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl">Account Information</CardTitle>
          <CardDescription>
            View and manage your account details
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {status === "loading" ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-16 w-16 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          ) : session?.user ? (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                <Avatar className="h-24 w-24 border border-border">
                  <AvatarImage
                    src={session.user.image || ""}
                    alt={session.user.name || "User"}
                  />
                  <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                
                <div className="space-y-1">
                  <h2 className="text-xl font-semibold">{session.user.name || "Anonymous User"}</h2>
                  <p className="text-muted-foreground flex items-center">
                    <Mail className="mr-2 h-4 w-4" />
                    {session.user.email}
                  </p>
                  {session.user.id && (
                    <p className="text-sm text-muted-foreground flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      ID: {session.user.id}
                    </p>
                  )}
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Account Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Authentication Provider</p>
                    <p className="font-medium">GitHub</p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center">
                      <Calendar className="mr-2 h-4 w-4" />
                      Account Created
                    </p>
                    <p className="font-medium">
                      {formatDate(session.user.createdAt as string)}
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="p-4 bg-destructive/10 text-destructive rounded-md">
              <p>Unable to load profile information. Please try again later.</p>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between border-t border-border pt-6">
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard")}
          >
            Back to Dashboard
          </Button>
          
          <Button
            variant="default"
            onClick={() => router.push("/dashboard/api-keys")}
          >
            Manage API Keys
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
