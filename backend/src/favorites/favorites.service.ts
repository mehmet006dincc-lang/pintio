import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Favorite } from '../entities/favorite.entity';
import { Product } from '../entities/product.entity';
import { Deal } from '../entities/deal.entity';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectRepository(Favorite) private favoritesRepo: Repository<Favorite>,
    @InjectRepository(Product) private productsRepo: Repository<Product>,
    @InjectRepository(Deal) private dealsRepo: Repository<Deal>,
  ) {}

  async findAll(userId: string) {
    const favorites = await this.favoritesRepo.find({
      where: { userId },
      relations: { product: { category: true } },
      order: { createdAt: 'DESC' },
    });

    return Promise.all(
      favorites.map(async (f) => {
        const deal = await this.dealsRepo.findOne({ where: { productId: f.productId } });
        return this.formatProduct(f.product, deal ?? undefined);
      }),
    );
  }

  async add(userId: string, productId: string) {
    const product = await this.productsRepo.findOne({ where: { id: productId } });
    if (!product) throw new NotFoundException('Ürün bulunamadı');

    const existing = await this.favoritesRepo.findOne({ where: { userId, productId } });
    if (!existing) {
      await this.favoritesRepo.save({ userId, productId });
    }

    product.monitoringTier = 'P0';
    product.nextCheckAt = new Date();
    await this.productsRepo.save(product);

    return { success: true };
  }

  async remove(userId: string, productId: string) {
    await this.favoritesRepo.delete({ userId, productId });
    return { success: true };
  }

  private formatProduct(product: Product, deal?: Deal) {
    const current = product.currentPrice ? parseFloat(String(product.currentPrice)) : null;
    const original = product.originalPrice ? parseFloat(String(product.originalPrice)) : null;

    return {
      id: product.id,
      title: product.title,
      brand: product.brand,
      category: product.category?.name ?? null,
      imageUrl: product.imageUrl,
      productUrl: product.productUrl,
      currentPrice: current,
      originalPrice: original,
      discountPct: deal?.discountPct ?? null,
      is6mLow: deal?.is6mLow ?? false,
      isFlash: product.isFlash,
    };
  }
}
