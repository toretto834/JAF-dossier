import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AuthScreen } from "@/components/auth-screen";

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/dossier");
  return <AuthScreen />;
}
