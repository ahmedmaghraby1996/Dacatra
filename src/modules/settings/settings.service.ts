import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SettingsTypes } from 'src/infrastructure/data/enums/settings.enum';
import { AppSettings } from 'src/infrastructure/entities/settings/setting.entity';
import { Repository } from 'typeorm/repository/Repository';
import { EditSettingsRequest } from './dto/edit-settings.request';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(AppSettings) public _repo: Repository<AppSettings>,
  ) {}

  async getAppSettings(type: SettingsTypes) {
    return await this._repo.findOneBy({ type: type });
  }

  async editSettings(data: EditSettingsRequest) {
    const setting = await this._repo.findOneBy({ type: data.type });
    return await this._repo.update(setting.id,data);
  }
}
