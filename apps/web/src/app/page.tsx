import { createClient } from "@/services/supabase-server";
import { redirect } from "next/navigation";
import SignOutButton from "./sign-out-button";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const name =
    user.user_metadata?.full_name ??
    user.user_metadata?.name ??
    user.email ??
    "there";
  const avatar = user.user_metadata?.avatar_url as string | undefined;

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-8 p-8">
      <div className="flex flex-col items-center gap-4 text-center">
        {avatar && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatar}
            alt={name}
            width={72}
            height={72}
            className="rounded-full"
          />
        )}
        <div>
          <h1 className="text-2xl font-bold">Hello, {name}!</h1>
          <p className="text-sm text-black/50 dark:text-white/50">
            {user.email}
          </p>
        </div>
      </div>

      <SignOutButton />
    </div>
  );
}
