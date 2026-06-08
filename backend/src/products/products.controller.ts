import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProductsService } from './products.service';

@Controller('api/products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Get('featured')
  featured(@Query('limit') limit?: string, @Query('offset') offset?: string) {
    return this.productsService.findFeatured(
      limit ? parseInt(limit) : 20,
      offset ? parseInt(offset) : 0,
    );
  }

  @Get('flash')
  flash(@Query('limit') limit?: string, @Query('offset') offset?: string) {
    return this.productsService.findFlash(
      limit ? parseInt(limit) : 20,
      offset ? parseInt(offset) : 0,
    );
  }

  @Get('search')
  search(@Query('q') q: string, @Query('limit') limit?: string) {
    return this.productsService.search(q, limit ? parseInt(limit) : 20);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Get(':id/price-history')
  priceHistory(@Param('id') id: string, @Query('days') days?: string) {
    return this.productsService.getPriceHistory(id, days ? parseInt(days) : 180);
  }

  @Post('track-url')
  @UseGuards(AuthGuard('jwt'))
  trackUrl(@Body('url') url: string) {
    return this.productsService.trackByUrl(url);
  }
}
