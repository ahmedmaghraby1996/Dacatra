import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { User } from '../user/user.entity';
import { Address } from '../user/address.entity';
import { OwnedEntity } from 'src/infrastructure/base/owned.entity';
import { NurseOffer } from './nurse-offer.entity';
import { Nurse } from './nurse.entity';
import { Reservation } from '../reservation/reservation.entity';
import { ReservationStatus } from 'src/infrastructure/data/enums/reservation-status.eum';

@Entity()
export class NurseOrder extends OwnedEntity {
  @ManyToOne(() => User, (user) => user.nurse_orders)
  user: User;

  @Column({ default: ReservationStatus.CREATED })
  status: ReservationStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  rate: number;
  @Column({ nullable: true })
  comment: string;

  @Column({ nullable: true })
  cancel_reason: string;

  @Column({ default: false })
  cancel_request: boolean;

  @ManyToOne(() => Address, (address) => address.nurse_orders)
  address: Address;
  @Column()
  address_id: string;
  @Column({ nullable: true })
  notes: string;
  @Column()
  date_from: Date;
  @Column()
  date_to: Date;
  @OneToMany(() => NurseOffer, (offer) => offer.nurse)
  offers: NurseOffer[];

  @Column({ nullable: true, type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @ManyToOne(() => Nurse, (nurse) => nurse.orders)
  nurse: Nurse;
  @Column({ nullable: true })
  nurse_id: string;
  @Column({ length: 10, unique: true })
  number: string;
}
