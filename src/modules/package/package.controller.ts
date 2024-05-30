import { Body, Controller, Delete, Get, Inject, Param, Post, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard';
import { ApiTags, ApiHeader, ApiBearerAuth } from '@nestjs/swagger';
import { RolesGuard } from '../authentication/guards/roles.guard';
import { PackageService } from './package.service';
import { I18nResponse } from 'src/core/helpers/i18n.helper';
import { ActionResponse } from 'src/core/base/responses/action.response';
import { CreatePackageRequest } from './dto/requests/create-package-request';
import { UpdatePackageRequest } from './dto/requests/update-package-request';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { Role } from 'src/infrastructure/data/enums/role.enum';
import { Roles } from '../authentication/guards/roles.decorator';
@ApiTags('Package')
@ApiHeader({
  name: 'Accept-Language',
  required: false,
  description: 'Language header: en, ar',
})
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.PHARMACY, Role.CLIENT)
@Controller('package')
export class PackageController {
  constructor(
    private packageService: PackageService,
    private readonly _i18nResponse: I18nResponse,
    @Inject(REQUEST) private request: Request,
  ) {}

  @Get()
  async getSubscriptionPackages() {
    return new ActionResponse(
      this._i18nResponse.entity(
        await this.packageService.getSubscriptionPackages(),this.request.user.roles
      ),
    );
  }
  @Post()
  async makePackage(@Body() request: CreatePackageRequest) {
    return new ActionResponse(
      await this.packageService.makePackage(request),
    );
  }

  @Put()
  async editPackage(@Body() request: UpdatePackageRequest) {
    return new ActionResponse(
      await this.packageService.editPackage(request),
    );
  }



  @Post("/subscription/:id")
  async makeSubscription(@Param('id') id: string) {
    return new ActionResponse(
      await this.packageService.makeSubscription(id),
    );
  }

  
  @Get("/subscription")
  async getCurrentSubscription() {
    return new ActionResponse(
      await this._i18nResponse.entity(
        await this.packageService.getCurrentSubscription(),   
      )
     
    );
  }
  @Delete("/:id")
  async deletePackage(@Param('id') id: string) {
    return new ActionResponse(
      await this.packageService.deletePackage(id),
    );
  }

  @Get("/:id")
  async getSingleSubscriptionPackages(@Param('id') id: string) {
    return new ActionResponse(
      this._i18nResponse.entity(
        await this.packageService.getSinglSubscriptionPackages(id),this.request.user.roles
      ),
    );
  }
}
