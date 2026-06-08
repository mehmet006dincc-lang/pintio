import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { OAuthDto } from './dto/oauth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private usersRepo: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.usersRepo.findOne({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Bu e-posta zaten kayıtlı');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = this.usersRepo.create({
      email: dto.email,
      name: dto.name,
      passwordHash,
    });
    await this.usersRepo.save(user);
    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDto) {
    const user = await this.usersRepo.findOne({ where: { email: dto.email } });
    if (!user?.passwordHash) throw new UnauthorizedException('Geçersiz e-posta veya şifre');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Geçersiz e-posta veya şifre');

    return this.buildAuthResponse(user);
  }

  async oauth(dto: OAuthDto) {
    let user: User | null = null;

    if (dto.provider === 'apple') {
      user = await this.usersRepo.findOne({ where: { appleId: dto.providerId } });
      if (!user) {
        user = this.usersRepo.create({
          appleId: dto.providerId,
          email: dto.email ?? null,
          name: dto.name,
        });
        await this.usersRepo.save(user);
      }
    } else if (dto.provider === 'google') {
      user = await this.usersRepo.findOne({ where: { googleId: dto.providerId } });
      if (!user) {
        user = this.usersRepo.create({
          googleId: dto.providerId,
          email: dto.email ?? null,
          name: dto.name,
        });
        await this.usersRepo.save(user);
      }
    }

    if (!user) throw new UnauthorizedException('OAuth başarısız');
    return this.buildAuthResponse(user);
  }

  private buildAuthResponse(user: User) {
    const payload = { sub: user.id, email: user.email };
    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }
}
