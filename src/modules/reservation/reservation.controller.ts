import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
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
import {
  applyQueryFilters,
  applyQueryIncludes,
  applyQuerySort,
} from 'src/core/helpers/service-related.helper';
import { AdditionalInfoService } from '../additional-info/additional-info.service';
import { OfferService } from './offer.service';
import { ReservationResponse } from './dto/response/reservation-respone';
import { plainToInstance } from 'class-transformer';
import { ReservationType } from 'src/infrastructure/data/enums/reservation-type';
import { request } from 'http';
import { compeleteReservationRequest } from './dto/requests/compelete-reservation-request';
import { OfferResponse } from './dto/response/offer-respone';
import { SechudedReservationRequest } from './dto/requests/scheduled-reservation-request';
import { Reservation } from 'src/infrastructure/entities/reservation/reservation.entity';
import { NotificationService } from '../notification/services/notification.service';
import { ReservationGateway } from 'src/integration/gateways/reservation.gateway';
import { CancelReservationRequest } from './dto/requests/cancel-reservation-request';
import { RateDoctorRequest } from './dto/requests/rate-doctor-request';

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
  constructor(
    private readonly reservationService: ReservationService,
    private readonly offerService: OfferService,
    private readonly additonalInfoService: AdditionalInfoService,
    @Inject(I18nResponse) private readonly _i18nResponse: I18nResponse,
    @Inject(NotificationService)
    public readonly notificationService: NotificationService,
    private readonly reservationGateway: ReservationGateway,
  ) {}

  @Get()
  async getReservations(@Query() query: PaginatedRequest) {
    applyQueryIncludes(query, 'doctor#user.clinic');
    applyQueryIncludes(query, 'address');
    applyQuerySort(query, 'created_at=desc');
    applyQueryIncludes(query, 'user.client_info');
    applyQueryIncludes(query, 'attachments');
    applyQueryIncludes(query, 'family_member');

    applyQueryIncludes(query, 'specialization');
    if (this.reservationService.currentUser.roles.includes(Role.CLIENT)) {
      applyQueryFilters(
        query,
        `user_id=${this.reservationService.currentUser.id}`,
      );
    }
    if (this.reservationService.currentUser.roles.includes(Role.DOCTOR)) {
      // applyQueryFilters(
      //   query,
      //   `nearby_doctors#%${(await this.additonalInfoService.getDoctor()).id}%`,
      // );
    }

    const reservations = this._i18nResponse.entity(
      await this.reservationService.findAll(query),
    );

    const reservationRespone = await Promise.all(
      reservations.map(async (e) => {
        if (this.reservationService.currentUser.roles.includes(Role.DOCTOR)) {
          const doctor_id = (await this.additonalInfoService.getDoctor()).id;
          const has_offer = await this.reservationService.hasOffer(
            e.id,
            doctor_id,
          );

          return new ReservationResponse({
            ...e,
            sent_offer: doctor_id == null ? false : has_offer,
          });
        }

        return new ReservationResponse({ ...e });
      }),
    );

    if (query.page && query.limit) {
      const total = await this.reservationService.count(query);
      return new PaginatedResponse(reservationRespone, {
        meta: { total, ...query },
      });
    } else {
      return new ActionResponse(reservationRespone);
    }
  }

  @Roles(Role.CLIENT)
  @Get('/:id')
  async findOne(@Param('id') id: string) {
    return new ActionResponse(
      this._i18nResponse.entity(
        new ReservationResponse(await this.reservationService.getResevation(id)),
      ),
    );
  }
  @Roles(Role.CLIENT)
  @Post('/rate')
  async rateReservation(@Body() request: RateDoctorRequest) {
    const reservation = await this.reservationService.rateDoctor(request);
    const data = this._i18nResponse.entity(reservation);
    return new ActionResponse(new ReservationResponse(data));
  }

  @Roles(Role.CLIENT)
  @Post('client-cancel')
  async cancelOrder(@Body() request: CancelReservationRequest) {
    return new ActionResponse(
      this._i18nResponse.entity(
        new ReservationResponse(
          await this.reservationService.cancelOrder(request),
        ),
      ),
    );
  }

  @Roles(Role.DOCTOR)
  @Post('doctor-cancel')
  async docCancelOrder(@Body() request: CancelReservationRequest) {
    return new ActionResponse(
      this._i18nResponse.entity(
        new ReservationResponse(
          await this.reservationService.doctorCancelOrder(request),
        ),
      ),
    );
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
  async makeOffer(@Param('id') id: string) {
    return new ActionResponse(await this.offerService.makeOffer(id));
  }

  @Roles(Role.CLIENT)
  @Get('urgent/:reservation/offer')
  async getOffers(@Param('reservation') reservation: string) {
    const offers = await this.offerService.getOffers(reservation);
    console.log(offers);
    const data = this._i18nResponse.entity(offers);
    console.log(data);
    return new ActionResponse(data.map((e) => new OfferResponse(e)));
  }

  @Roles(Role.CLIENT)
  @Post('urgent/offer-accept/:id')
  async acceptOffer(@Param('id') id: string) {
    const reservation = await this.reservationService.acceptOffer(id);

    const data = this._i18nResponse.entity(reservation);
    const full_reservation = this._i18nResponse.entity(
      new ReservationResponse(
        await this.reservationService.findOne(reservation.id),
      ),
    );
    console.log(full_reservation);
    this.reservationGateway.server.emit(
      `urgent-reservation-${reservation.doctor_id}`,
      full_reservation,
    );
    return new ActionResponse(
      new ReservationResponse(
        await this.reservationService.getResevation(data.id),
      ),
    );
  }

  @Roles(Role.DOCTOR)
  @Post('/complete')
  async completeReservation(@Body() request: compeleteReservationRequest) {
    const reservation = await this.reservationService.compeleteReservation(
      request,
    );

    const data = this._i18nResponse.entity(reservation);

    return new ActionResponse(
      new ReservationResponse(
        await this.reservationService.getResevation(data.id),
      ),
    );
  }

  @Roles(Role.DOCTOR)
  @Post('/start/:id')
  async startReservation(@Param('id') id: string) {
    const reservation = await this.reservationService.startReservation(id);

    const data = this._i18nResponse.entity(reservation);

    return new ActionResponse(
      new ReservationResponse(
        await this.reservationService.getResevation(data.id),
      ),
    );
  }
  @Roles(Role.CLIENT)
  @Post('/scheduled')
  async secheduledReservation(@Body() request: SechudedReservationRequest) {
    const reservation = await this.reservationService.scheduledReservation(
      request,
    );
    const data = this._i18nResponse.entity(reservation);
    return new ActionResponse(new ReservationResponse(data));
  }
}
