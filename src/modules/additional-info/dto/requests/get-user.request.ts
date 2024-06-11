import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';
import { IsAdmin } from 'src/core/validators/is-admin.validator';

export class GetUserRequest {
  @ApiProperty({ required: false })
  @IsNotEmpty()
  @IsOptional()
  @IsAdmin({ message: 'User must be an admin to get user' })
  id: string;
}
