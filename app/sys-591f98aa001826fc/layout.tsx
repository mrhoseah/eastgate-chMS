import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/signin");
  }

  // Only SUPERADMIN can access admin routes
  if (session.user.role !== "SUPERADMIN") {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
