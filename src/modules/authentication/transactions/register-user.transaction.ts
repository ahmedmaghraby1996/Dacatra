import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource, EntityManager } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { RegisterRequest } from '../dto/requests/register.dto';
import { User } from 'src/infrastructure/entities/user/user.entity';
import { randStr } from 'src/core/helpers/cast.helper';
import { BaseTransaction } from 'src/core/base/database/base.transaction';
import { ImageManager } from 'src/integration/sharp/image.manager';
import * as sharp from 'sharp';
import { StorageManager } from 'src/integration/storage/storage.manager';
import { Role } from 'src/infrastructure/data/enums/role.enum';
import { Doctor } from 'src/infrastructure/entities/doctor/doctor.entity';
import { plainToInstance } from 'class-transformer';
import { Client } from 'src/infrastructure/entities/client/client.entity';
import { DoctorAvaliablity } from 'src/infrastructure/entities/doctor/doctor-avaliablity.entity';
import { Wallet } from 'src/infrastructure/entities/wallet/wallet.entity';

@Injectable()
export class RegisterUserTransaction extends BaseTransaction<
  RegisterRequest,
  
  User
> {
  constructor(
    dataSource: DataSource,
    @Inject(ConfigService) private readonly _config: ConfigService,
    @Inject(StorageManager) private readonly storageManager: StorageManager,
    @Inject(ImageManager) private readonly imageManager: ImageManager,
  ) {
    super(dataSource);
  }

  // the important thing here is to use the manager that we've created in the base class
  protected async execute(
    req: RegisterRequest,
 
    context: EntityManager,
  ): Promise<User> {
    try {
      // upload avatar
      const user = new User(req);
      // upload avatar
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
        console.log(path);
        // set avatar path
        user.avatar = path;
      }
      // encrypt password
      const randomPassword = randStr(12);
      user.password = await bcrypt.hash(
        randomPassword + this._config.get('app.key'),
        10,
      );
      user.username = user.phone;
      // set user role
      user.roles = [req.role];
      // save user
      const savedUser = await context.save(User, user);


      // create driver setting if user is a driver
      if (req.role == Role.DOCTOR) {
        const doctordata = plainToInstance(Doctor, req);
        delete doctordata['avaliablity'];
        const doctor = new Doctor({ ...doctordata, user_id: user.id,is_verified:false });

        await context.save(doctor);
        for (let index = 1; index < 8; index++) {
          await context.save(DoctorAvaliablity, {
            doctor_id: doctor.id,
            day: index,
            start_at: 0,
            end_at: 0,
          });
          1;
        }
      }
      if (req.role == Role.CLIENT) {
        const client = new Client({ user_id: user.id });
        console.log(client);
        await context.save(client);
      }


      // return user
      return savedUser;
    } catch (error) {
      throw new BadRequestException(
        this._config.get('app.env') !== 'prod'
          ? error
          : 'message.register_failed',
      );
    }
  }
}
