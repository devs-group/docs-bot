"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Github } from "lucide-react";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn("github", { callbackUrl: "/dashboard" });
    } finally {
      setIsLoading(false); // Reset even if it redirects
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 dark">
      <Card className="w-full max-w-md animate-in fade-in-0 duration-500 border-border bg-card">
        {/* Header */}
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-semibold tracking-tight text-foreground">
            Welcome Back
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Sign in to access your dashboard
          </p>
        </CardHeader>

        {/* Content */}
        <CardContent className="space-y-6">
          <Button
            variant="outline"
            className="w-full gap-2 border-border bg-background py-6 text-sm font-medium text-foreground transition-all hover:bg-muted"
            onClick={handleSignIn}
            disabled={isLoading}
          >
            <Github className="h-5 w-5 text-foreground" />
            {isLoading ? "Signing in..." : "Sign in with GitHub"}
          </Button>

          {/* Uncomment for additional providers */}
          {/* <Separator className="my-4 bg-border" />
          <Button
            variant="outline"
            className="w-full gap-2 border-border bg-background py-6 text-sm font-medium text-foreground transition-all hover:bg-muted"
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            disabled={isLoading}
          >
            <span className="h-5 w-5 text-foreground">G</span>
            Sign in with Google
          </Button> */}
        </CardContent>

        {/* Footer */}
        <CardFooter className="flex justify-center">
          <p className="text-xs text-muted-foreground">
            By signing in, you agree to our{" "}
            <a href="#" className="underline hover:text-primary">
              Terms
            </a>{" "}
            and{" "}
            <a href="#" className="underline hover:text-primary">
              Privacy Policy
            </a>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
