import { Module } from '@nestjs/common';
import { NurseController } from './nurse.controller';
import { NurseOrderService, NurseService } from './nurse.service';
import { FileService } from '../file/file.service';
import { NotificationService } from '../notification/services/notification.service';
import { FcmIntegrationService } from 'src/integration/notify/fcm-integration.service';
import { NurseOrderGateway } from 'src/integration/gateways/nurse-order.gateway';
import { TransactionService } from '../transaction/transaction.service';

@Module({
  controllers: [NurseController],
  providers: [NurseOrderService,NurseService,TransactionService,FileService,NotificationService,FcmIntegrationService,NurseOrderGateway],
})
export class NurseModule {}
