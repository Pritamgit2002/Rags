import { buildApp } from "./app";
import { env } from "./constants/env";

const PORT = Number(env.PORT);
const HOST = process.env.HOST || "0.0.0.0";

const app = buildApp();

app.listen({ port: PORT, host: HOST }, (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`crud running on port ${PORT}`);
});
