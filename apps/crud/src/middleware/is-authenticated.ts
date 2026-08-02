import { db } from "@/lib/drizzle";
import { users } from "@repo/db";
import { supabase } from "@/services/supabase";
import { eq } from "drizzle-orm";
import { FastifyReply, FastifyRequest } from "fastify";

export const is_authenticated = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  const auth_header = req.headers.authorization;

  if (!auth_header?.startsWith("Bearer ")) {
    return reply
      .status(401)
      .send({ error: "Missing or invalid authorization header", code: 401 });
  }

  const token = auth_header.split("Bearer ")[1] as string;

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return reply
        .status(401)
        .send({ error: "Invalid or expired token", code: 401 });
    }

    let db_user = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .then((r) => r[0]);

    if (!db_user) {
      const name =
        user.user_metadata?.full_name ??
        user.user_metadata?.name ??
        user.email ??
        "Unknown";
      const email = user.email;
      if (!email) {
        return reply
          .status(401)
          .send({ error: "User email is required", code: 401 });
      }

      const [newUser] = await db
        .insert(users)
        .values({ id: user.id, name, email })
        .returning();

      if (!newUser) {
        return reply
          .status(500)
          .send({ error: "Failed to create user", code: 500 });
      }

      db_user = newUser;
    }

    req.user = db_user;
  } catch (err) {
    req.log.error(err);
    return reply
      .status(500)
      .send({ error: "Authentication failed", code: 500 });
  }
};
