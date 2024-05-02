import { Expose, plainToInstance } from 'class-transformer';
import { toUrl } from 'src/core/helpers/file.helper';
import { ReservationStatus } from 'src/infrastructure/data/enums/reservation-status.eum';
import { ReservationType } from 'src/infrastructure/data/enums/reservation-type';
import { Doctor } from 'src/infrastructure/entities/doctor/doctor.entity';
import { Specialization } from 'src/infrastructure/entities/doctor/specialization.entity';
import { ReservationAttachments } from 'src/infrastructure/entities/reservation/reservation-attachments.entity';
import { Reservation } from 'src/infrastructure/entities/reservation/reservation.entity';

export class ReservationResponse {
  @Expose()
  id: string;
  @Expose()
  reservationType: ReservationType;
  @Expose()
  specialization: any;
  

  @Expose()
  phone: string;
  @Expose()
  status: ReservationStatus;
  @Expose()
  note: string;

  @Expose()
  attachments: any;

  @Expose()
  doctor: any;

  @Expose()
  client_agora_token: string;
  @Expose()
  doctor_agora_token: string;
  @Expose()
  end_date: Date;

  @Expose()
  address: any;

  @Expose()
  family_member: any;

  @Expose()
  start_date: Date;

  start_day?: string;

  @Expose()
  rate:number
  start_time?: number;
  @Expose() 
  client_info: any;
  availability?: any;
  number?:string
  created_at?: Date;
  sent_offer: boolean;
  is_urgent: boolean;
  cancel_reason:string
  cancel_request:boolean

  constructor(data: Partial<ReservationResponse>) {

    this.rate=data.rate
    const startDate = new Date(data.start_day);


    if (data.start_time != null) {
    
      startDate.setUTCHours(Number(data.start_time.toString().split('.')[0]));
      startDate.setMinutes(Number(data.start_time.toString().split('.')[1]));
    }
    this.end_date = data.end_date;
    this.id = data.id;
    this.number=data.number
    this.is_urgent = data.is_urgent;
    this.created_at = data.created_at
    this.sent_offer = data.sent_offer;
    this.note = data.note;
    this.cancel_reason=data.cancel_reason;
    this.cancel_request=data.cancel_request;
    this.availability = data.availability;
    this.start_date = startDate;
    this.phone = data.phone;

    this.doctor_agora_token = data.doctor_agora_token ? data.doctor_agora_token : null;
    this.client_agora_token = data.client_agora_token ? data.client_agora_token : null;
    this.status = data.status;
    this.reservationType = data.reservationType;
    this.specialization = {
      id: data.specialization.id,
      name: data.specialization.name,
    };
    this.attachments = data.attachments
      ? data.attachments.map((e) => {
          e.file = toUrl(e.file);
          return { file: e.file, provider: e.type };
        })
      : null;

    this.doctor = data.doctor
      ? {
          id: data.doctor.id,
          name: data.doctor.user.first_name + ' ' + data.doctor.user.last_name,
          avatar: data.doctor.user.avatar ? toUrl(data.doctor.user.avatar) : null,
          clinic: data.doctor.clinic,
          rating:data.doctor.number_of_reviews==0?0: data.doctor.rating/data.doctor.number_of_reviews,
        }
      : null;

    this.family_member = data.family_member
      ? {
          id: data.family_member.id,
          name: data.family_member.first_name,
          height: data.family_member.height,
          weight: data.family_member.weight,
          kinship: data.family_member.kinship,

          allergic_reactions: data.family_member.allergic_reactions,

          notes: data.family_member.notes,
        }
      : null;

    this.client_info = data['user'].client_info
      ? {
          name: data['user'].first_name + ' ' + data['user'].last_name,
          avatar: data['user'].avatar ? toUrl(data['user'].avatar) : null,
          height: data['user'].client_info.height,
          weight: data['user'].client_info.weight,

          allergic_reactions: data['user'].client_info.allergic_reactions,

          notes: data['user'].client_info.notes,
          address: data.address
            ? {
                name: data.address.name,
                address: data.address.address,
                lat: data.address.latitude,
                lng: data.address.longitude,
              }
            : null,
        }
      : null;
  }
}
