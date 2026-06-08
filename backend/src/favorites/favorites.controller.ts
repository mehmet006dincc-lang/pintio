import { Controller, Get, Post, Delete, Param, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FavoritesService } from './favorites.service';
import { User } from '../entities/user.entity';

@Controller('api/favorites')
@UseGuards(AuthGuard('jwt'))
export class FavoritesController {
  constructor(private favoritesService: FavoritesService) {}

  @Get()
  findAll(@Req() req: { user: User }) {
    return this.favoritesService.findAll(req.user.id);
  }

  @Post(':productId')
  add(@Req() req: { user: User }, @Param('productId') productId: string) {
    return this.favoritesService.add(req.user.id, productId);
  }

  @Delete(':productId')
  remove(@Req() req: { user: User }, @Param('productId') productId: string) {
    return this.favoritesService.remove(req.user.id, productId);
  }
}
