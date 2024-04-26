import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AdditionalInfoService } from './additional-info.service';
import { DoctorInfoRequest } from './dto/requests/doctor-info-request';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiHeader,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../authentication/guards/roles.decorator';
import { Role } from 'src/infrastructure/data/enums/role.enum';
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard';
import { RolesGuard } from '../authentication/guards/roles.guard';
import { ActionResponse } from 'src/core/base/responses/action.response';
import { I18nResponse } from 'src/core/helpers/i18n.helper';
import { FamilyMemberRequest } from './dto/requests/family-member.request';
import { ClientInfoRequest } from './dto/requests/client-info-request';
import { UploadValidator } from 'src/core/validators/upload.validator';
import { FileInterceptor } from '@nestjs/platform-express';
import { DoctorAvaliablityRequest } from './dto/requests/doctor-availbility-request';
import { UpdateDoctorInfoRequest } from './dto/requests/update-doctor-info.request';
import { UpdateProfileRequest } from '../authentication/dto/requests/update-profile-request';
import { plainToInstance } from 'class-transformer';
import { RegisterResponse } from '../authentication/dto/responses/register.response';
import { UpdateNurseRequest } from '../nurse/dto/request/update-nurse-request';
import { NurseOrderService } from '../nurse/nurse.service';
import { PharmacyService } from '../pharmacy/pharmacy.service';
import { UpdatePharamcyRequest } from '../pharmacy/dto/request/update-pharmact-request';
import { PharmacyResponse } from '../pharmacy/dto/respone/pharmacy.reposne';
import { toUrl } from 'src/core/helpers/file.helper';

@ApiTags('Additonal-info')
@ApiHeader({
  name: 'Accept-Language',
  required: false,
  description: 'Language header: en, ar',
})
@Controller('additional-info')
export class AdditionalInfoController {
  constructor(
    private readonly additionalInfoService: AdditionalInfoService,
    @Inject(I18nResponse) private readonly _i18nResponse: I18nResponse,
    private readonly nurseService: NurseOrderService,
    private readonly PharmacyService: PharmacyService,
  ) {}

  @Get('specializations')
  async getSpecilizations() {
    const specializations =
      await this.additionalInfoService.getSpecilizations();
    return new ActionResponse(this._i18nResponse.entity(specializations));
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(Role.DOCTOR)
  @Put('doctor/info')
  async addDoctorInfo(@Body() request: UpdateDoctorInfoRequest) {
    return new ActionResponse(
      await this.additionalInfoService.addDoctorInfo(request),
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(Role.DOCTOR)
  @Delete('doctor-license/:id')
  async deleteDoctorLicense(@Param('id') id: string) {
    return new ActionResponse(
      await this.additionalInfoService.deleteDoctorLicense(id),
    )
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(Role.DOCTOR)
  @Get('doctor/info')
  async getDoctorInfo() {
    return new ActionResponse(
      this._i18nResponse.entity(
        await this.additionalInfoService.getFullDoctor(),
      ),
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(Role.CLIENT)
  @Put('client/info')
  async addClientInfo(@Body() request: ClientInfoRequest) {
    return new ActionResponse(
      await this.additionalInfoService.addClientInfo(request),
    );
  }

  @UseInterceptors(ClassSerializerInterceptor, FileInterceptor('avatarFile'))
  @ApiConsumes('multipart/form-data')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(Role.CLIENT)
  @Post('client/family-members')
  async addFamilyMeber(
    @Body() request: FamilyMemberRequest,
    @UploadedFile(new UploadValidator().build())
    avatarFile: Express.Multer.File,
  ) {
    if (avatarFile) {
      request.avatarFile = avatarFile;
    }
    return new ActionResponse(
      await this.additionalInfoService.addFamilyMembers(request),
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(Role.CLIENT)
  @Get('client/family-members')
  async getFamilyMembers() {
    return new ActionResponse(
      await this.additionalInfoService.getFamilyMembers(),
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(Role.CLIENT)
  @Get('client/info')
  async getClientInfo() {
    return new ActionResponse(await this.additionalInfoService.getClientInfo());
  }
  @UseInterceptors(ClassSerializerInterceptor, FileInterceptor('avatarFile'))
  @ApiConsumes('multipart/form-data')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Put('update-profile')
  async updateProfile(
    @Body() request: UpdateProfileRequest,
    @UploadedFile(new UploadValidator().build())
    avatarFile: Express.Multer.File,
  ) {
    if (avatarFile) {
      request.avatarFile = avatarFile;
    }
    return new ActionResponse(
      plainToInstance(
        RegisterResponse,
        await this.additionalInfoService.updateProfile(request),
        {
          excludeExtraneousValues: true,
        },
      ),
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Get('profile')
  async getProfile() {
    return new ActionResponse(
      plainToInstance(
        RegisterResponse,
        await this.additionalInfoService.getProfile(),
        {
          excludeExtraneousValues: true,
        },
      ),
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.NURSE)
  @ApiBearerAuth()
  @Put('update-nurse-info')
  async updateInfo(@Body() request: UpdateNurseRequest) {
    return new ActionResponse(
      await this.nurseService.addNurse(
        request,
        this.nurseService.currentUser.id,
      ),
    );
  }

  @Delete('delete-nurse-license/:id')
  async deleteNurseLicense(@Param('id') id: string) {
    return new ActionResponse(await this.nurseService.deleteLicense(id));
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(Role.NURSE)
  @Get('nurse-info')
  async getNurseInfo() {
    const nurse = await this.nurseService.getNurse(
      this.nurseService.currentUser.id,
    );
    nurse.license_images.map((img) => {
      img.image = toUrl(img.image); 
      return img;
    });
    nurse.rating= Number(nurse.rating)/nurse.number_of_reviews
    delete nurse.number_of_reviews;
    return new ActionResponse(nurse);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(Role.PHARMACY)
  @Put('update-pharmacy-info')
  async updatePharmacy(@Body() request: UpdatePharamcyRequest) {
    return new ActionResponse(
      await this.PharmacyService.addPharmacyInfo(
        request,
        this.PharmacyService.currentUser.id,
      ),
    );
  }


  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(Role.PHARMACY)
  @Delete('delete-pharmacy-license/:id')
  async deletePharmacyLicense(@Param('id') id: string) {
    return new ActionResponse(await this.PharmacyService.deleteLicense(id));
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(Role.PHARMACY)
  @Delete('delete-pharmacy-logo/:id')
  async deletePharmacyLogo(@Param('id') id: string) {
    return new ActionResponse(await this.PharmacyService.deleteLog(id));
  }



  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(Role.PHARMACY)
  @Get('pharmacy-info')
  async getPharmacyInfo() {
    const pharamcy = await this.PharmacyService.getPharmacyInfo(
      this.PharmacyService.currentUser.id,
    );

    const categories = await this.PharmacyService.getCategories(
      pharamcy.categories == null ? [] : pharamcy.categories,
    );

    return new ActionResponse(
      this._i18nResponse.entity(
        plainToInstance(
          PharmacyResponse,
          { ...pharamcy, categories: categories },
          { excludeExtraneousValues: true },
        ),
      ),
    );
  }

  @Roles(Role.DOCTOR)
  @Get('doctor/availability')
  async getDoctorAvailability(@Query() query: DoctorAvaliablityRequest) {
    return new ActionResponse(
      await this.additionalInfoService.getDoctorAvailiablity(query),
    );
  }
}
