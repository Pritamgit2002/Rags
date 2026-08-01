import postgres from "postgres";
import { env } from "@/constants/env";

export const postgres_client = postgres(env.DATABASE_URL!);
