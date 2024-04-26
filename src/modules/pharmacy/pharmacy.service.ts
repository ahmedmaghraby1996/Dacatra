import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Pharmacy } from 'src/infrastructure/entities/pharmacy/pharmacy.entity';
import { ImageManager } from 'src/integration/sharp/image.manager';
import { ILike, In, Like, MoreThan, Repository } from 'typeorm';
import { CreatePharamcyRequest } from './dto/request/create-pharamcy-request';
import { PharmacyAttachments } from 'src/infrastructure/entities/pharmacy/pharmacy-attachments.entity';
import * as fs from 'fs';
import {
  PhOrderAttachmentType,
  PharmacyAttachmentType,
} from 'src/infrastructure/data/enums/pharmacy-attachment-typs';
import { Request } from 'express';
import { DrugCategory } from 'src/infrastructure/entities/pharmacy/drug-category.entity';
import { FindDrugQuery } from './dto/request/find-drug-query';
import { Drug } from 'src/infrastructure/entities/pharmacy/drug.entity';
import { PhOrder } from 'src/infrastructure/entities/pharmacy/ph-order.entity';
import { makeOrderRequest } from './dto/request/make-order-request';
import { PhOrderAttachments } from 'src/infrastructure/entities/pharmacy/ph-order-attachments.entity';
import { Address } from 'src/infrastructure/entities/user/address.entity';
import { Role } from 'src/infrastructure/data/enums/role.enum';
import { PhOrderResponse } from './dto/respone/ph-order-response';
import { or } from 'sequelize';
import { toUrl } from 'src/core/helpers/file.helper';
import { PhOrderReplyRequest } from './dto/request/ph-order-replay-request';
import { PhReply } from 'src/infrastructure/entities/pharmacy/ph-reply.entity';

import { PaginatedRequest } from 'src/core/base/requests/paginated.request';
import { generateOrderNumber } from '../reservation/reservation.service';
import { NotificationService } from '../notification/services/notification.service';
import { NotificationTypes } from 'src/infrastructure/data/enums/notification-types.enum';
import { NotificationEntity } from 'src/infrastructure/entities/notification/notification.entity';
import { PhOrderGateway } from 'src/integration/gateways/ph-order.gateway';
import { I18nResponse } from 'src/core/helpers/i18n.helper';
import { UpdatePharamcyRequest } from './dto/request/update-pharmact-request';
import { Subscription } from 'src/infrastructure/entities/subscription/subscription.entity';
import { BaseUserService } from 'src/core/base/service/user-service.base';

