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

  async getImage(filename: string) {
    return this.storage.get(`images/${filename}`);
  }

  async upload(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Image is required');
    }

    const id = randomUUID();

    // TODO: Take image quality from the user in the future.
    const buffer = await sharp(file.buffer)
      .webp({
        quality: 100,
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
}
