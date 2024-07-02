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
import { addSpecilizationRequest } from './dto/requests/add-specilization.request';
import { EditSpecilizationRequest } from './dto/requests/edit-specilization.request';
import { REQUEST } from '@nestjs/core';
import { Request, query } from 'express';
import { GetUserRequest } from './dto/requests/get-user.request';
import { Index } from 'typeorm';

@ApiTags('Additonal-info')
@ApiHeader({
  name: 'Accept-Language',
  required: false,
  description: 'Language header: en, ar',
})
// @UseGuards(JwtAuthGuard, RolesGuard)
// @ApiBearerAuth()
// @Roles(Role.ADMIN, Role.PHARMACY, Role.CLIENT, Role.NURSE,Role.DOCTOR)
@Controller('additional-info')
export class AdditionalInfoController {
  constructor(
    private readonly additionalInfoService: AdditionalInfoService,
    @Inject(I18nResponse) private readonly _i18nResponse: I18nResponse,
    private readonly nurseService: NurseOrderService,
    private readonly PharmacyService: PharmacyService,
    @Inject(REQUEST) private readonly _request: Request,
  ) {}
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Get('statictics')
  async getStatictics() {
    return new ActionResponse(await this.additionalInfoService.getStatictics());
  }
  @Get('specializations')
  async getSpecilizations() {
    const specializations =
      await this.additionalInfoService.getSpecilizations();
    const data = this._i18nResponse.entity(await this.additionalInfoService.getSpecilizations()).map((e) => {
      return {
        ...e,
        name_ar: specializations.find((s) => s.id == e.id).name_ar,
        name_en: specializations.find((s) => s.id == e.id).name_en,
      };
    });
    return new ActionResponse(data);
    
    
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Post('specializations')
  async addSpecilizations(@Body() request: addSpecilizationRequest) {
    return new ActionResponse(
      await this.additionalInfoService.addSpecilizations(request),
    );
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Put('specializations')
  async editSpecilizations(@Body() request: EditSpecilizationRequest) {
    return new ActionResponse(
      await this.additionalInfoService.editSpecilizations(request),
    );
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Delete('specializations/:id')
  async deleteSpecilizations(@Param('id') id: string) {
    return new ActionResponse(
      await this.additionalInfoService.deleteSpecilizations(id),
    );
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(Role.DOCTOR, Role.ADMIN)
  @Put('doctor/info')
  async addDoctorInfo(
    @Query() query: GetUserRequest,
    @Body() request: UpdateDoctorInfoRequest,
  ) {
    return new ActionResponse(
      await this.additionalInfoService.addDoctorInfo(request, query.id),
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(Role.DOCTOR, Role.ADMIN)
  @Delete('doctor-license/:id')
  async deleteDoctorLicense(@Param('id') id: string) {
    return new ActionResponse(
      await this.additionalInfoService.deleteDoctorLicense(id),
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(Role.DOCTOR, Role.ADMIN)
  @Get('doctor/info')
  async getDoctorInfo(@Query() query: GetUserRequest) {
    return new ActionResponse(
      this._i18nResponse.entity(
        await this.additionalInfoService.getFullDoctor(query.id),
      ),
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(Role.CLIENT, Role.ADMIN)
  @Put('client/info')
  async addClientInfo(
    @Query() query: GetUserRequest,
    @Body() request: ClientInfoRequest,
  ) {
    return new ActionResponse(
      await this.additionalInfoService.addClientInfo(request, query.id),
    );
  }

  @UseInterceptors(ClassSerializerInterceptor, FileInterceptor('avatarFile'))
  @ApiConsumes('multipart/form-data')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(Role.CLIENT,Role.ADMIN)
  @Post('client/family-members')
  async addFamilyMeber(
    @Query() query: GetUserRequest,
    @Body() request: FamilyMemberRequest,
    @UploadedFile(new UploadValidator().build())
    avatarFile: Express.Multer.File,
  ) {
    if (avatarFile) {
      request.avatarFile = avatarFile;
    }
    return new ActionResponse(
      await this.additionalInfoService.addFamilyMembers(query.id, request),
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(Role.CLIENT,Role.ADMIN)
  @Get('client/family-members')
  async getFamilyMembers(@Query() query: GetUserRequest) {
    return new ActionResponse(
      await this.additionalInfoService.getFamilyMembers(query.id),
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(Role.CLIENT,Role.ADMIN)
  @Get('client/info')
  async getClientInfo(@Query() query: GetUserRequest) {
    return new ActionResponse(
      await this.additionalInfoService.getClientInfo(query.id),
    );
  }
  @UseInterceptors(ClassSerializerInterceptor, FileInterceptor('avatarFile'))
  @ApiConsumes('multipart/form-data')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Put('update-profile')
  async updateProfile(
    @Query() query: GetUserRequest,
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
        await this.additionalInfoService.updateProfile(query.id, request),
        {
          excludeExtraneousValues: true,
        },
      ),
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Get('profile')
  async getProfile(@Query() query: GetUserRequest) {
    return new ActionResponse(
      plainToInstance(
        RegisterResponse,
        await this.additionalInfoService.getProfile(query.id),
        {
          excludeExtraneousValues: true,
        },
      ),
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.NURSE,Role.ADMIN)
  @ApiBearerAuth()
  @Put('update-nurse-info')
  async updateInfo(
    @Query() query: GetUserRequest,
    @Body() request: UpdateNurseRequest,
  ) {
    return new ActionResponse(
      await this.nurseService.addNurse(
        request,
        query.id ?? this.nurseService.currentUser.id,
      ),
    );
  }

  @Delete('delete-nurse-license/:id')
  async deleteNurseLicense(@Param('id') id: string) {
    return new ActionResponse(await this.nurseService.deleteLicense(id));
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(Role.NURSE,Role.ADMIN)
  @Get('nurse-info')
  async getNurseInfo(@Query() query: GetUserRequest) {
    const nurse = await this.nurseService.getNurse(
      query.id ?? this.nurseService.currentUser.id,
    );
    nurse.license_images.map((img) => {
      img.image = toUrl(img.image);
      return img;
    });
    nurse.rating = Number(nurse.rating) / nurse.number_of_reviews;
    delete nurse.number_of_reviews;
    return new ActionResponse(nurse);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(Role.PHARMACY,Role.ADMIN)
  @Put('update-pharmacy-info')
  async updatePharmacy(
    @Query() query: GetUserRequest,
    @Body() request: UpdatePharamcyRequest,
  ) {
    return new ActionResponse(
      await this.PharmacyService.addPharmacyInfo(
        request,
        query.id ?? this.PharmacyService.currentUser.id,
      ),
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(Role.PHARMACY,Role.ADMIN)
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
  @Roles(Role.PHARMACY,Role.ADMIN)
  @Get('pharmacy-info')
  async getPharmacyInfo(@Query() query: GetUserRequest) {
    const pharamcy = await this.PharmacyService.getPharmacyInfo(
      query.id ?? this.PharmacyService.currentUser.id,
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

  @Get('doctor/availability')
  async getDoctorAvailability(@Query() query: DoctorAvaliablityRequest) {
    return new ActionResponse(
      await this.additionalInfoService.getDoctorAvailiablity(query),
    );
  }
}
