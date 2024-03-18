import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { RegisterRequest } from 'src/modules/authentication/dto/requests/register.dto';

export class UpdatePharamcyRequest  {

 
    
    @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  ph_name: string;

  @ApiPropertyOptional()
  @IsLatitude()
  @IsNotEmpty()
  @IsOptional()
  latitude: number;
  @ApiPropertyOptional()
  @IsLongitude()
  @IsNotEmpty()
  @IsOptional()
  longitude: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  address: string;
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  open_time: string;
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  close_time: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  summery: string;

  @ApiPropertyOptional({required:false})
 @IsNumber()
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  expierence: number;

  @ApiPropertyOptional({
    type: [String],
    required: false,
    example: 'storage/tmp/image1.png', 
  })

  license_images: string;

  @ApiPropertyOptional({
    type: [String],
    required: false,
    example: 'storage/tmp/image1.png',
  })

  logo_images: string;

  @ApiPropertyOptional({
    type: [String],
    required: false,
    example: ['category1_id', 'category1_id'],
  })
  @IsOptional()
  categories: string;


}
