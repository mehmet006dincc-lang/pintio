import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Category } from './category.entity';

@Entity('products')
@Index(['store', 'externalProductId'], { unique: true })
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, default: 'trendyol' })
  store: string;

  @Column({ name: 'external_product_id', type: 'varchar', length: 64 })
  externalProductId: string;

  @Column({ type: 'text' })
  title: string;

  @Column({ type: 'varchar', nullable: true })
  brand: string | null;

  @Column({ name: 'category_id', type: 'int', nullable: true })
  categoryId: number | null;

  @ManyToOne(() => Category, { nullable: true })
  @JoinColumn({ name: 'category_id' })
  category: Category | null;

  @Column({ name: 'image_url', type: 'text', nullable: true })
  imageUrl: string | null;

  @Column({ name: 'product_url', type: 'text' })
  productUrl: string;

  @Column({ name: 'current_price', type: 'decimal', precision: 12, scale: 2, nullable: true })
  currentPrice: number | null;

  @Column({ name: 'original_price', type: 'decimal', precision: 12, scale: 2, nullable: true })
  originalPrice: number | null;

  @Column({ name: 'monitoring_tier', type: 'varchar', default: 'P1' })
  monitoringTier: string;

  @Column({ type: 'varchar', default: 'flash_deals' })
  source: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'is_flash', default: true })
  isFlash: boolean;

  @Column({ name: 'discovered_at', type: 'timestamptz', nullable: true })
  discoveredAt: Date | null;

  @Column({ name: 'last_checked_at', type: 'timestamptz', nullable: true })
  lastCheckedAt: Date | null;

  @Column({ name: 'next_check_at', type: 'timestamptz', nullable: true })
  nextCheckAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
