import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import sharp from 'sharp';
import { randomUUID } from 'crypto';
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

    // todo: here we will take image quality from users
    const buffer = await sharp(file.buffer)
      .webp({
        quality: 45,
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