@Injectable()
export class PharmacyService extends BaseUserService<Pharmacy> {
  constructor(
    @InjectRepository(DrugCategory)
    public drugCategoryRepository: Repository<DrugCategory>,
    @InjectRepository(PhOrder)
    private orderRepository: Repository<PhOrder>,
    @InjectRepository(Pharmacy)
    private pharmacyRepository: Repository<Pharmacy>,
    @Inject(I18nResponse) private readonly _i18nResponse: I18nResponse,
    @InjectRepository(Drug)
    private drugRepository: Repository<Drug>,
    private readonly phOrderGateway: PhOrderGateway,

    @InjectRepository(PhReply)
    private PhReplyRepository: Repository<PhReply>,

    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,

    @InjectRepository(Address)
    private addressRepository: Repository<Address>,
    @InjectRepository(PhOrderAttachments)
    private orderAttachmentRepository: Repository<PhOrderAttachments>,
    @InjectRepository(PharmacyAttachments)
    private pharmacyAttachmentRepository: Repository<PharmacyAttachments>,
    @Inject(NotificationService)
    public readonly notificationService: NotificationService,

    @InjectRepository(PhReply)
    private replyRepository: Repository<PhReply>,
    @Inject(REQUEST) request: Request,
  ) {
    super(pharmacyRepository, request);
  }


  
  async makeOrder(request: makeOrderRequest) {
    if ((await this.getMonthlyOrders(this.currentUser.id)) == false) {
      throw new BadRequestException('you have reached your monthly limit');
    }
    const ph_order = plainToInstance(PhOrder, {
      ...request,
      user_id: this.currentUser.id,
    });
    const count = await this.orderRepository
      .createQueryBuilder('order')
      .where('DATE(order.created_at) = CURDATE()')
      .getCount();
    ph_order.number = generateOrderNumber(count);

    const address = await this.addressRepository.findOne({
      where: {
        id: request.address_id,
      },
    });

    const nearby_pharmacies = await this.pharmacyRepository
      .createQueryBuilder('pharmacy')
      .select('pharmacy.*')
      .addSelect(
        `ST_Distance_Sphere(POINT(:longitude, :latitude), POINT(pharmacy.longitude, pharmacy.latitude)) as distance`,
      )
      .where(
        `ST_Distance_Sphere(POINT(:longitude, :latitude), POINT(pharmacy.longitude, pharmacy.latitude)) <= :radius`,
      )

      // .andWhere('pharmacy.categories LIKE %${categories}%', {
      //   categories: request.categories,
      // })

      .setParameters({
        latitude: address.latitude,
        longitude: address.longitude,
        radius: 10 * 1000,
      }) // Convert km to meters
      .orderBy('distance', 'ASC')
      .getRawMany();
    if (nearby_pharmacies.length == 0) {
      throw new BadRequestException('no nearby pharmacies');
    }
    ph_order.nearby_pharmacies = nearby_pharmacies.map(
      (pharmacy) => pharmacy.id,
    );
    await this.orderRepository.save(ph_order);

    if (request.attachments) {
      request.attachments.map((file) => {
        // check if image exists using fs
        const exists = fs.existsSync(file);
        if (!exists) throw new BadRequestException('file not found');
      });

      // save shipping order images
      const ph_order_attachments = request.attachments.map((file) => {
        // create shipping-images folder if not exists
        if (!fs.existsSync('storage/ph_order-attachments')) {
          fs.mkdirSync('storage/ph_order-attachments');
        }
        // store the future path of the image
        const newPath = file.replace('/tmp/', '/ph_order-attachments/');

        // use fs to move images
        return plainToInstance(PhOrderAttachments, {
          file: newPath,
          ph_order_id: ph_order.id,
          type: PhOrderAttachmentType.FILE,
        });
      });

      await this.orderAttachmentRepository.save(ph_order_attachments);
      request.attachments.map((image) => {
        const newPath = image.replace('/tmp/', '/ph_order-attachments/');
        fs.renameSync(image, newPath);
      });
    }

    if (request.voice_recording) {
      request.voice_recording.map((file) => {
        // check if image exists using fs
        const exists = fs.existsSync(file);
        if (!exists) throw new BadRequestException('file not found');
      });

      // save shipping order images
      const voice_recording = request.voice_recording.map((file) => {
        // create shipping-images folder if not exists
        if (!fs.existsSync('storage/ph_order-attachments')) {
          fs.mkdirSync('storage/ph_order-attachments');
        }
        // store the future path of the image
        const newPath = file.replace('/tmp/', '/ph_order-attachments/');

        // use fs to move images
        return plainToInstance(PhOrderAttachments, {
          file: newPath,
          ph_order_id: ph_order.id,
          type: PhOrderAttachmentType.VOICE,
        });
      });

      await this.orderAttachmentRepository.save(voice_recording);
      request.voice_recording.map((image) => {
        const newPath = image.replace('/tmp/', '/ph_order-attachments/');
        fs.renameSync(image, newPath);
      });
    }

    //

    const pharmacies = await this.pharmacyRepository.find({
      where: { id: In(nearby_pharmacies.map((pharmacy) => pharmacy.id)) },
    });
    await Promise.all(
      pharmacies.map(async (pharmacy) => {
        this.phOrderGateway.server.emit(
          `pharmacy-${pharmacy.user_id}`,
          this._i18nResponse.entity(await this.getSingle(ph_order.id)),
        );
        this.notificationService.create(
          new NotificationEntity({
            user_id: pharmacy.user_id,
            url: pharmacy.user_id,
            type: NotificationTypes.PHARMACY_ORDER,
            title_ar: 'لديك طلب جديد',
            title_en: 'you have a new order',
            text_ar: 'لديك طلب جديد',
            text_en: 'you have a new order',
          }),
        );
      }),
    );

    return ph_order;
  }
  async getDrugs(query: FindDrugQuery) {
    const drugs = await this.drugRepository.find({
      where: { category_id: query.category_id, name: Like(`%${query.name}%`) },
      take: 50,
    });
    return drugs;
  }

  async getDrugCategories() {
    return await this.drugCategoryRepository.find();
  }
  async deleteLicense(id: string) {
    const license = await this.pharmacyAttachmentRepository.findOne({
      where: { id, type: PharmacyAttachmentType.LICENSE },
    });
    fs.unlinkSync(license.file);
    await this.pharmacyAttachmentRepository.remove(license);
  }
  async deleteLog(id: string) {
    const logo = await this.pharmacyAttachmentRepository.findOne({
      where: { id, type: PharmacyAttachmentType.LOGO },
    });
    fs.unlinkSync(logo.file);
    await this.pharmacyAttachmentRepository.remove(logo);
  }

