import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { User } from '../entities/user.entity';

@Controller('api/users')
@UseGuards(AuthGuard('jwt'))
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  getProfile(@Req() req: { user: User }) {
    return this.usersService.getProfile(req.user.id);
  }

  @Patch('me')
  updateProfile(
    @Req() req: { user: User },
    @Body() body: { name?: string; interests?: string[] },
  ) {
    return this.usersService.updateProfile(req.user.id, body);
  }

  @Patch('push-token')
  updatePushToken(@Req() req: { user: User }, @Body('token') token: string) {
    return this.usersService.updatePushToken(req.user.id, token);
  }

  @Patch('notification-settings')
  updateNotificationSettings(
    @Req() req: { user: User },
    @Body() settings: Record<string, boolean>,
  ) {
    return this.usersService.updateNotificationSettings(req.user.id, settings);
  }

  @Delete('me')
  deleteAccount(@Req() req: { user: User }) {
    return this.usersService.deleteAccount(req.user.id);
  }
}
