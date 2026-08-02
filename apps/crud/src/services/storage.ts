import {
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { Readable } from "stream";
import { delete_from_r2, r2, upload_to_r2 } from "@/lib/r2";
import { env } from "@/constants/env";

export async function listObjects(prefix?: string) {
  const res = await r2.send(
    new ListObjectsV2Command({ Bucket: env.R2_BUCKET_NAME, Prefix: prefix })
  );
  return (res.Contents ?? []).map((obj) => ({
    key: obj.Key,
    size: obj.Size,
    lastModified: obj.LastModified,
  }));
}

export async function uploadObject(
  key: string,
  body: Buffer,
  contentType: string
) {
  const storage_url = await upload_to_r2(key, body, contentType);
  return { key, storage_url };
}

export async function getObject(key: string) {
  const res = await r2.send(
    new GetObjectCommand({ Bucket: env.R2_BUCKET_NAME, Key: key })
  );
  return {
    stream: res.Body as Readable,
    contentType: res.ContentType ?? "application/octet-stream",
    contentLength: res.ContentLength,
  };
}

export async function headObject(key: string) {
  const res = await r2.send(
    new HeadObjectCommand({ Bucket: env.R2_BUCKET_NAME, Key: key })
  );
  return {
    contentType: res.ContentType ?? "application/octet-stream",
    contentLength: res.ContentLength,
    lastModified: res.LastModified,
  };
}

export async function deleteObject(key: string) {
  await delete_from_r2(key);
}
