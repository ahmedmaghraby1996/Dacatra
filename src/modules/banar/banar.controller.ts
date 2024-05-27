import {
    Body,
    ClassSerializerInterceptor,
    Controller, Delete, Get, Param, Patch, Post, UploadedFile, UseGuards, UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiHeader, ApiTags } from '@nestjs/swagger';
import { BanarService } from './banar.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadValidator } from 'src/core/validators/upload.validator';
import { CreateBanarRequest } from './dto/request/create-banar.request';
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard';
import { RolesGuard } from '../authentication/guards/roles.guard';
import { Roles } from '../authentication/guards/roles.decorator';
import { Role } from 'src/infrastructure/data/enums/role.enum';
import { ActionResponse } from 'src/core/base/responses/action.response';
import { Banar } from 'src/infrastructure/entities/banar/banar.entity';
import { plainToInstance } from 'class-transformer';
import { BannerResponse } from './dto/response/banner.response';
import { UpdateBannerRequest } from './dto/request/update-banner.request';

@ApiBearerAuth()
@ApiHeader({
    name: 'Accept-Language',
    required: false,
    description: 'Language header: en, ar',
})
@ApiTags('Banar')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('banar')
export class BanarController {
    constructor(
        private readonly banarService: BanarService,
    ) { }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @UseInterceptors(ClassSerializerInterceptor, FileInterceptor('banar'))
    @ApiConsumes('multipart/form-data')
    async createBanar(
        @Body() req: CreateBanarRequest,
        @UploadedFile(new UploadValidator().build())
        banar: Express.Multer.File,
    ): Promise<ActionResponse<BannerResponse>> {
        req.banar = banar;
        const banner = await this.banarService.createBanar(req);
        const result = plainToInstance(BannerResponse, banner, { excludeExtraneousValues: true })
        return new ActionResponse<BannerResponse>(result);
    }

    @Get()
    // @Roles(Role.CLIENT)
    async getBanars(): Promise<ActionResponse<BannerResponse[]>> {
        const banners = await this.banarService.getBanars();
        const result = plainToInstance(BannerResponse, banners, { excludeExtraneousValues: true })
        return new ActionResponse<BannerResponse[]>(result);
    }

    @Get(":id")
    // @Roles(Role.CLIENT)
    async getBanar(@Param('id') id: string): Promise<ActionResponse<BannerResponse>> {
        const banar = await this.banarService.findOne(id);
        return new ActionResponse<BannerResponse>(plainToInstance(BannerResponse, banar, ));
    }

    @Patch(":id")
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @UseInterceptors(ClassSerializerInterceptor, FileInterceptor('banar'))
    @ApiConsumes('multipart/form-data')
    async updateBanar(
        @Param('id') id: string,
        @Body() req: UpdateBannerRequest,
        @UploadedFile(new UploadValidator().build())
        banar: Express.Multer.File,
    ): Promise<ActionResponse<BannerResponse>> {
        if(banar) req.banar = banar;
        const banner = await this.banarService.updateBanar(id, req);
        const result = plainToInstance(BannerResponse, banner, { excludeExtraneousValues: true })
        return new ActionResponse<BannerResponse>(result);
    }

    @Delete(":id")
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    async deleteBanar(
        @Param('id') id: string,
    ): Promise<ActionResponse<BannerResponse>> {
        const banner = await this.banarService.deleteBanar(id);
        const result = plainToInstance(BannerResponse, banner, { excludeExtraneousValues: true })
        return new ActionResponse<BannerResponse>(result);
    }
}
