import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsNumber, IsOptional, IsString } from "class-validator";
import { Column } from "typeorm";

export class UpdatePackageRequest {

    @ApiProperty()
    @IsString()
    id: string;
    @ApiProperty({required:false})
    @IsString()
    @IsOptional()
    name_ar: string;
    @ApiProperty({required:false})
    @IsOptional()
    @IsString()
    name_en: string;
    @ApiProperty({required:false})
    @IsOptional()
    @IsNumber()
    @Transform(({ value }) => Number(value))
    
    price: number;
    @ApiProperty({required:false})
    @IsOptional()
    @IsNumber()
    @Transform(({ value }) => Number(value))
    expiration_days: number;
    @ApiProperty({required:false})
    @IsOptional()
    @IsString()
    description_ar: string;
    @ApiProperty({required:false})
    @IsNumber()
    @IsOptional()
    @Transform(({ value }) => Number(value))
    number_of_pharmacy_order: number;

   
}