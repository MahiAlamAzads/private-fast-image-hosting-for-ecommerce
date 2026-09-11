import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Res,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';

import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';

import { ApiKeyGuard } from 'src/auth/guards/api-key.guard';
import { ImagesService } from './images.service';

import type { Response } from 'express';

@ApiTags('Images')
@Controller('images')
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  @Post('upload')
  @UseGuards(ApiKeyGuard)
  @ApiSecurity('api-key')
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({
    summary: 'Upload an image',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
        },
      },
      required: ['image'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Image uploaded successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Image is required',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid API key',
  })
  async upload(@UploadedFile() file: Express.Multer.File) {
    return this.imagesService.upload(file);
  }

  @Post('upload-many')
  @UseGuards(ApiKeyGuard)
  @ApiSecurity('api-key')
  @UseInterceptors(FilesInterceptor('images', 10))
  @ApiOperation({
    summary: 'Bulk upload images',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        images: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
      required: ['images'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Images uploaded successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'At least one image is required',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid API key',
  })
  async uploadMany(@UploadedFiles() files: Express.Multer.File[]) {
    return this.imagesService.uploadMany(files);
  }

  @Delete()
  @UseGuards(ApiKeyGuard)
  @ApiSecurity('api-key')
  @ApiOperation({
    summary: 'Bulk delete images',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        filenames: {
          type: 'array',
          items: { type: 'string' },
          example: ['uuid1.webp', 'uuid2.webp'],
        },
      },
      required: ['filenames'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Images deleted successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'filenames array is required',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid API key',
  })
  async deleteMany(@Body('filenames') filenames: string[]) {
    await this.imagesService.deleteMany(filenames);
    return { deleted: filenames.length };
  }

  /**
   * Streams the optimized image bytes directly from object storage.
   *
   * Uploaded images are immutable because filenames use generated UUIDs, so
   * clients and CDNs can safely cache successful responses for a long time.
   */
  @Get(':filename')
  @ApiOperation({
    summary: 'Get an image',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns the requested image',
  })
  async getImage(@Param('filename') filename: string, @Res() res: Response) {
    const image = await this.imagesService.getImage(filename);

    res.set({
      'Content-Type': image.contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
    });

    res.send(image.buffer);
  }
}
