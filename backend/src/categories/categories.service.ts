import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Category } from '../entities/category.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category) private categoriesRepo: Repository<Category>,
    private dataSource: DataSource,
  ) {}

  async findAll() {
    const categories = await this.categoriesRepo.find({ order: { sortOrder: 'ASC' } });
    const counts: Array<{ id: number; count: string }> = await this.dataSource.query(
      `SELECT c.id, COUNT(d.id)::int AS count
       FROM categories c
       LEFT JOIN products p ON p.category_id = c.id AND p.is_active = true
       INNER JOIN deals d ON d.product_id = p.id
       GROUP BY c.id`,
    );
    const countMap = Object.fromEntries(counts.map((r) => [r.id, parseInt(r.count, 10)]));

    return categories.map((c) => ({
      ...c,
      productCount: countMap[c.id] ?? 0,
    }));
  }
}
