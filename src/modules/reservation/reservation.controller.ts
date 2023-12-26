import { Body, Controller, Get, Inject, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { Role } from 'src/infrastructure/data/enums/role.enum';
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard';
import { Roles } from '../authentication/guards/roles.decorator';
import { RolesGuard } from '../authentication/guards/roles.guard';
import { ReservationService } from './reservation.service';
import { urgentReservationRequest } from './dto/requests/urgent_reservation_request';
import { ActionResponse } from 'src/core/base/responses/action.response';
import { PaginatedRequest } from 'src/core/base/requests/paginated.request';
import { PaginatedResponse } from 'src/core/base/responses/paginated.response';
import { I18nResponse } from 'src/core/helpers/i18n.helper';
import { applyQueryFilters, applyQueryIncludes } from 'src/core/helpers/service-related.helper';
import { AdditionalInfoService } from '../additional-info/additional-info.service';
import { OfferService } from './offer.service';
import { ReservationResponse } from './dto/requests/response/reservation-respone';
import { plainToInstance } from 'class-transformer';

@ApiTags('reservation')
@ApiHeader({
  name: 'Accept-Language',
  required: false,
  description: 'Language header: en, ar',
})
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Controller('reservation')
export class ReservationController {
  constructor(private readonly reservationService: ReservationService,private readonly offerService: OfferService, private readonly additonalInfoService:AdditionalInfoService,  @Inject(I18nResponse) private readonly _i18nResponse: I18nResponse,) {}

  @Get()
  async getReservations(@Query() query: PaginatedRequest) {
if(this.reservationService.currentUser.roles.includes(Role.CLIENT)){
  applyQueryFilters(query, `user_id=${this.reservationService.currentUser.id}`);
}
if(this.reservationService.currentUser.roles.includes(Role.DOCTOR)){
console.log((await this.additonalInfoService.getDoctor()).id)
  applyQueryFilters(query, `nearby_doctors#%${ ( (await this.additonalInfoService.getDoctor()).id)}%`);
  applyQueryIncludes(query, 'doctor');
  applyQueryIncludes(query, 'attachments');
  applyQueryIncludes(query, 'family_member');
  applyQueryIncludes(query, 'doctor.user');
  applyQueryIncludes(query, 'specialization');
}

  
    const reservations =  this._i18nResponse.entity ( await this.reservationService.findAll(query));
    const reservationRespone= reservations.map((e)=>new ReservationResponse(e))

    if (query.page && query.limit) {
      const total = await this.reservationService.count();
      return new PaginatedResponse(reservationRespone, { meta: { total, ...query } });
    } else {
      return new ActionResponse(reservationRespone);
    }
  }

  @Roles(Role.CLIENT)
  @Post('urgent')
  async urgentReservation(@Body() request: urgentReservationRequest) {
    return new ActionResponse(
      await this.reservationService.urgentReservation(request),
    );
  }


  @Roles(Role.DOCTOR)
  @Post('urgent/offer/:id')
  async makeOffer(@Param("id") id: string) {
    return await this.offerService.makeOffer(id);
  }

}