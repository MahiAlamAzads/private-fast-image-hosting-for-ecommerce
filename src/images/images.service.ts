import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import sharp from 'sharp';

import { StorageService } from 'src/storage/storage.service';

@Injectable()
export class ImagesService {
  private readonly port: string;

  constructor(
    private readonly storage: StorageService,
    private readonly config: ConfigService,
  ) {
    this.port = this.config.getOrThrow<string>('PORT');
  }

  /**
   * Images are stored under a fixed prefix so the bucket can also host other
   * object types without filename collisions.
   */
  async getImage(filename: string) {
    return this.storage.get(`images/${filename}`);
  }

  /**
   * Deletes multiple images by their filenames.
   *
   * Filenames are mapped to their full storage keys (e.g. `images/<id>.webp`)
   * before being passed to the storage layer.
   */
  async deleteMany(filenames: string[]) {
    const keys = filenames.map((filename) => `images/${filename}`);
    await this.storage.deleteMany(keys);
  }

  async upload(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Image is required');
    }

    const id = randomUUID();

    // Normalize uploads to WebP to keep responses small and cache-friendly.
    const buffer = await sharp(file.buffer)
      .webp({
        quality: 80,
      })
      .toBuffer();

    const key = `images/${id}.webp`;

    await this.storage.upload(key, buffer, 'image/webp');

    return {
      id,
      key,
      url: `http://localhost:${this.port}/images/${id}.webp`,
    };
  }

  /**
   * Uploads multiple images in a single request.
   *
   * Each file is normalized to WebP and stored under a unique UUID key.
   * Returns an array of upload results, one per file.
   */
  async uploadMany(files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('At least one image is required');
    }

    return Promise.all(files.map((file) => this.upload(file)));
  }
}