  async getPharmacyInfo(user_id: string) {
    return await this.pharmacyRepository.findOne({
      where: { user_id },
      relations: { attachments: true },
    });
  }

  async addPharmacyInfo(
    request: Partial<UpdatePharamcyRequest>,
    user_id: string,
  ) {
    const pharmacy_id = await this.pharmacyRepository.findOne({
      where: { user_id },
    });

    const pharmacy = plainToInstance(Pharmacy, {
      ...request,
      user_id,
      id: pharmacy_id?.id,
    });

    await this.pharmacyRepository.save(pharmacy);

    if (request.license_images) {
      request.license_images.split(',').map((file) => {
        // check if image exists using fs
        const exists = fs.existsSync(file);
        if (!exists) throw new BadRequestException('file not found');
      });

      // save shipping order images
      const license_images = request.license_images.split(',').map((file) => {
        // create shipping-images folder if not exists
        if (!fs.existsSync('storage/pharmacy-licsene')) {
          fs.mkdirSync('storage/pharmacy-licsene');
        }
        // store the future path of the image
        const newPath = file.replace('/tmp/', '/pharmacy-licsene/');

        // use fs to move images
        return plainToInstance(PharmacyAttachments, {
          file: newPath,
          pharmacy_id: pharmacy.id,
          type: PharmacyAttachmentType.LICENSE,
        });
      });

      await this.pharmacyAttachmentRepository.save(license_images);
      request.license_images.split(',').map((image) => {
        const newPath = image.replace('/tmp/', '/pharmacy-licsene/');
        fs.renameSync(image, newPath);
      });
    }

    if (request.logo_images) {
      request.logo_images.split(',').map((file) => {
        // check if image exists using fs
        const exists = fs.existsSync(file);
        if (!exists) throw new BadRequestException('file not found');
      });

      // save shipping order images
      const logo_images = request.logo_images.split(',').map((file) => {
        // create shipping-images folder if not exists
        if (!fs.existsSync('storage/pharmacy-logo')) {
          fs.mkdirSync('storage/pharmacy-logo');
        }
        // store the future path of the image
        const newPath = file.replace('/tmp/', '/pharmacy-logo/');

        // use fs to move images
        return plainToInstance(PharmacyAttachments, {
          file: newPath,
          pharmacy_id: pharmacy.id,
          type: PharmacyAttachmentType.LOGO,
        });
      });

      await this.pharmacyAttachmentRepository.save(logo_images);
      request.logo_images.split(',').map((image) => {
        const newPath = image.replace('/tmp/', '/pharmacy-logo/');
        fs.renameSync(image, newPath);
      });
    }
    return pharmacy;
  }
  async getReplies(id: string) {
    const pharamcy = await this.pharmacyRepository.findOne({
      where: { user_id: this.currentUser.id },
    });
    const replies = await this.PhReplyRepository.find({
      where: {
        order_id: id,
        pharmacy_id: pharamcy == null ? null : pharamcy.id,
      },
      relations: {
        pharmacy: {
          user: true,
          attachments: true,
        },
      },
    });
    return replies;
  }
  async getOrders(query: PaginatedRequest) {
    let { page, limit } = query;
    limit = limit || 20;
    page = page || 1;
    const pharamcy = await this.pharmacyRepository.findOne({
      where: { user_id: this.currentUser.id },
    });

    const orders = await this.orderRepository.find({
      where: this.currentUser.roles.includes(Role.PHARMACY)
        ? { nearby_pharmacies: ILike(`%${pharamcy.id}%`) }
        : {
            user_id: this.currentUser.roles.includes(Role.ADMIN)
              ? null
              : this.currentUser.id,
          },
      relations: {
        user: true,
        ph_order_attachments: true,
        ph_replies: { pharmacy: { user: true, attachments: true } },
      },
      order: { created_at: 'DESC' },
      select: {
        user: { first_name: true, last_name: true, phone: true, avatar: true },

        ph_replies: {
          id: true,
          note: true,
          created_at: true,
          availability: true,
          pharmacy_id: true,
          address: true,
          phone: true,
          price: true,
          pharmacy: {
            id: true,
            expierence: true,
            open_time: true,
            ph_name: true,
            close_time: true,
            address: true,
            attachments: true,

            user: {
              phone: true,
            },
          },
        },
      },
      take: limit,
      skip: (page - 1) * limit,
    });
    const orders_count = await this.orderRepository.countBy(
      this.currentUser.roles.includes(Role.PHARMACY)
        ? { nearby_pharmacies: ILike(`%${pharamcy.id}%`) }
        : { user_id: this.currentUser.id },
    );

    const result = await Promise.all(
      orders.map(async (order) => {
        const categories =
          order.categories == null
            ? []
            : await this.drugCategoryRepository.find({
                where: { id: In(order.categories) },
              });
        const drugs =
          order.drugs == null
            ? []
            : await this.drugRepository.find({
                where: { id: In(order.drugs) },
              });
        order.ph_order_attachments = order.ph_order_attachments.map(
          (attachment) => {
            attachment.file = toUrl(attachment.file);
            return attachment;
          },
        );

        return plainToInstance(
          PhOrderResponse,
          {
            ...order,
            has_replied: pharamcy
              ? await this.hasReplied(order.id, pharamcy.id)
              : false,
            categories: categories,
            drugs: drugs,
          },
          { excludeExtraneousValues: true },
        );
      }),
    );
    return { orders: result, count: orders_count };
  }

