import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString, MIN, Min, MinLength } from 'class-validator';
import { toRightNumber } from 'src/core/helpers/cast.helper';

export class FindDrugQuery {
  @ApiProperty({ required: false })
  category_id: string;

  @ApiProperty({ required: false,})
  @IsString()
 @IsOptional()
  name: string;

  @ApiProperty({ required: false,minimum:1 })

  @IsOptional()
  @Transform(({ value }) => toRightNumber(value, { min: 1 }))

  page:number

  @ApiProperty({ required: false ,minimum:1})

  @IsOptional()
  @Transform(({ value }) => toRightNumber(value, { min: 1 }))
  
  limit:number

}
