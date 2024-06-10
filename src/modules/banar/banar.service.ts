import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseService } from 'src/core/base/service/service.base';
import {
  LessThan,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { Banar } from 'src/infrastructure/entities/banar/banar.entity';
import { CreateBanarRequest } from './dto/request/create-banar.request';
import { FileService } from '../file/file.service';
import { UploadFileRequest } from '../file/dto/requests/upload-file.request';
import { UpdateBannerRequest } from './dto/request/update-banner.request';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { Role } from 'src/infrastructure/data/enums/role.enum';

@Injectable()
export class BanarService extends BaseService<Banar> {
  constructor(
    @InjectRepository(Banar)
    private readonly banarRepository: Repository<Banar>,
    @Inject(FileService) private _fileService: FileService,
    @Inject(REQUEST) private request: Request,
  ) {
    super(banarRepository);
  }

  async createBanar(banar: CreateBanarRequest) {
    const tempImage = await this._fileService.upload(banar.banar, `banars`);

    let createdBanar = this.banarRepository.create({
      banar: tempImage,
       description: banar.description,
       doctor_id: banar.doctor_id,
      started_at: banar.started_at,
      ended_at: banar.ended_at,
      is_active: banar.is_active,
    });

    return await this.banarRepository.save(createdBanar);
  }

  async getBanars() {
    return await this.banarRepository.find(
      this.request.user.roles.includes(Role.ADMIN)
        ? null
        : {
            where: [
              {
                is_active: true,
                started_at: LessThanOrEqual(new Date()),
                ended_at: MoreThanOrEqual(new Date()),
              },
            ],
          },
    );
  }

  async updateBanar(id: string, banar: UpdateBannerRequest) {
    let tempImage = null;
    const banarEntity = await this.banarRepository.findOne({ where: { id } });
    if (!banarEntity) {
      throw new NotFoundException('Banar not found');
    }

    if (banar.banar) {
      tempImage = await this._fileService.upload(banar.banar, `banars`);
    }

    Object.assign(banarEntity, {
      banar: banar.banar ? tempImage : banarEntity.banar,
      started_at: banar.started_at ? banar.started_at : banarEntity.started_at,
      ended_at: banar.ended_at ? banar.ended_at : banarEntity.ended_at,
      is_active: banar.is_active ? banar.is_active : banarEntity.is_active,
    });

    return await this.banarRepository.save(banarEntity);
  }

  async deleteBanar(id: string) {
    const banar = await this.banarRepository.findOne({ where: { id } });
    if (!banar) {
      throw new NotFoundException('Banar not found');
    }
    return await this.banarRepository.remove(banar);
  }
}
