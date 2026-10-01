import { Controller, Get, Post, Body, Patch, Param, Query } from '@nestjs/common';
import { ClosuresService } from './closures.service';
import { CreateClosureDto } from './dto/create-closure.dto';
import { PreviewClosureDto } from './dto/preview-closure.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../auth/entities/user.entity';

@Controller('closures')
@Auth()
export class ClosuresController {
  constructor(private readonly closuresService: ClosuresService) {}

  @Get()
  findAll(@GetUser() user: User) {
    return this.closuresService.findAll(user);
  }

  @Get('preview')
  preview(@Query() query: PreviewClosureDto, @GetUser() user: User) {
    return this.closuresService.previewClosure(query, user);
  }

  @Post()
  create(@Body() createClosureDto: CreateClosureDto, @GetUser() user: User) {
    return this.closuresService.createClosure(createClosureDto, user);
  }

  @Patch(':id/tithe')
  markTithe(@Param('id') id: string, @GetUser() user: User) {
    return this.closuresService.markTithePaid(+id, user);
  }

  @Patch(':id/offering')
  markOffering(@Param('id') id: string, @GetUser() user: User) {
    return this.closuresService.markOfferingPaid(+id, user);
  }
}
