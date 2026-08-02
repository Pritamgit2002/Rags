import { createClient } from "@/services/supabase-server";
import { redirect } from "next/navigation";
import Dashboard from "./_components/dashboard";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <Dashboard
      userId={user.id}
      userName={
        user.user_metadata?.full_name ??
        user.user_metadata?.name ??
        user.email ??
        "User"
      }
      userEmail={user.email ?? ""}
      userAvatar={user.user_metadata?.avatar_url as string | undefined}
    />
  );
}
