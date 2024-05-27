import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsDateString, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateBanarRequest {
    @ApiProperty({ type: 'file', required: true })
    banar: Express.Multer.File;

    @ApiProperty({  nullable: true, required: false, })
    @IsNotEmpty()
    @IsOptional()
    started_at: Date;

    @ApiProperty({  nullable: true, required: false, })
    @IsNotEmpty()
    @IsOptional()
    ended_at: Date;

    @ApiProperty({  nullable: true, required: false,  })
    @IsOptional()
    @IsString()
    description: string;

    @ApiProperty({  nullable: true, required: false,  })
    @IsOptional()
    @IsUUID()
    doctor_id: string;



    @ApiProperty({ nullable: true, required: false, default: true })
    @IsOptional()
    @Transform((value) => Boolean(value))
    @IsBoolean()
    is_active: boolean;
}
