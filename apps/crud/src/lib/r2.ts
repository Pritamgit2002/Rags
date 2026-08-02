import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "@/constants/env";

export const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID!,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY!,
  },
});

function require_r2_config() {
  if (
    !env.R2_ACCOUNT_ID ||
    !env.R2_ACCESS_KEY_ID ||
    !env.R2_SECRET_ACCESS_KEY ||
    !env.R2_BUCKET_NAME
  ) {
    throw new Error(
      "R2 is not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET_NAME."
    );
  }
}

export async function upload_to_r2(
  key: string,
  buffer: Buffer,
  content_type: string
): Promise<string> {
  require_r2_config();

  await r2.send(
    new PutObjectCommand({
      Bucket: env.R2_BUCKET_NAME!,
      Key: key,
      Body: buffer,
      ContentType: content_type,
    })
  );

  if (env.R2_PUBLIC_URL) {
    return `${env.R2_PUBLIC_URL.replace(/\/$/, "")}/${key}`;
  }

  return get_presigned_url(key);
}

export async function get_presigned_url(
  key: string,
  expires_in_seconds = 3600
): Promise<string> {
  require_r2_config();

  return getSignedUrl(
    r2,
    new GetObjectCommand({ Bucket: env.R2_BUCKET_NAME!, Key: key }),
    { expiresIn: expires_in_seconds }
  );
}

export async function delete_from_r2(key: string): Promise<void> {
  require_r2_config();

  await r2.send(
    new DeleteObjectCommand({ Bucket: env.R2_BUCKET_NAME!, Key: key })
  );
}
