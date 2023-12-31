import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseService } from 'src/core/base/service/service.base';
import { Offer } from 'src/infrastructure/entities/reservation/offers.entity';
import { Repository } from 'typeorm';
import { AdditionalInfoService } from '../additional-info/additional-info.service';
import { ReservationService } from './reservation.service';
import { ReservationType } from 'src/infrastructure/data/enums/reservation-type';
import { ReservationStatus } from 'src/infrastructure/data/enums/reservation-status.eum';

@Injectable()
export class OfferService extends BaseService<Offer> {
  constructor(
    @InjectRepository(Offer) private readonly repository: Repository<Offer>,
    private readonly reservationService: ReservationService,
    private readonly additonalService: AdditionalInfoService,
  ) {
    super(repository);
  }

  async makeOffer(id: string) {
    const doctor = await this.additonalService.getDoctor();
    const reservation = await this.reservationService.findOne(id);
    if(reservation.status != ReservationStatus.CREATED)
    throw new BadRequestException("you can't make an offer for started reservation")
    if(reservation.offers)
    reservation.offers.map((offer) => {
      if (offer.doctor_id == doctor.id) {
        throw new BadRequestException("you already made an offer");
      }
    })
    let value = 0;
    switch (reservation.reservationType) {
      case ReservationType.MEETING:
        value = doctor.home_consultation_price;
        break;
      case ReservationType.VIDEO_CALL:
        value = doctor.video_consultation_price;
        break;
      case ReservationType.VOICE_CALL:
        value = doctor.voice_consultation_price;
        break;
      default:
        value = 0;
        break;
    }

    const offer = new Offer({
      reservation_id: id,
      value: value,
      doctor_id: doctor.id,
    });
    return await this.repository.save(offer);
  }

  async getOffers(reservation_id: string) {
    return await this._repo.find({
      where: {
        reservation: {
          id: reservation_id,
          user_id: this.reservationService.currentUser.id,
        },
        
      },
      relations:{doctor:{user:true,specialization:true}}
    });
  }
}
