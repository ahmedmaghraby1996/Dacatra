import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Nurse } from 'src/infrastructure/entities/nurse/nurse.entity';
import { LessThan, MoreThan, Repository, Transaction } from 'typeorm';
import { CreateNurseRequest } from './dto/request/create-nurse-request';
import { FileService } from '../file/file.service';
import { REQUEST } from '@nestjs/core';
import { plainToInstance } from 'class-transformer';
import { NurseOrderRequest } from './dto/request/nurse-order-request';
import { Request } from 'express';
import { BaseUserService } from 'src/core/base/service/user-service.base';
import { NurseOrder } from 'src/infrastructure/entities/nurse/nurse-order.entity';
import { NurseOfferRequest } from './dto/request/nurse-offer-request';
import { NurseOffer } from 'src/infrastructure/entities/nurse/nurse-offer.entity';
import { generateOrderNumber } from '../reservation/reservation.service';
import { NotificationService } from '../notification/services/notification.service';
import { NotificationEntity } from 'src/infrastructure/entities/notification/notification.entity';
import { NotificationTypes } from 'src/infrastructure/data/enums/notification-types.enum';
import { NurseOrderGateway } from 'src/integration/gateways/nurse-order.gateway';
import { NurseOrderResponse } from './dto/respone/nurse-order.response';
import { NurseLicense } from 'src/infrastructure/entities/nurse/nurse-license.entity';
import * as fs from 'fs';
import { UpdateNurseRequest } from './dto/request/update-nurse-request';
import { CancelReservationRequest } from '../reservation/dto/requests/cancel-reservation-request';
import { RateDoctorRequest } from '../reservation/dto/requests/rate-doctor-request';
import { ReservationStatus } from 'src/infrastructure/data/enums/reservation-status.eum';
import { TransactionService } from '../transaction/transaction.service';
import { MakeTransactionRequest } from '../transaction/dto/requests/make-transaction-request';
@Injectable()
export class NurseOrderService extends BaseUserService<NurseOrder> {
  constructor(
    @InjectRepository(NurseOrder)
    private readonly nurseOrderRepo: Repository<NurseOrder>,
    @InjectRepository(Nurse) private readonly nurseRepo: Repository<Nurse>,
    @InjectRepository(NurseOffer)
    private readonly nurseOfferRepo: Repository<NurseOffer>,
    @Inject(TransactionService)
    private readonly transactionService: TransactionService,
    @InjectRepository(NurseLicense)
    private readonly nurseLicenseRepo: Repository<NurseLicense>,
    @Inject(FileService) private _fileService: FileService,
    @Inject(NotificationService)
    public readonly notificationService: NotificationService,
    private readonly nurseOrderGateway: NurseOrderGateway,
    @Inject(REQUEST) request: Request,
  ) {
    super(nurseOrderRepo, request);
  }

  async getNurse(id: string) {
    return await this.nurseRepo.findOne({
      where: { user_id: id },
      relations: { license_images: true },
    });
  }
  async addNurse(req: Partial<UpdateNurseRequest>, userId: string) {
    const nurse_id = await this.getNurse(userId);
    const nurse = plainToInstance(Nurse, {
      ...req,
      user_id: userId,
      id: nurse_id?.id,
    });
    delete nurse.license_images;

    await this.nurseRepo.save(nurse);

    if (req.license_images) {
      req.license_images.split(',').map((file) => {
        // check if image exists using fs
        const exists = fs.existsSync(file);
        if (!exists) throw new BadRequestException('file not found');
      });

      // save shipping order images
      const nurse_licenses = req.license_images.split(',').map((file) => {
        // create shipping-images folder if not exists
        if (!fs.existsSync('storage/nurse-licenses')) {
          fs.mkdirSync('storage/nurse-licenses');
        }
        // store the future path of the image
        const newPath = file.replace('/tmp/', '/nurse-licenses/');

        // use fs to move images
        return plainToInstance(NurseLicense, {
          image: newPath,
          nurse_id: nurse.id,
        });
      });

      await this.nurseLicenseRepo.save(nurse_licenses);
      req.license_images.split(',').map((image) => {
        const newPath = image.replace('/tmp/', '/nurse-licenses/');
        fs.renameSync(image, newPath);
      });
    }
    return nurse;
  }

  async deleteLicense(id: string) {
    const license = await this.nurseLicenseRepo.findOne({ where: { id } });
    fs.unlinkSync(license.image);
    await this.nurseLicenseRepo.remove(license);
  }

  async createNurseOrder(req: NurseOrderRequest) {
    const order = plainToInstance(NurseOrder, req);
    const count = await this._repo
      .createQueryBuilder('nurse_order')
      .where('DATE(nurse_order.created_at) = CURDATE()')
      .getCount();
    order.number = generateOrderNumber(count);
    order.user_id = super.currentUser.id;
    await this.nurseOrderRepo.save(order);
    const nurses = await this.nurseRepo.find();
    await Promise.all(
      nurses.map(async (nurse) => {
        this.nurseOrderGateway.server.emit(
          `nurse-${nurse.user_id}`,
          plainToInstance(
            NurseOrderResponse,
            await this.getSingleOrder(order.id),
          ),
        );
        this.notificationService.create(
          new NotificationEntity({
            user_id: nurse.user_id,
            url: nurse.user_id,
            type: NotificationTypes.ORDER,
            title_ar: 'لديك طلب جديد',
            title_en: 'you have a new order',
            text_ar: 'لديك طلب جديد',
            text_en: 'you have a new order',
          }),
        );
      }),
    );

    return order;
  }

