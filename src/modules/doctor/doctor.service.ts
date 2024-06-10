import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseUserService } from 'src/core/base/service/user-service.base';
import { Doctor } from 'src/infrastructure/entities/doctor/doctor.entity';
import { Repository } from 'typeorm';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { DoctorLicense } from 'src/infrastructure/entities/doctor/doctor-license.entity';
@Injectable()
export class DoctorService extends BaseUserService<Doctor> {
  constructor(
    @InjectRepository(Doctor) private readonly repository: Repository<Doctor>,
    @Inject(REQUEST) request: Request,
  ) {
    super(repository, request);
  }
  async acceptDoctor(id: string) {
    const doctor = await this.repository.findOne({ where: { user_id: id } });
    doctor.is_verified = true;
   return await this.repository.save(doctor);
  }

  async findOne(id: string) {
   

    return await this.repository.findOne({
      where: { id },
      relations: { user: true, specialization: true, clinic: true  ,licenses:true,avaliablity:true, },
    });
  }
}
