import { Controller, Get, Inject, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiHeader, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard';
import { RolesGuard } from '../authentication/guards/roles.guard';
import { PromoCodeService } from './promo-code.service';
import { ActionResponse } from 'src/core/base/responses/action.response';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { applyQueryFilters } from 'src/core/helpers/service-related.helper';
import { PaginatedRequest } from 'src/core/base/requests/paginated.request';
@ApiTags('Promo-code')
@ApiHeader({
  name: 'Accept-Language',
  required: false,
  description: 'Language header: en, ar',
})
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Controller('promo-code')
export class PromoCodeController {
    constructor(private readonly promoCodeService: PromoCodeService,
        @Inject(REQUEST) private readonly request: Request) { }


    @Get()
    async getPromoCode(@Query() query: PaginatedRequest) {
        applyQueryFilters(query, `user_id=${this.request.user.id}`);
        applyQueryFilters(query, `number_of_uses>0`);
        applyQueryFilters(query, `expire_at>${new Date().toISOString().split('T')[0]}`);
        return new ActionResponse(await this.promoCodeService.findAll(query));
    }
}
