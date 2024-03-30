import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard';
import { RolesGuard } from '../authentication/guards/roles.guard';
import { ActionResponse } from 'src/core/base/responses/action.response';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';
import { UpdateFcmRequest } from './dto/requests/update-fcm.request';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { PaginatedResponse } from 'src/core/base/responses/paginated.response';
import { PaginatedRequest } from 'src/core/base/requests/paginated.request';
import { plainToInstance } from 'class-transformer';
import { RegisterResponse } from '../authentication/dto/responses/register.response';

@ApiBearerAuth()
@ApiHeader({
  name: 'Accept-Language',
  required: false,
  description: 'Language header: en, ar',
})
@UseGuards(JwtAuthGuard)
@ApiTags('Users')
@Controller('user')
export class UserController {
  constructor(
    private userService: UserService,
    @Inject(REQUEST) private request: Request,
  ) {}


  @Get()
  async findAll(@Query() query: PaginatedRequest){
    const users = await this.userService.findAll(query);
    const data = plainToInstance(RegisterResponse, users, { excludeExtraneousValues: true });
    if (query.page && query.limit) {
      const total = await this.userService.count(query);
      return new PaginatedResponse(data, { meta: { total, ...query } });
    } else {
      return new ActionResponse(data);
    }
  }

  //update fcm token
  @Put('/fcm-token')
  async updateFcmToken(@Body() req: UpdateFcmRequest) {
    const user = await this.userService.findOne(this.request.user.id);
    user.fcm_token = req.fcm_token;
    await this.userService.update(user);
    return new ActionResponse(
      await this.userService.findOne(this.request.user.id),
    );
  }

  //update fcm token
  @Delete('/delete')
  async deleteUser() {
    return new ActionResponse(
      await this.userService.deleteUser(this.request.user.id),
    );
  }
}
