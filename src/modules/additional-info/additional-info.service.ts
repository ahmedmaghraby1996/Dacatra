import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { DoctorInfoRequest } from './dto/requests/doctor-info-request';
import { InjectRepository } from '@nestjs/typeorm';
import { Doctor } from 'src/infrastructure/entities/doctor/doctor.entity';
import { EntityManager, In, Not, Repository } from 'typeorm';
import * as fs from 'fs';
import { DoctorLicense } from 'src/infrastructure/entities/doctor/doctor-license.entity';
import { plainToInstance } from 'class-transformer';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { Specialization } from 'src/infrastructure/entities/doctor/specialization.entity';

import { Client } from 'src/infrastructure/entities/client/client.entity';
import { ClientInfoRequest } from './dto/requests/client-info-request';
import { FamilyMemberRequest } from './dto/requests/family-member.request';
import { FamilyMember } from 'src/infrastructure/entities/client/family-member.entity';
import * as sharp from 'sharp';
import { ImageManager } from 'src/integration/sharp/image.manager';
import { StorageManager } from 'src/integration/storage/storage.manager';
import { toUrl } from 'src/core/helpers/file.helper';
import { User } from 'src/infrastructure/entities/user/user.entity';
import { DoctorAvaliablity } from 'src/infrastructure/entities/doctor/doctor-avaliablity.entity';
import { DoctorAvaliablityRequest } from './dto/requests/doctor-availbility-request';
import { Reservation } from 'src/infrastructure/entities/reservation/reservation.entity';
import { Clinic } from 'src/infrastructure/entities/doctor/clinc.entity';
import { UpdateDoctorInfoRequest } from './dto/requests/update-doctor-info.request';
import { UpdateProfileRequest } from '../authentication/dto/requests/update-profile-request';
import { ReservationStatus } from 'src/infrastructure/data/enums/reservation-status.eum';
import { Pharmacy } from 'src/infrastructure/entities/pharmacy/pharmacy.entity';
import { Nurse } from 'src/infrastructure/entities/nurse/nurse.entity';
import { NurseOrder } from 'src/infrastructure/entities/nurse/nurse-order.entity';
import { PhOrder } from 'src/infrastructure/entities/pharmacy/ph-order.entity';
import { addSpecilizationRequest } from './dto/requests/add-specilization.request';
import { EditSpecilizationRequest } from './dto/requests/edit-specilization.request';
@Injectable()
export class AdditionalInfoService {
  constructor(
    @InjectRepository(Doctor) private readonly doctorRepo: Repository<Doctor>,
    @InjectRepository(Specialization)
    private readonly specializationRepo: Repository<Specialization>,
    private readonly context: EntityManager,
    @Inject(REQUEST) private readonly request: Request,
    @Inject(ImageManager) private readonly imageManager: ImageManager,
    @Inject(StorageManager) private readonly storageManager: StorageManager,
  ) {}

  async getStatictics() {
    const doctors_count = await this.context.count(Doctor);
    const clients_count = await this.context.count(Client);

    const nurses_count = await this.context.count(Nurse, {});
    const pharmacy_count = await this.context.count(Pharmacy, {});
    const reservations_count = await this.context.count(Reservation, {});
    const nurse_order_count = await this.context.count(NurseOrder, {});
    const pharamcy_order_count = await this.context.count(PhOrder, {});
    return {
      doctors_count,
      clients_count,
      nurses_count,
      pharmacy_count,
      reservations_count,
      nurse_order_count,
      pharamcy_order_count,
    };
  }
  async getSpecilizations() {
    return await this.specializationRepo.find();
  }
  async addSpecilizations(req:addSpecilizationRequest) {
    return await this.specializationRepo.save(new Specialization({ ...req }));
  }
  async editSpecilizations(req:EditSpecilizationRequest) {
    return await this.specializationRepo.update(req.id,req);
  }
  async deleteSpecilizations(id:string) {
    return await this.specializationRepo.softDelete(id);
  }

