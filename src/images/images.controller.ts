import {
  Controller,
  Get,
  Param,
  Post,
  Res,
  UploadedFile,
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

import { FileInterceptor } from '@nestjs/platform-express';

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
