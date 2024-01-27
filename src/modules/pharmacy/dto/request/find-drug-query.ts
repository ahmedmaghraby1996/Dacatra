import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MIN, MinLength } from "class-validator";

export class FindDrugQuery {

@ApiProperty ()
@IsString()
@IsNotEmpty()
category_id:string

@ApiProperty ()
@IsString()
@MinLength(3)
@IsNotEmpty()
name:string




}