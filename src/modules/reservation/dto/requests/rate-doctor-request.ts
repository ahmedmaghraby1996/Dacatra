import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class RateDoctorRequest {
  @ApiProperty()
  @IsNumber()
  @Min(0)
  @Max(5)
  rate: number;
  @ApiPropertyOptional()
  @IsString()
  
@IsOptional()
  comment: string;
  @ApiProperty()
  @IsString()
  order_id: string;
}
