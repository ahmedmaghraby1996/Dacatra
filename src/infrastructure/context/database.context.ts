import { Otp } from "../entities/auth/otp.entity";
import { User } from "../entities/user/user.entity";
import { Address } from "../entities/user/address.entity";
import { Doctor } from "../entities/doctor/doctor.entity";
import { DoctorLicense } from "../entities/doctor/doctor-license.entity";
import { Specialization } from "../entities/doctor/specialization.entity";
import { Reservation } from "../entities/reservation/reservation.entity";
import { ReservationAttachments } from "../entities/reservation/reservation-attachments.entity";
import { FamilyMember } from "../entities/client/family-member.entity";
import { Client } from "../entities/client/client.entity";
import { Offer } from "../entities/reservation/offers.entity";
import { DoctorAvaliablity } from "../entities/doctor/doctor-avaliablity.entity";
import { WeekDays } from "../entities/week-days/week-days.entity";
import { Clinic } from "../entities/doctor/clinc.entity";
import { NotificationEntity } from "../entities/notification/notification.entity";
import { Pharmacy } from "../entities/pharmacy/pharmacy.entity";
import { PhOrderAttachments } from "../entities/pharmacy/ph-order-attachments.entity";
import { PhOrder } from "../entities/pharmacy/ph-order.entity";
import { PhReply } from "../entities/pharmacy/ph-reply.entity";
import { PharmacyAttachments } from "../entities/pharmacy/pharmacy-attachments.entity";
import { Drug } from "../entities/pharmacy/drug.entity";
import { DrugCategory } from "../entities/pharmacy/drug-category.entity";
import { StaticPage } from "../entities/static-pages/static-pages.entity";
import { ContactUs } from "../entities/contact-us/contact-us.entity";
import { SuggestionsComplaints } from "../entities/suggestions-complaints/suggestions-complaints.entity";
import { FaqModule } from "src/modules/faq/faq.module";
import { FaqQuestion } from "../entities/faq/faq_question";
import { Nurse } from "../entities/nurse/nurse.entity";
import { NurseOrder } from "../entities/nurse/nurse-order.entity";
import { NurseOffer } from "../entities/nurse/nurse-offer.entity";
import { NurseLicense } from "../entities/nurse/nurse-license.entity";
import { Transaction } from "../entities/wallet/transaction.entity";
import { Wallet } from "../entities/wallet/wallet.entity";
import { Subscription } from "../entities/subscription/subscription.entity";
import { Package } from "../entities/subscription/package.entity";
import { PromoCode } from "../entities/promo-code/promo-code.entity";
import { Banar } from "../entities/banar/banar.entity";
import { SettingsTypes } from "../data/enums/settings.enum";
import { AppSettings } from "../entities/settings/setting.entity";

export const DB_ENTITIES = [
  User,
  Address,
  Offer,
  Otp,
  Doctor,
  DoctorLicense,
  Specialization,
  Reservation,
  ReservationAttachments,
  FamilyMember,
  Client,
  DoctorAvaliablity,
  WeekDays,
  Clinic,
  NotificationEntity,
  Pharmacy,
  PhOrderAttachments,
  PhOrder,
  PhReply,
  PharmacyAttachments,
  Drug,
  DrugCategory,
  StaticPage,
  ContactUs ,
  SuggestionsComplaints,
  FaqQuestion,
  Nurse,
  NurseOrder,
  NurseOffer,
  NurseLicense,
  Transaction,
  Wallet,
  Subscription,
  Package,
  PromoCode,
  Banar,
 AppSettings
  
];

export const DB_VIEWS = [];
