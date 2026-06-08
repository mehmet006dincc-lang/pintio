import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, SelectQueryBuilder } from 'typeorm';
import { Product } from '../entities/product.entity';
import { Deal } from '../entities/deal.entity';
import { parseProductUrl, STORE_LABELS } from './url-parser';

interface DealFilters {
  categorySlug?: string;
  search?: string;
  store?: string;
}

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product) private productsRepo: Repository<Product>,
    @InjectRepository(Deal) private dealsRepo: Repository<Deal>,
    private dataSource: DataSource,
  ) {}

  /** Only products with an active deal (6m low or discount threshold met). */
  private buildDealsQuery(filters: DealFilters = {}): SelectQueryBuilder<Deal> {
    const qb = this.dealsRepo
      .createQueryBuilder('d')
      .innerJoinAndSelect('d.product', 'p')
      .leftJoinAndSelect('p.category', 'c')
      .where('p.is_active = true');

    if (filters.categorySlug && filters.categorySlug !== 'all') {
      qb.andWhere('c.slug = :slug', { slug: filters.categorySlug });
    }

    if (filters.store && filters.store !== 'all') {
      qb.andWhere('p.store = :store', { store: filters.store });
    }

    if (filters.search?.trim()) {
      qb.andWhere('(p.title ILIKE :q OR p.brand ILIKE :q)', {
        q: `%${filters.search.trim()}%`,
      });
    }

    return qb;
  }

  private async findDeals(limit = 20, offset = 0, filters: DealFilters = {}) {
    const deals = await this.buildDealsQuery(filters)
      .orderBy('d.is_6m_low', 'DESC')
      .addOrderBy('d.discount_pct', 'DESC')
      .addOrderBy('d.detected_at', 'DESC')
      .take(limit)
      .skip(offset)
      .getMany();

    return deals.map((d) => this.formatProduct(d.product, d));
  }

  async findFeatured(limit = 20, offset = 0) {
    return this.findDeals(limit, offset);
  }

  async findFlash(limit = 20, offset = 0) {
    return this.findDeals(limit, offset);
  }

  async findByCategory(categorySlug: string, limit = 20, offset = 0) {
    return this.findDeals(limit, offset, { categorySlug });
  }

  async search(q: string, limit = 20) {
    return this.findDeals(limit, 0, { search: q });
  }

  async findOne(id: string) {
    const product = await this.productsRepo.findOne({
      where: { id },
      relations: { category: true },
    });
    if (!product) throw new NotFoundException('Ürün bulunamadı');

    const deal = await this.dealsRepo.findOne({ where: { productId: id } });
    return this.formatProduct(product, deal ?? undefined);
  }

  async getPriceHistory(id: string, days = 180) {
    const product = await this.productsRepo.findOne({ where: { id } });
    if (!product) throw new NotFoundException('Ürün bulunamadı');

    const rows: Array<{ price: string; recorded_at: Date; in_stock: boolean }> =
      await this.dataSource.query(
        `SELECT price, recorded_at, in_stock
         FROM price_history
         WHERE product_id = $1
           AND recorded_at >= NOW() - ($2 || ' days')::interval
         ORDER BY recorded_at ASC`,
        [id, days],
      );

    const prices = rows.map((r) => parseFloat(r.price));
    const min = prices.length ? Math.min(...prices) : null;
    const max = prices.length ? Math.max(...prices) : null;
    const avg = prices.length
      ? prices.reduce((a, b) => a + b, 0) / prices.length
      : null;

    return {
      productId: id,
      days,
      min,
      max,
      avg: avg ? Math.round(avg * 100) / 100 : null,
      current: product.currentPrice ? parseFloat(String(product.currentPrice)) : null,
      history: rows.map((r) => ({
        price: parseFloat(r.price),
        recordedAt: r.recorded_at,
        inStock: r.in_stock,
      })),
    };
  }

  async trackByUrl(url: string) {
    const parsed = parseProductUrl(url);
    if (!parsed) {
      throw new BadRequestException(
        'Desteklenen mağaza linki değil. Trendyol, Hepsiburada, N11, MediaMarkt, Amazon TR veya Migros ürün linki yapıştır.',
      );
    }

    const { store, externalProductId, productUrl } = parsed;

    let product = await this.productsRepo.findOne({
      where: { store, externalProductId },
      relations: { category: true },
    });

    if (!product) {
      product = this.productsRepo.create({
        store,
        externalProductId,
        title: 'Yükleniyor...',
        productUrl,
        monitoringTier: 'P0',
        source: 'user_track',
        isFlash: false,
        nextCheckAt: new Date(),
      });
      await this.productsRepo.save(product);
    } else if (product.monitoringTier !== 'P0') {
      product.monitoringTier = 'P0';
      product.nextCheckAt = new Date();
      await this.productsRepo.save(product);
    }

    const deal = await this.dealsRepo.findOne({ where: { productId: product.id } });
    return this.formatProduct(product, deal ?? undefined);
  }

  private formatProduct(product: Product, deal?: Deal) {
    const current = product.currentPrice ? parseFloat(String(product.currentPrice)) : null;
    const original = product.originalPrice ? parseFloat(String(product.originalPrice)) : null;
    const store = product.store || 'trendyol';

    return {
      id: product.id,
      store,
      storeLabel: STORE_LABELS[store as keyof typeof STORE_LABELS] ?? store,
      externalProductId: product.externalProductId,
      title: product.title,
      brand: product.brand,
      category: product.category?.name ?? null,
      categorySlug: product.category?.slug ?? null,
      imageUrl: product.imageUrl,
      productUrl: product.productUrl,
      currentPrice: current,
      originalPrice: original,
      discountPct: deal?.discountPct ?? null,
      is6mLow: deal?.is6mLow ?? false,
      isFlash: product.isFlash,
      monitoringTier: product.monitoringTier,
    };
  }
}
