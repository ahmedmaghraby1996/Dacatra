import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { User } from '../user/user.entity';
import { OwnedEntity } from 'src/infrastructure/base/owned.entity';
import { DoctorLicense } from './doctor-license.entity';
import { Reservation } from '../reservation/reservation.entity';
import { Specialization } from './specialization.entity';
import { Offer } from '../reservation/offers.entity';
import { DoctorAvaliablity } from './doctor-avaliablity.entity';
import { Clinic } from './clinc.entity';

@Entity()
export class Doctor extends OwnedEntity {
  @OneToMany(() => Offer, (offer) => offer.doctor)
  offers: Offer[];

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({})
  user: User;

  @Column({ default: false })
  is_busy: boolean;
  @Column({ nullable: true })
  year_of_experience: number;

  @OneToMany(() => DoctorLicense, (license) => license.doctor)
  licenses: DoctorLicense[];

  @ManyToOne(() => Specialization, (spec) => spec.doctors)
  @JoinTable()
  specialization: Specialization;

  @OneToMany(() => DoctorAvaliablity, (availability) => availability.doctor)
  avaliablity: DoctorAvaliablity[];

  @Column({ nullable: true })
  specialization_id: string;

  @OneToMany(() => Reservation, (reservation) => reservation.doctor)
  reservations: Reservation[];

  @ManyToOne(() => Clinic, (clinc) => clinc.doctors)
  @JoinColumn({ name: 'clinic_id' })
  clinic: Clinic;
  @Column({ nullable: true })
  clinic_id: string;

  @Column({ nullable: true })
  summery: string;

  @Column({ type: 'float', precision: 10, scale: 6, nullable: true })
  latitude: number;

  @Column({ default: 0, type: 'decimal', precision: 10, scale: 2 })
  rating: number;
  @Column({ default: 0 })
  number_of_reviews: number;


  @Column({ type: 'float', precision: 10, scale: 6, nullable: true })
  longitude: number;

  @Column({ default:false })
  is_verified: boolean;

  @Column({ nullable: true, type: 'decimal', precision: 10, scale: 2 })
  video_consultation_price: number;

  @Column({ nullable: true, type: 'decimal', precision: 10, scale: 2 })
  voice_consultation_price: number;

  @Column({ nullable: true, type: 'decimal', precision: 10, scale: 2 })
  home_consultation_price: number;

  @Column({ nullable: true, type: 'decimal', precision: 10, scale: 2 })
  clinic_consultation_price: number;

  @Column({ default: false })
  is_urgent_doctor: boolean;

  constructor(data: Partial<Doctor>) {
    super();
    Object.assign(this, data);
  }
}
