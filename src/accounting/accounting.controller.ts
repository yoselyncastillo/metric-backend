import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AccountingService } from './accounting.service';
import { CreateAccountingDto } from './dto/create-accounting.dto';
import { UpdateAccountingDto } from './dto/update-accounting.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../auth/entities/user.entity';

@Auth()
@Controller('accounting')
export class AccountingController {
  constructor(private readonly accountingService: AccountingService) {}

  @Post()
  create(@Body() createAccountingDto: CreateAccountingDto, @GetUser() user: User) {
    return this.accountingService.create(createAccountingDto, user);
  }

  @Get()
  findAll(@GetUser() user: User) {
    return this.accountingService.findAll(user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @GetUser() user: User) {
    return this.accountingService.findOne(+id, user);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAccountingDto: UpdateAccountingDto, @GetUser() user: User) {
    return this.accountingService.update(+id, updateAccountingDto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @GetUser() user: User) {
    return this.accountingService.remove(+id, user);
  }
}
