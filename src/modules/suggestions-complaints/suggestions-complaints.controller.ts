import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { SuggestionsComplaintsService } from './suggestions-complaints.service';
import { ActionResponse } from 'src/core/base/responses/action.response';
import { SuggestionsComplaints } from 'src/infrastructure/entities/suggestions-complaints/suggestions-complaints.entity';
import { SuggestionsComplaintsRequest } from './dto/suggestions-complaints.request';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../authentication/guards/roles.decorator';
import { Role } from 'src/infrastructure/data/enums/role.enum';
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard';
import { RolesGuard } from '../authentication/guards/roles.guard';

@ApiTags('Suggestions-complaints')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.PHARMACY, Role.CLIENT, Role.DOCTOR,Role.NURSE)
@ApiBearerAuth()
@Controller('suggestions-complaints')
export class SuggestionsComplaintsController {
  constructor(
    private readonly suggestionsComplaintsService: SuggestionsComplaintsService,
  ) {}

  @Get()
  async getAllSuggestionsComplaints() {
    const result =
      await this.suggestionsComplaintsService.getSuggestionsComplaints();
    return new ActionResponse<SuggestionsComplaints[]>(result);
  }
  @Post()
  async createSuggestionsComplaints(@Body() suggestionsComplaintsRequest:SuggestionsComplaintsRequest) {
    const result =
      await this.suggestionsComplaintsService.createSuggestionsComplaints(suggestionsComplaintsRequest);
    return new ActionResponse<SuggestionsComplaints>(result);
  }

}
