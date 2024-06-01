import { AddressModule } from './address/address.module';

import { Module } from '@nestjs/common';
import { AdditionalInfoModule } from './additional-info/additional-info.module';
import { ReservationModule } from './reservation/reservation.module';
import { NotificationModule } from './notification/notification.module';
import { DoctorModule } from './doctor/doctor.module';
import { PharmacyModule } from './pharmacy/pharmacy.module';
import { StaticPageModule } from './static-page/static-page.module';
import { ContactUsModule } from './contact-us/contact-us.module';
import { SuggestionsComplaints } from 'src/infrastructure/entities/suggestions-complaints/suggestions-complaints.entity';
import { SuggestionsComplaintsModule } from './suggestions-complaints/suggestions-complaints.module';
import { FaqModule } from './faq/faq.module';
import { NurseModule } from './nurse/nurse.module';
import { TransactionModule } from './transaction/transaction.module';
import { PackageModule } from './package/package.module';
import { PromoCodeModule } from './promo-code/promo-code.module';
import { Banar } from 'src/infrastructure/entities/banar/banar.entity';
import { BanarModule } from './banar/banar.module';
import { SettingsModule } from './settings/settings.module';

@Module({
    imports: [
        AddressModule,
        AdditionalInfoModule,
        ReservationModule,
        NotificationModule,
        DoctorModule,
        PharmacyModule,
        StaticPageModule,
        ContactUsModule,
        SuggestionsComplaintsModule,
        FaqModule,
        NurseModule,
        TransactionModule,
        PackageModule,
        PromoCodeModule,
        BanarModule,
  
        SettingsModule
        
    ],
    exports: [
        AddressModule,
    ],
})
export class AssemblyModule { }