  async updateProfile(request: UpdateProfileRequest) {
    const user = plainToInstance(
      User,
      { ...request, id: this.request.user.id },
      {},
    );

    if (request.avatarFile) {
      const resizedImage = await this.imageManager.resize(request.avatarFile, {
        size: { width: 300, height: 300 },
        options: {
          fit: sharp.fit.cover,
          position: sharp.strategy.entropy,
        },
      });
      const path = await this.storageManager.store(
        { buffer: resizedImage, originalname: request.avatarFile.originalname },
        { path: 'avatars' },
      );
      user.avatar = path;
    }
    await this.context.save(User, user);

    return await this.context.findOne(User, {
      where: { id: this.request.user.id },
    });
  }
  async addDoctorInfo(
    request: Partial<UpdateDoctorInfoRequest>,
    doctor_id?: string,
  ) {
    const id = (await this.getDoctor(doctor_id)).id;
    const doctor = plainToInstance(Doctor, { ...request, id });

    const docImages = request.license_images
      ? request.license_images.split(',')
      : [];

    if (request.year_of_experience)
      doctor.year_of_experience = request.year_of_experience;
    if (request.is_urgent != null) {
      if (doctor.is_busy == true) {
        throw new BadRequestException('Doctor is busy');
      } else doctor.is_urgent_doctor = request.is_urgent;
    }
    if (request.clinic != null) {
      const clinc =
        typeof request.clinic === 'string'
          ? plainToInstance(Clinic, JSON.parse(request.clinic))
          : request.clinic;

      if (doctor.clinic_id != null) {
        await this.context.update(Clinic, doctor.clinic_id, clinc);
      } else {
        const new_clinc = await this.context.save(Clinic, clinc);
        doctor.clinic = new_clinc;
      }
    }
    if (request.latitude && request.longitude) {
      (doctor.latitude = Number(request.latitude)),
        (doctor.longitude = Number(request.longitude));
    }

    if (request.specialization_id) {
      const specializations = await this.context.findOne(Specialization, {
        where: { id: request.specialization_id },
      });

      doctor.specialization_id = specializations.id;
    }

    if (request.license_images) {
      docImages.map((image) => {
        // check if image exists using fs
        const exists = fs.existsSync(image);
        if (!exists) throw new BadRequestException('Image not found');
      });

      // save shipping order images

      const images = docImages.map((image) => {
        // create shipping-images folder if not exists
        if (!fs.existsSync('storage/license-images')) {
          fs.mkdirSync('storage/license-images');
        }
        // store the future path of the image
        const newPath = image.replace('/tmp/', '/license-images/');

        // use fs to move images
        return new DoctorLicense({ image: newPath, doctor_id: doctor.id });
      });

      await this.context.save(images);

      docImages.map((image) => {
        const newPath = image.replace('/tmp/', '/license-images/');
        fs.renameSync(image, newPath);
      });
    }

    if (request.avaliablity) {
      const doctor_availiablity =
        typeof request.avaliablity === 'string'
          ? plainToInstance(DoctorAvaliablity, JSON.parse(request.avaliablity))
          : request.avaliablity;

      Promise.all(
        (doctor_availiablity as unknown as DoctorAvaliablity[]).map(
          async (e) =>
            await this.context.update(
              DoctorAvaliablity,
              { doctor_id: doctor.id, day: e.day },
              new DoctorAvaliablity({ ...e, doctor_id: doctor.id }),
            ),
        ),
      );

      // await this.context.save(DoctorAvaliablity, availability);
    }

    delete doctor.avaliablity;

    await this.doctorRepo.save(doctor);
    return this.getFullDoctor(doctor_id);
  }

  async deleteDoctorLicense(id: string) {
    const license = await this.context.findOne(DoctorLicense, {
      where: { id },
    });
    fs.unlinkSync(license.image);
    await this.context.remove(DoctorLicense, license);
    return license;
  }

