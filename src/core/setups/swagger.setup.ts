import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Banar } from 'src/infrastructure/entities/banar/banar.entity';
import { Pharmacy } from 'src/infrastructure/entities/pharmacy/pharmacy.entity';
import { PromoCode } from 'src/infrastructure/entities/promo-code/promo-code.entity';
import { SuggestionsComplaints } from 'src/infrastructure/entities/suggestions-complaints/suggestions-complaints.entity';
import { AdditionalInfoModule } from 'src/modules/additional-info/additional-info.module';
import { AddressModule } from 'src/modules/address/address.module';
import { AuthenticationModule } from 'src/modules/authentication/authentication.module';
import { BanarModule } from 'src/modules/banar/banar.module';
import { ContactUsModule } from 'src/modules/contact-us/contact-us.module';
import { DoctorModule } from 'src/modules/doctor/doctor.module';
import { FaqModule } from 'src/modules/faq/faq.module';
import { FileModule } from 'src/modules/file/file.module';
import { NotificationModule } from 'src/modules/notification/notification.module';
import { NurseModule } from 'src/modules/nurse/nurse.module';
import { PackageModule } from 'src/modules/package/package.module';
import { PharmacyModule } from 'src/modules/pharmacy/pharmacy.module';
import { PromoCodeModule } from 'src/modules/promo-code/promo-code.module';
import { ReservationModule } from 'src/modules/reservation/reservation.module';
import { SettingsModule } from 'src/modules/settings/settings.module';
import { StaticPageModule } from 'src/modules/static-page/static-page.module';
import { SuggestionsComplaintsModule } from 'src/modules/suggestions-complaints/suggestions-complaints.module';
import { TransactionModule } from 'src/modules/transaction/transaction.module';
import { UserModule } from 'src/modules/user/user.module';

export default (app: INestApplication, config: ConfigService) => {
  const operationIdFactory = (controllerKey: string, methodKey: string) =>
    methodKey;

  const publicConfig = new DocumentBuilder()
    .addBearerAuth()
    .setTitle(`${config.get('APP_NAME')} API`)
    .setDescription(`${config.get('APP_NAME')} API description`)
    .setVersion('v1')
    .setContact('Contact', 'https://github.com/mahkassem', 'mahmoud.ali.kassem@gmail.com')
    .setLicense('Developed by Ahmed el-Maghraby', 'https://github.com/mahkassem')
    .addServer(config.get('APP_HOST'))
    .build();

  const publicDocument = SwaggerModule.createDocument(app, publicConfig, {
    include: [
      AuthenticationModule,
      UserModule,
      AddressModule,
      FileModule,
      AdditionalInfoModule,
      ReservationModule,
      DoctorModule,
      UserModule,
      NotificationModule,
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
    operationIdFactory,
  });

  SwaggerModule.setup('swagger', app, publicDocument);
};
