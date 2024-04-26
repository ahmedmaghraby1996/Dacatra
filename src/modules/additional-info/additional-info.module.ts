import { Module } from '@nestjs/common';
import { AdditionalInfoController } from './additional-info.controller';
import { AdditionalInfoService } from './additional-info.service';
import { PharmacyService } from '../pharmacy/pharmacy.service';
import { NurseOrderService } from '../nurse/nurse.service';
import { PhOrderGateway } from 'src/integration/gateways/ph-order.gateway';
import { NotificationService } from '../notification/services/notification.service';
import { FileService } from '../file/file.service';
import { NurseOrderGateway } from 'src/integration/gateways/nurse-order.gateway';
import { FcmIntegrationService } from 'src/integration/notify/fcm-integration.service';
import { TransactionService } from '../transaction/transaction.service';

@Module({
  controllers: [AdditionalInfoController],
  providers: [
    AdditionalInfoService,
    NurseOrderService,
    PharmacyService,
    NotificationService,
    PhOrderGateway,
    FileService,
    NurseOrderGateway,
    FcmIntegrationService,
    TransactionService
  ],
})
export class AdditionalInfoModule {}
