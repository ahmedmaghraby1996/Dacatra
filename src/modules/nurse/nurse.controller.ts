import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { NurseOrderService, NurseService } from './nurse.service';
import { NurseOrderRequest } from './dto/request/nurse-order-request';

import { ActionResponse } from 'src/core/base/responses/action.response';

import { PaginatedRequest } from 'src/core/base/requests/paginated.request';
import { PaginatedResponse } from 'src/core/base/responses/paginated.response';
import { ApiTags, ApiHeader, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard';
import { RolesGuard } from '../authentication/guards/roles.guard';
import {
  applyQueryIncludes,
  applyQuerySort,
} from 'src/core/helpers/service-related.helper';
import { User } from 'src/infrastructure/entities/user/user.entity';
import { plainToInstance } from 'class-transformer';
import { NurseOrderResponse } from './dto/respone/nurse-order.response';
import { NurseOfferRequest } from './dto/request/nurse-offer-request';
import { NurseOfferResponse } from './dto/respone/nurse-offer.response';
import { UpdateNurseRequest } from './dto/request/update-nurse-request';
import { request } from 'http';
import { RateDoctorRequest } from '../reservation/dto/requests/rate-doctor-request';
import { CancelReservationRequest } from '../reservation/dto/requests/cancel-reservation-request';
import { NurseResponse } from './dto/respone/nurse.response';
import { toUrl } from 'src/core/helpers/file.helper';

@ApiTags('Nusre')
@ApiHeader({
  name: 'Accept-Language',
  required: false,
  description: 'Language header: en, ar',
})
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Controller('nurse')
export class NurseController {
  constructor(
    @Inject(NurseOrderService)
    private readonly nurseOrderService: NurseOrderService,
    @Inject(NurseService) private readonly nurseService: NurseService,
  ) {}

  @Post('accept/:user_id')
  async acceptNurse(@Param('user_id') user_id: string) {
    return await this.nurseService.acceptNurse(user_id);
  }

  @Get()
  async getNurse(@Query() query: PaginatedRequest) {
    applyQueryIncludes(query, 'user');

    const nurses = await this.nurseService.findAll(query);

    const result = nurses.map((nurse) => {
      return new NurseResponse({
        id: nurse.id,
        rating:
          nurse.number_of_reviews == 0
            ? 0
            : nurse.rating / nurse.number_of_reviews,
        name: nurse.user.first_name + ' ' + nurse.user.last_name,
        avatar: nurse.user.avatar,
        phone: nurse.user.phone,
        user_id:nurse.user.id,
        is_verified:nurse.is_verified,
      });
    });

    if (query.limit && query.page) {
      const count = await this.nurseService.count(query);
      return new PaginatedResponse(result, {
        meta: { total: count, ...query },
      });
    } else return new ActionResponse(result);
  }

  @Post('order')
  async createNurseorder(@Body() request: NurseOrderRequest) {
    return new ActionResponse(
      await this.nurseOrderService.createNurseOrder(request),
    );
  }

  @Post('order/offer')
  async createNurseOffer(@Body() request: NurseOfferRequest) {
    return new ActionResponse(await this.nurseOrderService.sendOffer(request));
  }

  @Get('order/:id/offers')
  async getNurseOffer(@Param('id') id: string) {
    return new ActionResponse(
      plainToInstance(
        NurseOfferResponse,
        await this.nurseOrderService.getOffers(id),
      ),
    );
  }
  @Post('order/rate')
  async rateNurse(@Body() request: RateDoctorRequest) {
    return new ActionResponse(
      plainToInstance(
        NurseOrderResponse,
        await this.nurseOrderService.clientRating(request),
      ),
    );
  }

  @Get('order')
  async getNurseOrder(@Query() query: PaginatedRequest) {
    applyQueryIncludes(query, 'user');
    applyQuerySort(query, 'created_at=desc');
    applyQueryIncludes(query, 'address');
    applyQueryIncludes(query, 'nurse');
    applyQueryIncludes(query, 'nurse.user');
    const nurse = await this.nurseOrderService.getNurse(
      this.nurseOrderService.currentUser.id,
    );
    if(nurse?.is_verified==false)
      return new ActionResponse([])
    const orders = await this.nurseOrderService.findAll(query);
    const order_response = await Promise.all(
      orders.map(async (order) => {
        return plainToInstance(NurseOrderResponse, {
          ...order,
          sent_offer: await this.nurseOrderService.sentOffer(
            order.id,

            nurse === null ? null : nurse.id,
          ),
        });
      }),
    );
    if (query.page && query.limit) {
      const total = await this.nurseOrderService.count(query);
      return new PaginatedResponse(order_response, {
        meta: { total, ...query },
      });
    } else return new ActionResponse(order_response);
  }

  @Post('accept/offer/:id')
  async acceptOffer(@Param('id') id: string) {
    return new ActionResponse(
      plainToInstance(
        NurseOrderResponse,
        await this.nurseOrderService.acceptOffer(id),
      ),
    );
  }

  @Post('cancel/order')
  async cancelOrder(@Body() request: CancelReservationRequest) {
    return new ActionResponse(
      plainToInstance(
        NurseOrderResponse,
        await this.nurseOrderService.nurseCancel(request),
      ),
    );
  }
  @Get(':id')
  async getNurseById(@Param('id') id: string) {
    const nurse = await this.nurseService.nurseRepo.findOne({where: {id: id},relations: ['user','license_images']});

    const result = new NurseResponse({
      id: nurse.id,
      rating:
        nurse.number_of_reviews == 0
          ? 0
          : nurse.rating / nurse.number_of_reviews,
      name: nurse.user.first_name + ' ' + nurse.user.last_name,
      avatar: nurse.user.avatar,
      phone: nurse.user.phone,
      summery: nurse.summary,
      experience: nurse.experience,
      user_id:nurse.user.id,
      is_verified:nurse.is_verified,
      license_images: nurse.license_images.map((image) => {
        image.image=toUrl(image.image);
        return image;
      })

      
    });

    return new ActionResponse(result);
  }
}
