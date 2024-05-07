import { toUrl } from 'src/core/helpers/file.helper';
import { Doctor } from 'src/infrastructure/entities/doctor/doctor.entity';

export class DoctorResopone {
  id: string;
  name: string;
  avatar: string;
  specialization: any;
  video_consultation_price: number;
  voice_consultation_price: number;
  home_consultation_price: number;
  user: any;
  clinic_consultation_price: number;
  summery: string;
  rating: number;
  experience: number;
  clinic: any;
  user_id: string;
  is_verified: boolean;
  constructor(data: Partial<Doctor>) {
    this.id = data.id;
    this.user_id=data.user_id;
    this.is_verified = data.is_verified;
    this.avatar = data.user.avatar ? toUrl(data.user.avatar) : null;
    this.name = data.user.first_name + ' ' + data.user.last_name;
    this.experience = data.year_of_experience;
    this.summery = data.summery;
    this.rating = data.rating;
    this.specialization = data.specialization;
    this.video_consultation_price = data.video_consultation_price;
    this.voice_consultation_price = data.voice_consultation_price;
    this.home_consultation_price = data.home_consultation_price;
    this.clinic_consultation_price = data.clinic_consultation_price;
    this.clinic = data.clinic;
  }
}
