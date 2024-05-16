import { ApiProperty } from "@nestjs/swagger"
import { IsOptional, IsString } from "class-validator"
import { required } from "joi"

export class EditSpecilizationRequest{
    @ApiProperty()
    id:string

    @ApiProperty({required:false})
    @IsOptional()
    @IsString()
    name_ar:string

    @ApiProperty({required:false})
    @IsOptional()
    @IsString()
    name_en:string
}