  async orderReply(request: PhOrderReplyRequest) {
    const pharamcy = await this.pharmacyRepository.findOne({
      where: { user_id: this.currentUser.id },
    });

    const reply = plainToInstance(PhReply, {
      ...request,
      pharmacy_id: pharamcy.id,
    });
    const order = await this.orderRepository.findOne({
      where: { id: request.order_id },
    });
    this.notificationService.create(
      new NotificationEntity({
        user_id: order.user_id,
        url: order.id,
        type: NotificationTypes.PHARMACY_ORDER,
        title_ar: 'قامت صيدلية بالرد',
        title_en: 'pharmacy replied',
        text_ar: 'قامت صيدلية بالرد',
        text_en: 'pharmacy replied',
      }),
    );

    return await this.replyRepository.save(reply);
  }

  async getSingle(id: string) {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: {
        user: true,
        ph_order_attachments: true,
        ph_replies: { pharmacy: { user: true, attachments: true } },
      },
      select: {
        user: { first_name: true, last_name: true, phone: true, avatar: true },

        ph_replies: {
          id: true,
          note: true,
          created_at: true,
          availability: true,
          pharmacy_id: true,
          address: true,
          phone: true,
          price: true,
          pharmacy: {
            id: true,
            expierence: true,
            open_time: true,
            ph_name: true,
            close_time: true,
            address: true,
            attachments: true,

            user: {
              phone: true,
            },
          },
        },
      },
    });

    const categories =
      order.categories == null
        ? []
        : await this.drugCategoryRepository.find({
            where: { id: In(order.categories) },
          });
    const drugs =
      order.drugs == null
        ? []
        : await this.drugRepository.find({
            where: { id: In(order.drugs) },
          });
    order.ph_order_attachments = order.ph_order_attachments.map(
      (attachment) => {
        attachment.file = toUrl(attachment.file);
        return attachment;
      },
    );

    return plainToInstance(
      PhOrderResponse,
      {
        ...order,
        categories: categories,
        drugs: drugs,
      },
      { excludeExtraneousValues: true },
    );
  }
  async hasReplied(order_id: string, pharmacy_id: string) {
    const reply = await this.replyRepository.findOne({
      where: { order_id, pharmacy_id },
    });
    if (reply) return true;
    return false;
  }

  async getCategories(ids: string[]) {
    const categories = await this.drugCategoryRepository.find({
      where: { id: In(ids) },
    });
    return categories;
  }

  async getMonthlyOrders(id: string) {
    const firstDayOfMonth = new Date(
      new Date().setDate(new Date().getDate() - 30),
    );
    const lastDayOfMonth = new Date();
    let max_orders = 3;
    let subscription_order = false;
    const subscription = await this.subscriptionRepository.findOne({
      where: {
        user_id: id,
        expiration_date: MoreThan(new Date()),
      },
      order: { created_at: 'DESC' },
      relations: { package: true },
    });

    if (subscription) {
      console.log(1);
      subscription_order =
        subscription.package.number_of_pharmacy_order <=
        subscription.number_of_used_orders
          ? false
          : true;
    }

    const orders = await this.orderRepository
      .createQueryBuilder('ph_order')
      .where(
        'ph_order.created_at >= :firstDayOfMonth AND ph_order.created_at <= :lastDayOfMonth',
        {
          firstDayOfMonth,
          lastDayOfMonth,
        },
      )
      .andWhere('ph_order.user_id = :user_id', { user_id: id })
      .getCount();

    if (orders >= max_orders && !subscription_order) {
      return false;
    }
    if (subscription) {
      console.log('2');
      subscription.number_of_used_orders =
        subscription.number_of_used_orders + 1;
      await this.subscriptionRepository.save(subscription);
    }
    return true;
  }
}
