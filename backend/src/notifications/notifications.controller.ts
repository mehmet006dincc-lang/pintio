import { Controller, Get, Patch, Param, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NotificationsService } from './notifications.service';
import { User } from '../entities/user.entity';

@Controller('api/notifications')
@UseGuards(AuthGuard('jwt'))
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  findAll(@Req() req: { user: User }) {
    return this.notificationsService.findAll(req.user.id);
  }

  @Get('unread-count')
  unreadCount(@Req() req: { user: User }) {
    return this.notificationsService.unreadCount(req.user.id);
  }

  @Patch('read-all')
  markAllRead(@Req() req: { user: User }) {
    return this.notificationsService.markAllRead(req.user.id);
  }

  @Patch(':id/read')
  markRead(@Req() req: { user: User }, @Param('id') id: string) {
    return this.notificationsService.markRead(req.user.id, id);
  }
}