  async getDoctor(id?: string) {
    const doctor = await this.doctorRepo.findOne({
      where: { user_id: id == null ? this.request.user.id : id },
      // relations: { specialization: true, licenses: true },
      // select: { licenses: { id: true, image: true } },
    });

    if (doctor.licenses) doctor.licenses.map((e) => (e.image = toUrl(e.image)));
    return doctor;
  }
  async getFullDoctor(id?: string) {
    const doctor = await this.doctorRepo.findOne({
      where: { user_id: id == null ? this.request.user.id : id },
      relations: {
        specialization: true,
        licenses: true,
        avaliablity: true,
        clinic: true,
      },
      select: {
        licenses: { id: true, image: true },
        avaliablity: {
          id: true,
          day: true,
          start_at: true,
          end_at: true,
          is_active: true,
        },
      },
    });

    if (doctor.licenses) doctor.licenses.map((e) => (e.image = toUrl(e.image)));
    return doctor;
  }

  async addClientInfo(req: ClientInfoRequest) {
    const clinet = await this.getClientInfo();
    await this.context.update(
      Client,
      clinet.id,
      plainToInstance(Client, {
        user_id: this.request.user.id,
        ...req,
      }),
    );
    return await this.getClientInfo();
  }

  async addFamilyMembers(req: FamilyMemberRequest) {
    const client = await this.getClientInfo();

    const familyMember = await this.context.save(
      plainToInstance(FamilyMember, {
        ...req,
        client_id: client.id,
      }),
    );
    if (req.avatarFile) {
      // resize image to 300x300
      const resizedImage = await this.imageManager.resize(req.avatarFile, {
        size: { width: 300, height: 300 },
        options: {
          fit: sharp.fit.cover,
          position: sharp.strategy.entropy,
        },
      });

      // save image
      const path = await this.storageManager.store(
        { buffer: resizedImage, originalname: req.avatarFile.originalname },
        { path: 'avatars' },
      );

      // set avatar path
      familyMember.avatar = path;
    }

    const savedMember = await this.context.save(familyMember);

    return await this.context.findOneBy(FamilyMember, {
      id: savedMember.id,
    });
  }

  async getClientInfo() {
    return await this.context.findOneBy(Client, {
      user_id: this.request.user.id,
    });
  }

  async getFamilyMembers() {
    const client = await this.getClientInfo();
    return (
      await this.context.find(FamilyMember, { where: { client_id: client.id } })
    ).map((member) => {
      member.avatar == null ? null : (member.avatar = toUrl(member.avatar));
      return member;
    });
  }

  async getDoctorAvailiablity(req: DoctorAvaliablityRequest) {
    const freeTime = await this.getDoctorAvailiablityDay(req);

    const busyTimes = await this.getDoctorBusyTimes(req);
    return {
      availavility: freeTime,
      occupied_at: busyTimes,
    };
  }
  async getDoctorAvailiablityDay(query: DoctorAvaliablityRequest) {
    return await this.context.find(DoctorAvaliablity, {
      where: { day: query.day, doctor_id: query.doctor_id, is_active: true },
      select: { start_at: true, end_at: true },
    });
  }

  async getDoctorBusyTimes(query: DoctorAvaliablityRequest) {
    const start_date = query.date.toISOString().split('T')[0];
    const start_time = query.date.getUTCHours() + query.date.getMinutes() / 60;

    const busyTimes = await this.context.find(Reservation, {
      where: {
        start_day: start_date,
        // start_time: start_time,
        status: Not(ReservationStatus.CANCELED),
        doctor_id: query.doctor_id,
      },
    });
    const result = busyTimes.map((e) => e.start_time);
    return result;
  }

  async getProfile() {
    return await this.context.findOneBy(User, {
      id: this.request.user.id,
    });
  }
}
