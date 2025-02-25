import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "./api/auth/[...nextauth]/route";

export default async function RootPage() {
  const session = await getServerSession(authOptions);

  // If user is not logged in, redirect to login page
  if (!session) {
    redirect("/login");
  }

  // If user is logged in, redirect to dashboard
  redirect("/dashboard");
}
