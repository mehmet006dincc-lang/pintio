import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private usersRepo: Repository<User>,
  ) {}

  async getProfile(userId: string) {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException();
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      interests: user.interests,
      notificationSettings: user.notificationSettings,
      hasPushToken: !!user.pushToken,
    };
  }

  async updateProfile(userId: string, data: Partial<{ name: string; interests: string[] }>) {
    await this.usersRepo.update(userId, data);
    return this.getProfile(userId);
  }

  async updatePushToken(userId: string, pushToken: string) {
    await this.usersRepo.update(userId, { pushToken });
    return { success: true };
  }

  async updateNotificationSettings(
    userId: string,
    settings: Record<string, boolean>,
  ) {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException();
    user.notificationSettings = { ...user.notificationSettings, ...settings };
    await this.usersRepo.save(user);
    return user.notificationSettings;
  }

  async deleteAccount(userId: string) {
    await this.usersRepo.delete(userId);
    return { success: true };
  }
}
