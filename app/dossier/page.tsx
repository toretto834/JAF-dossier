import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Workspace } from "@/components/workspace";

export default async function DossierPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion");
  return <Workspace user={user} />;
}
