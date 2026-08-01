"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/services/supabase";

export default function SignOutButton() {
  const router = useRouter();

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <button
      onClick={signOut}
      className="rounded-full h-10 px-5 border border-black/8 dark:border-white/[0.145] text-sm font-medium hover:bg-black/5 dark:hover:bg-white/8 transition-colors"
    >
      Sign out
    </button>
  );
}
