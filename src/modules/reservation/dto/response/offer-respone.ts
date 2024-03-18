import { Expose, plainToInstance } from 'class-transformer';
import { toUrl } from 'src/core/helpers/file.helper';
import { ReservationStatus } from 'src/infrastructure/data/enums/reservation-status.eum';
import { ReservationType } from 'src/infrastructure/data/enums/reservation-type';
import { Doctor } from 'src/infrastructure/entities/doctor/doctor.entity';
import { Specialization } from 'src/infrastructure/entities/doctor/specialization.entity';
import { ReservationAttachments } from 'src/infrastructure/entities/reservation/reservation-attachments.entity';
import { Reservation } from 'src/infrastructure/entities/reservation/reservation.entity';

export class OfferResponse {
  @Expose()
  id: string;
  @Expose()
  reservation_id: string;
  @Expose()
  value: number;
  @Expose()
  is_accepted: boolean;
  @Expose()
  doctor: any;

  created_at: Date;

  constructor(data: Partial<OfferResponse>) {
    this.id = data.id;
    this.is_accepted = data.is_accepted;
    this.reservation_id = data.reservation_id;
    this.value = data.value;
    this.created_at = data.created_at;

    this.doctor = data.doctor
      ? {
          id: data.doctor.id,
          name: data.doctor.user.first_name + ' ' + data.doctor.user.last_name,
          avatar: data.doctor.user.avatar
            ? toUrl(data.doctor.user.avatar)
            : null,
          summery: data.doctor.summery,
          rating:data.doctor.number_of_reviews==0?0: data.doctor.rating/data.doctor.number_of_reviews,
          experience: data.doctor.year_of_experience,
          specialization: data.doctor.specialization,
        }
      : null;
  }
}
