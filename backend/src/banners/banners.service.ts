import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Banner } from '../entities/banner.entity';

@Injectable()
export class BannersService {
  constructor(
    @InjectRepository(Banner) private bannersRepo: Repository<Banner>,
  ) {}

  findActive() {
    return this.bannersRepo
      .createQueryBuilder('b')
      .where('b.is_active = true')
      .andWhere('(b.active_from IS NULL OR b.active_from <= NOW())')
      .andWhere('(b.active_to IS NULL OR b.active_to >= NOW())')
      .orderBy('b.sort_order', 'ASC')
      .getMany();
  }
}
