import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  Get,
  Param,
  Res,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';

import { ApiKeyGuard } from 'src/auth/guards/api-key.guard';
import { ImagesService } from './images.service';
import type { Response } from 'express';

@Controller('images')
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  @Post('upload')
  @UseGuards(ApiKeyGuard)
  @UseInterceptors(FileInterceptor('image'))
  async upload(@UploadedFile() file: Express.Multer.File) {
    return this.imagesService.upload(file);
  }

  @Get(':filename')
  async getImage(@Param('filename') filename: string, @Res() res: Response) {
    const image = await this.imagesService.getImage(filename);

    res.set({
      'Content-Type': image.contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
    });

    res.send(image.buffer);
  }
}
