import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification) private notificationsRepo: Repository<Notification>,
  ) {}

  findAll(userId: string, limit = 50) {
    return this.notificationsRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async markRead(userId: string, id: string) {
    await this.notificationsRepo.update({ id, userId }, { isRead: true });
    return { success: true };
  }

  async markAllRead(userId: string) {
    await this.notificationsRepo.update({ userId, isRead: false }, { isRead: true });
    return { success: true };
  }

  unreadCount(userId: string) {
    return this.notificationsRepo.count({ where: { userId, isRead: false } });
  }
}
