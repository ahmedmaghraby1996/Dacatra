import { JwtService } from '@nestjs/jwt';
import { BadRequestException, Injectable } from '@nestjs/common';
import { LoginRequest } from './dto/requests/signin.dto';
import { Inject } from '@nestjs/common/decorators';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { RegisterRequest } from './dto/requests/register.dto';
import { SendOtpRequest } from './dto/requests/send-otp.dto';
import { VerifyOtpRequest } from './dto/requests/verify-otp.dto';
import { RegisterUserTransaction } from './transactions/register-user.transaction';
import { SendOtpTransaction } from './transactions/send-otp.transaction';
import { UserService } from '../user/user.service';
import { VerifyOtpTransaction } from './transactions/verify-otp.transaction';
import { jwtSignOptions } from 'src/core/setups/jwt.setup';
import { AdditionalInfoService } from '../additional-info/additional-info.service';
import { Role } from 'src/infrastructure/data/enums/role.enum';
import { Doctor } from 'src/infrastructure/entities/doctor/doctor.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { PharmacyService } from '../pharmacy/pharmacy.service';
import { NurseOrderService } from '../nurse/nurse.service';
import { Wallet } from 'src/infrastructure/entities/wallet/wallet.entity';

@Injectable()
export class AuthenticationService {
  constructor(
    @Inject(UserService) private readonly userService: UserService,
    @InjectRepository(Doctor) private readonly doctorRepo: Repository<Doctor>,
    @Inject(RegisterUserTransaction)
    private readonly registerUserTransaction: RegisterUserTransaction,
    @Inject(SendOtpTransaction)
    private readonly sendOtpTransaction: SendOtpTransaction,
    @Inject(VerifyOtpTransaction)
    private readonly verifyOtpTransaction: VerifyOtpTransaction,
    @Inject(JwtService) private readonly jwtService: JwtService,
    @Inject(PharmacyService) private readonly pharmacyService: PharmacyService,
    @Inject(NurseOrderService) private readonly nurseService: NurseOrderService,
    @InjectRepository(Wallet) private readonly walletRepo: Repository<Wallet>,
    @Inject(AdditionalInfoService)
    private readonly additonalService: AdditionalInfoService,
    @Inject(ConfigService) private readonly _config: ConfigService,
  ) {}

  async validateUser(req: LoginRequest): Promise<any> {
    const user = await this.userService.findOne([
      { email: req.username },
      { username: req.username },
      { phone: req.username },
    ] as any);
    let isMatch = false;
    if (user) {
      isMatch = await bcrypt.compare(
        req.password + this._config.get('app.key'),
        user.password,
      );
    }
    if (user && isMatch) {
      return user;
    }
    return null;
  }

  async login(user: any) {
    if (!user) throw new BadRequestException('message.invalid_credentials');
    const payload = { username: user.username, sub: user.id };
    return {
      ...user,
      access_token: this.jwtService.sign(payload, jwtSignOptions(this._config)),
    };
  }

  async register(req: any) {
    const user = await this.registerUserTransaction.run(req);
    
    if (req.role == Role.DOCTOR) {
      try {
        await this.additonalService.addDoctorInfo(req, user.id);
      } catch (e) {
        await this.userService.delete(user.id);

        throw new BadRequestException(e);
      }
    }
    if (req.role == Role.PHARMACY) {
      try {
        await this.pharmacyService.addPharmacyInfo(req, user.id);
      } catch (e) {
        await this.userService.delete(user.id);

        throw new BadRequestException(e);
      }
    }
    if (req.role == Role.NURSE) {
      try {
        await this.nurseService.addNurse(req, user.id);
      } catch (e) {
        await this.userService.delete(user.id);

        throw new BadRequestException(e);
      }
    }
    await this.walletRepo.save(new Wallet({ user_id: user.id }));
    
    return user;
  }

  async sendOtp(req: SendOtpRequest) {
    return await this.sendOtpTransaction.run(req);
  }

  async verifyOtp(req: VerifyOtpRequest) {
    return await this.verifyOtpTransaction.run(req);
  }
}
