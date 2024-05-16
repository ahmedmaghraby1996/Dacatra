import { ApiProperty } from "@nestjs/swagger";

export class addSpecilizationRequest{

    @ApiProperty()
    name_ar:string

    @ApiProperty()
    name_en:string
}