  async getSingleOrder(id: string) {
    return await this.nurseOrderRepo.findOne({
      where: { id },
      relations: { user: true, address: true, nurse: { user: true } },
    });
  }

  async getOffers(id: string) {
    const nurse = await this.nurseRepo.findOne({
      where: { user_id: super.currentUser.id },
    });
    const offers = await this.nurseOfferRepo.find({
      where: { nurse_order_id: id, nurse_id: nurse === null ? null : nurse.id },
      relations: { nurse: { user: true } },
    });

    return offers;
  }

  async sendOffer(req: NurseOfferRequest) {
    const offer = plainToInstance(NurseOffer, req);
    const nurse = await this.nurseRepo.findOne({
      where: { user_id: super.currentUser.id },
    });
    const sent_offer = await this.nurseOfferRepo.findOne({
      where: { nurse_id: nurse.id, nurse_order_id: req.nurse_order_id },
    });
    if (sent_offer) throw new BadRequestException('offer already sent');
    const nuser_order = await this.nurseOrderRepo.findOne({
      where: { nurse_id: nurse.id, date_to: MoreThan(new Date()) },
    });
    if (nuser_order)
      throw new BadRequestException('nurse already have an order');
    offer.nurse_id = nurse.id;

    const order = await this.nurseOrderRepo.findOne({
      where: { id: req.nurse_order_id },
    });

    this.notificationService.create(
      new NotificationEntity({
        user_id: order.user_id,
        url: order.user_id,
        type: NotificationTypes.ORDER,
        title_ar: 'لديك طلب جديد',
        title_en: 'you have a new order',
        text_ar: 'لديك طلب جديد',
        text_en: 'you have a new order',
      }),
    );
    return this.nurseOfferRepo.save(offer);
  }

  async sentOffer(nurse_order_id: string, nurse_id: string) {
    const reply = await this.nurseOfferRepo.findOne({
      where: { nurse_order_id, nurse_id },
    });
    if (reply) return true;
    return false;
  }

  async acceptOffer(id: string) {
    const offer = await this.nurseOfferRepo.findOne({
      where: { id },
    });
    const nuser_order = await this.nurseOrderRepo.findOne({
      where: { nurse_id: offer.nurse_id, date_to: MoreThan(new Date()) },
    });
    if (nuser_order)
      throw new BadRequestException('nurse already have an order');

    await this.transactionService.checkBalance(
      this.currentUser.id,
      offer.value,
    );

    offer.is_accepted = true;
    const nurse_order = await this.nurseOrderRepo.findOne({
      where: { id: offer.nurse_order_id },
    });
    if (nurse_order.status == ReservationStatus.STARTED)
      throw new BadRequestException('the order is already accepted');
    await this.nurseOfferRepo.save(offer);

    nurse_order.status = ReservationStatus.STARTED;
    nurse_order.nurse_id = offer.nurse_id;
    await this.nurseOrderRepo.save(nurse_order);
    const result = await this.getSingleOrder(offer.nurse_order_id);
    const nurse = await this.nurseRepo.findOne({
      where: { id: offer.nurse_id },
    });
    await this.transactionService.makeTransaction(
      new MakeTransactionRequest({
        amount: offer.value,
        user_id: this.currentUser.id,
        receiver_id: nurse.user_id,
      }),
    );
    this.nurseOrderGateway.server.emit(
      `nurse-${nurse.user_id}`,
      plainToInstance(NurseOrderResponse, result),
    );
    return result;
  }

  async nurseCancel(request: CancelReservationRequest) {
    const order = await this.nurseOrderRepo.findOne({
      where: { id: request.id },
    });
    if (!order) throw new NotFoundException('order not found');
    order.cancel_reason = request.reason;
    order.cancel_request = true;
    await this.nurseOrderRepo.save(order);
    return await this.getSingleOrder(request.id);
  }

  async clientRating(request: RateDoctorRequest) {
    const order = await this.nurseOrderRepo.findOne({
      where: { id: request.order_id },
    });
    if (!order) throw new NotFoundException('order not found');
    if (
      !(order.status == ReservationStatus.STARTED && order.date_to < new Date())
    )
      throw new BadRequestException('order can not be rated now');
    if (order.rate)
      throw new BadRequestException('order has already been rated');
    const nurse = await this.nurseRepo.findOne({
      where: { id: order.nurse_id },
    });
    nurse.number_of_reviews = nurse.number_of_reviews + 1;
    nurse.rating = Number(nurse.rating) + Number(request.rate);
    this.nurseRepo.save(nurse);
    order.comment = request.comment;
    order.rate = request.rate;
    await this.nurseOrderRepo.save(order);
    return await this.getSingleOrder(request.order_id);
  }
}


@Injectable()
export class NurseService extends BaseUserService<Nurse>{
  constructor(
    @InjectRepository(Nurse) private nurseRepo: Repository<Nurse>,
    @Inject(REQUEST) request: Request,
  
   ){
      super(nurseRepo,request);
    }

}