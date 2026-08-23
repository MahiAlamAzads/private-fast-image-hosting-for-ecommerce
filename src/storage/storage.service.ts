import { Injectable, OnModuleInit } from '@nestjs/common';

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
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

      region: 'us-east-1',

      credentials: {
        accessKeyId: this.config.getOrThrow('MINIO_ACCESS_KEY'),
        secretAccessKey: this.config.getOrThrow('MINIO_SECRET_KEY'),
      },

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

  async delete(key: string) {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
  }
}
