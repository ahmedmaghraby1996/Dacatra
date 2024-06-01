import { Body, Controller, Get, Put, Query, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { SettingsTypes } from 'src/infrastructure/data/enums/settings.enum';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from '../authentication/guards/roles.guard';
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard';
import { Role } from 'src/infrastructure/data/enums/role.enum';
import { Roles } from '../authentication/guards/roles.decorator';
import { ActionResponse } from 'src/core/base/responses/action.response';
import { EditSettingsRequest } from './dto/edit-settings.request';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard,RolesGuard)
@Roles(Role.ADMIN)
@ApiTags('Settings')
@Controller('settings')
export class SettingsController {
    constructor(private readonly settingsService: SettingsService) {

     }


     @Get()
    async getAppSettings(@Query('type') type: SettingsTypes) {
        return new ActionResponse( await this.settingsService.getAppSettings(type));
    }
    @Put()
    async editSettings(@Body() data: EditSettingsRequest) {
        return new ActionResponse( await this.settingsService.editSettings(data));
}
}