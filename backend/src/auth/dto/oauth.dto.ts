import { IsEmail, IsIn, IsOptional, IsString } from 'class-validator';

export class OAuthDto {
  @IsIn(['apple', 'google'])
  provider: 'apple' | 'google';

  @IsString()
  providerId: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}
