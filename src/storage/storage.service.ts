import { Injectable, OnModuleInit } from '@nestjs/common';

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';

import { ConfigService } from '@nestjs/config';

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(private readonly config: ConfigService) {
    this.bucket = this.config.getOrThrow('MINIO_BUCKET');

    this.client = new S3Client({
      endpoint: `http://${this.config.getOrThrow('MINIO_ENDPOINT')}:${this.config.getOrThrow('MINIO_PORT')}`,

      // MinIO accepts any valid S3 region, but the AWS SDK requires one.
      region: 'us-east-1',

      credentials: {
        accessKeyId: this.config.getOrThrow('MINIO_ACCESS_KEY'),
        secretAccessKey: this.config.getOrThrow('MINIO_SECRET_KEY'),
      },

      // Required for MinIO and other S3-compatible services that do not support
      // AWS virtual-hosted bucket URLs by default.
      forcePathStyle: true,
    });
  }

  onModuleInit() {
    console.log('MinIO storage initialized');
  }

  async upload(key: string, buffer: Buffer, contentType: string) {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      }),
    );
  }

  /**
   * Reads an object by its storage key.
   *
   * The key is the full path inside the bucket, for example
   * `images/avatar.webp` or `uploads/2026/09/profile.webp`.
   */
  async get(key: string): Promise<{
    buffer: Buffer;
    contentType: string;
  }> {
    const result = await this.client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );

    if (!result.Body) {
      throw new Error('Image body is empty');
    }

    const buffer = Buffer.from(await result.Body.transformToByteArray());

    return {
      buffer,
      contentType: result.ContentType ?? 'application/octet-stream',
    };
  }

  async delete(key: string) {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
  }

  /**
   * Deletes multiple objects in a single S3 API call.
   *
   * The AWS SDK automatically chunks the request into batches of 1000 keys,
   * which is the S3 limit for a single DeleteObjects request.
   */
  async deleteMany(keys: string[]) {
    if (keys.length === 0) {
      return;
    }

    await this.client.send(
      new DeleteObjectsCommand({
        Bucket: this.bucket,
        Delete: {
          Objects: keys.map((key) => ({ Key: key })),
          Quiet: true,
        },
      }),
    );
  }
}
