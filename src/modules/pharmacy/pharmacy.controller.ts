import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { ActionResponse } from 'src/core/base/responses/action.response';
import { PharmacyService } from './pharmacy.service';
import { I18nResponse } from 'src/core/helpers/i18n.helper';
import { query } from 'express';
import { FindDrugQuery } from './dto/request/find-drug-query';
import { makeOrderRequest } from './dto/request/make-order-request';
import { Roles } from '../authentication/guards/roles.decorator';
import { Role } from 'src/infrastructure/data/enums/role.enum';
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard';
import { RolesGuard } from '../authentication/guards/roles.guard';
import { PhOrderReplyRequest } from './dto/request/ph-order-replay-request';
import { PaginatedRequest } from 'src/core/base/requests/paginated.request';
import { PaginatedResponse } from 'src/core/base/responses/paginated.response';
import { plainToInstance } from 'class-transformer';
import { PhReply } from 'src/infrastructure/entities/pharmacy/ph-reply.entity';
import { PhOrderResponse } from './dto/respone/ph-order-response';
import { PhReplyResponse } from './dto/respone/ph-reply-response';
import { UpdatePharamcyRequest } from './dto/request/update-pharmact-request';
import { PharmacyResponse } from './dto/respone/pharmacy.reposne';
import { applyQueryIncludes } from 'src/core/helpers/service-related.helper';
import { CreateDrugRequest } from './dto/request/create-drug-request';
import { addSpecilizationRequest } from '../additional-info/dto/requests/add-specilization.request';

@ApiHeader({
  name: 'Accept-Language',
  required: false,
  description: 'Language header: en, ar',
})
@ApiTags('Pharmacy')
@Controller('pharmacy')
export class PharmacyController {
  constructor(
    private readonly pharmacyService: PharmacyService,
    @Inject(I18nResponse) private readonly _i18nResponse: I18nResponse,
  ) {}

  @Post('accept/:user_id')
  async acceptPharmacy(@Param('user_id') user_id: string) {
    return await this.pharmacyService.acceptPharmacy(user_id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Get()
  async getPharamcy(@Query() query: PaginatedRequest) {
    applyQueryIncludes(query, 'attachments');
    const pharmacies = await this.pharmacyService.findAll(query);
    await Promise.all(
      pharmacies.map(async (pharmacy) => {
        pharmacy.categories =
          (await this.pharmacyService.drugCategoryRepository.findByIds(
            pharmacy.categories,
          )) as unknown as string[];
      }),
    );
    const result = plainToInstance(
      PharmacyResponse,
      this._i18nResponse.entity(pharmacies),
    );
    if (query.page && query.limit) {
      const total = await this.pharmacyService.count(query);
      return new PaginatedResponse(result, {
        meta: { total: total, ...query },
      });
    } else {
      return new ActionResponse(result);
    }
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Post('/drugs')
  async addDrug(@Body() request: CreateDrugRequest) {
    return new ActionResponse(await this.pharmacyService.addDrug(request));
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Put('/drugs/:id')
  async editDrug(@Param('id') id:string, @Body() request: CreateDrugRequest) {
    return new ActionResponse(await this.pharmacyService.editDrug(id,(request)));
  }
  @Get('/drugs')
  async getDrugs(@Query() query: FindDrugQuery) {
    const drugs = await this.pharmacyService.getDrugs(query);
    return new PaginatedResponse(drugs[0], {
      meta: { total: drugs[1], ...query },
    });
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Delete('/drugs/:id')
  async deletDrug(@Param('id') id:string) {
    return new ActionResponse(await this.pharmacyService.deleteDrug(id));
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(Role.CLIENT)
  @Post('/order')
  async makeOrder(@Body() request: makeOrderRequest) {
    return new ActionResponse(await this.pharmacyService.makeOrder(request));
  }

  @Get('/categories')
  async getDrugCategories() {
    return new ActionResponse(
      this._i18nResponse.entity(await this.pharmacyService.getDrugCategories()),
    );
  }
  @Post('/categories')
  async CreateDrugCategory(@Body() request: addSpecilizationRequest) {
    return new ActionResponse(
      this._i18nResponse.entity(await this.pharmacyService.createCategories(request)),
    );
  }
  @Put('/categories/:id')
  async editDrugCategories(@Param('id') id: string,@Body() request: addSpecilizationRequest) {
    return new ActionResponse(
      this._i18nResponse.entity(await this.pharmacyService.editCategories(id,request)),
    );
  }
  @Delete('/categories/:id')
  async deleteDrugCategories(@Param('id') id: string) {
    return new ActionResponse(
      this._i18nResponse.entity(await this.pharmacyService.deleteCategories(id)),
    );
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Get('/order')
  async getOrders(@Query() query: PaginatedRequest) {
    const orders = await this.pharmacyService.getOrders(query);
    const result = this._i18nResponse.entity(orders.orders);
    return new PaginatedResponse(result, {
      meta: { total: orders.count, ...query },
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(Role.PHARMACY)
  @Post('update-info')
  async updatePharmacy(@Body() request: UpdatePharamcyRequest) {
    return new ActionResponse(
      await this.pharmacyService.addPharmacyInfo(
        request,
        this.pharmacyService.currentUser.id,
      ),
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Get('/order/:id')
  async getSingleOrder(@Param('id') id: string) {
    const order = await this.pharmacyService.getSingle(id);
    const result = this._i18nResponse.entity(order);
    return new ActionResponse(result);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Get('/order/:id/replies')
  async getOrderReplies(@Param('id') id: string) {
    const replies = await this.pharmacyService.getReplies(id);
    const result = plainToInstance(PhReplyResponse, replies);
    return new ActionResponse(result);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(Role.PHARMACY)
  @Post('/order/reply')
  async orderReply(@Body() request: PhOrderReplyRequest) {
    return new ActionResponse(await this.pharmacyService.orderReply(request));
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Get('/:id')
  async getPharamcyByid(@Param('id') id: string) {
    const pharmacy = await this.pharmacyService.pharmacyRepository.findOne({
      where: { id },
      relations: ['attachments'],
    });
    await Promise.all(
      (pharmacy.categories =
        (await this.pharmacyService.drugCategoryRepository.findByIds(
          pharmacy.categories,
        )) as unknown as string[]),
    );

    const result = plainToInstance(
      PharmacyResponse,
      this._i18nResponse.entity(pharmacy),
    );

    return new ActionResponse(result);
  }
}
