import { Controller, Get } from '@nestjs/common';
import { BannersService } from './banners.service';

@Controller('api/banners')
export class BannersController {
  constructor(private bannersService: BannersService) {}

  @Get()
  findActive() {
    return this.bannersService.findActive();
  }
}
