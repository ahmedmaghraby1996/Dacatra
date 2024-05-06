import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { Role } from 'src/infrastructure/data/enums/role.enum';

export class SendToUsersNotificationRequest {
  @ApiProperty()
  @IsNotEmpty()
  @IsArray()
  users_id: string[];

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  message_ar: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  message_en: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  title_ar: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  title_en: string;
}

export class SendToAllUsersNotificationRequest {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  message_ar: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  message_en: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  title_ar: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  title_en: string;

  @ApiProperty({
    enum: [Role.ADMIN, Role.CLIENT, Role.DOCTOR, Role.PHARMACY, Role.NURSE],
  })
  @IsNotEmpty()
  @IsEnum(Role)
  role: Role;
}