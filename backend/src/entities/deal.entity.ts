import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Product } from './product.entity';

@Entity('deals')
export class Deal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'product_id', unique: true })
  productId: string;

  @OneToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ name: 'discount_pct' })
  discountPct: number;

  @Column({ name: 'is_6m_low', default: false })
  is6mLow: boolean;

  @Column({ name: 'avg_180d', type: 'decimal', precision: 12, scale: 2, nullable: true })
  avg180d: number | null;

  @Column({ name: 'min_180d', type: 'decimal', precision: 12, scale: 2, nullable: true })
  min180d: number | null;

  @Column({ name: 'detected_at', type: 'timestamptz' })
  detectedAt: Date;

  @Column({ name: 'notified_at', type: 'timestamptz', nullable: true })
  notifiedAt: Date | null;
}
