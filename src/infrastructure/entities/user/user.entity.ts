import { AuditableEntity } from 'src/infrastructure/base/auditable.entity';
import {
  Entity,
  Column,
  BeforeInsert,
  OneToMany,
  OneToOne,
  ManyToOne,
} from 'typeorm';
import { Factory } from 'nestjs-seeder';
import { randNum } from 'src/core/helpers/cast.helper';
import { Gender } from 'src/infrastructure/data/enums/gender.enum';
import { Role } from 'src/infrastructure/data/enums/role.enum';
import { Language } from 'src/infrastructure/data/enums/language.enum';
import { Address } from './address.entity';
import { Reservation } from '../reservation/reservation.entity';
import { Client } from '../client/client.entity';
import {NotificationEntity} from '../notification/notification.entity'
import { PhOrder } from '../pharmacy/ph-order.entity';
import { NurseOrder } from '../nurse/nurse-order.entity';
import { Wallet } from '../wallet/wallet.entity';
import { Transaction } from '../wallet/transaction.entity';
import { Subscription } from '../subscription/subscription.entity';
import { PromoCode } from '../promo-code/promo-code.entity';
import { SuggestionsComplaints } from '../suggestions-complaints/suggestions-complaints.entity';

@Entity()
export class User extends AuditableEntity {

  @OneToMany(()=>Reservation,reservation=>reservation.user)
  reservations:Reservation[]

  @OneToMany(()=>SuggestionsComplaints,suggestionsComplaints=>suggestionsComplaints.user)
  suggestionsComplaints:SuggestionsComplaints[]
  @OneToMany(()=>PromoCode,promoCode=>promoCode.user)
  promoCodes:PromoCode[]
  @OneToMany(()=>NurseOrder,nurserOrder=>nurserOrder.user)
  nurse_orders:NurseOrder[]

  // account > unique id generator 10 numbers)
  @Factory((faker) => faker.phone.number('########'))
  @Column({ length: 8, unique: true })
  account: string;

  @OneToMany(()=>NotificationEntity,notification=>notification.user)
  notifications:NotificationEntity[]

  @Factory((faker) => faker.helpers.unique(faker.internet.domainName))
  @Column({ length: 100, unique: true })
  username: string;

  @Column({ length: 100 })
  first_name: string;

  @OneToOne(()=>Client,client=>client.user)
 
  client_info:Client
  @Column({ length: 100 })
  last_name: string;

  // @Factory((faker, ctx) => faker.internet.password())
  @Column({ nullable: true, length: 60 })
  password: string;

  @Factory((faker, ctx) => faker.internet.email(ctx.name))
  @Column({ nullable: true, length: 100 })
  email: string;

  @Factory((faker) => faker.date.future())
  @Column({ nullable: true })
  email_verified_at: Date;

  @Factory((faker) => faker.phone.number('+965#########'))
  @Column({ nullable: true, length: 20 })
  phone: string;

  @Factory((faker) => faker.date.future())
  @Column({ nullable: true })
  phone_verified_at: Date;

  @Factory((faker) => faker.internet.avatar())
  @Column({ nullable: true, length: 500 })
  avatar: string;

  @OneToMany(() => PhOrder, (phOrder) => phOrder.user)
  ph_orders: PhOrder[]

  @Factory((faker) => faker.helpers.arrayElement(Object.values(Gender)))
  @Column({ nullable: true, type: 'enum', enum: Gender })
  gender: Gender;

  @Column({ nullable: true, length: 500 })
  fcm_token: string;
  
  @Column()
  birth_date:string

  @Column({ type: 'enum', enum: Language, default: Language.EN })
  language: Language;

  @Column({ default: true })
  is_active: boolean;

  @OneToOne(() => Wallet, (wallet) => wallet.user)
  wallet: Wallet;

  @Column({ default: 0 })
  review_count: number;

  @ManyToOne(() => Transaction, (transaction) => transaction.user)
  transactions: Transaction[];

  @Factory((faker) => faker.helpers.arrayElement([Role.CLIENT, Role.DOCTOR]))
  @Column({ type: 'set', enum: Role, default: [Role.CLIENT] })
  roles: Role[];

  @OneToMany(() => Subscription, (subscription) => subscription.user)
  subscriptions: Subscription[];

  @OneToMany(() => Address, (address) => address.user, {
    cascade: true,
  })
  addresses: Promise<Address[]>;

  constructor(partial: Partial<User>) {
    super();
    Object.assign(this, partial);
  }

  // generate unique id in this pattern: ######
  public uniqueIdGenerator(): string {
    return randNum(8);
  }

  @BeforeInsert()
  generateAccount() {
    // ensure the account is unique
    if (!this.account) this.account = this.uniqueIdGenerator();
  }
}
