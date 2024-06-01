import { ApiProperty } from "@nestjs/swagger"
import { IsEnum, IsNumber } from "class-validator"
import { SettingsTypes } from "src/infrastructure/data/enums/settings.enum"

export class EditSettingsRequest {
    @ApiProperty({enum: SettingsTypes})
    @IsEnum(SettingsTypes)
    
    type: SettingsTypes
    @ApiProperty()
    @IsNumber()
    value: number
}