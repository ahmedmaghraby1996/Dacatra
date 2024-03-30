import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseUserService } from 'src/core/base/service/user-service.base';
import { Doctor } from 'src/infrastructure/entities/doctor/doctor.entity';
import { Repository } from 'typeorm';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
@Injectable()
export class DoctorService extends BaseUserService<Doctor> {
  constructor(
    @InjectRepository(Doctor) private readonly repository: Repository<Doctor>,
    @Inject(REQUEST) request: Request,
  ) {
    super(repository, request);
  }

  async findOne(id: string) {
   

    return await this.repository.findOne({
      where: { id },
      relations: { user: true, specialization: true, clinic: true },
    });
  }
}
