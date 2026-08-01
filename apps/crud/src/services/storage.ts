import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { Readable } from "stream";
import { r2 } from "@/lib/r2";
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
  await r2.send(
    new PutObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
  return { key };
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
  await r2.send(
    new DeleteObjectCommand({ Bucket: env.R2_BUCKET_NAME, Key: key })
  );
}
