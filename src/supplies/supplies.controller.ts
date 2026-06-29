import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseFloatPipe,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SuppliesService } from './supplies.service';
import { CreateBatchDto } from './dto/create-batch.dto';
import { ConsumeTestDto } from './dto/consume-test.dto';
import { CreateSupplyDto } from './dto/create-supply.dto';
import { CreateUnitConversionDto } from './dto/create-unit-conversion.dto';
import { UpdateSupplyDto } from './dto/update-supply.dto';
import { UpdateUnitConversionDto } from './dto/update-unit-conversion.dto';
import { CreateSupplyFormatDto } from './dto/create-supply-format.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../auth/entities/user.entity';

@Auth()
@Controller('supplies')
export class SuppliesController {
  constructor(private readonly suppliesService: SuppliesService) { }

  @Post()
  create(@Body() createSupplyDto: CreateSupplyDto, @GetUser() user: User) {
    return this.suppliesService.create(createSupplyDto, user);
  }

  @Get()
  findAll(@GetUser() user: User) {
    return this.suppliesService.findAll(user);
  }

  @Post('formats')
  createFormat(@Body() createFormatDto: CreateSupplyFormatDto, @GetUser() user: User) {
    return this.suppliesService.createFormat(createFormatDto, user);
  }

  @Post(':id/batches')
  addBatch( 
    @Param('id') id: string,
    @Body() createBatchDto: CreateBatchDto,
    @GetUser() user: User
  ) {
    return this.suppliesService.addBatch(+id, createBatchDto, user);
  }

  @Post(':id/conversions')
  addConversion(
    @Param('id') id: string,
    @Body() dto: CreateUnitConversionDto,
    @GetUser() user: User
  ) {
    return this.suppliesService.addConversion(+id, dto, user);
  }

  @Patch('conversions/:conversionId')
  updateConversion(
    @Param('conversionId', ParseIntPipe) conversionId: number,
    @Body() dto: UpdateUnitConversionDto,
    @GetUser() user: User
  ) {
    return this.suppliesService.updateConversion(conversionId, dto, user);
  }

  @Delete('conversions/:conversionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeConversion(
    @Param('conversionId', ParseIntPipe) conversionId: number,
    @GetUser() user: User
  ) {
    await this.suppliesService.removeConversion(conversionId, user);
  }

  @Post(':id/consume-test')
  consumeTest(@Param('id') id: string, @Body() body: ConsumeTestDto, @GetUser() user: User) {
    return this.suppliesService.processConsumption(
      +id,
      body.quantity,
      user,
      body.execute,
    );
  }

  @Get(':id/pricing')
  getPricing(
    @Param('id') id: string,
    @Query('quantity', new ParseFloatPipe({ optional: false }))
    quantity: number,
    @GetUser() user: User
  ) {
    return this.suppliesService.getSupplyPricing(+id, quantity, user);
  }

  @Get(':id/convert-test')
  convertTest(
    @Param('id') id: string,
    @Query('amount', new ParseFloatPipe({ optional: false }))
    amount: number,
    @Query('unit') unit: string,
    @GetUser() user: User
  ) {
    return this.suppliesService.getAmountInBaseUnit(+id, amount, unit, user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @GetUser() user: User) {
    return this.suppliesService.findOne(+id, user);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSupplyDto: UpdateSupplyDto, @GetUser() user: User) {
    return this.suppliesService.update(+id, updateSupplyDto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @GetUser() user: User) {
    return this.suppliesService.remove(+id, user);
  }
  @Patch('batches/:batchId')
  updateBatch(
    @Param('batchId', ParseIntPipe) batchId: number,
    @Body() updateDto: { quantity?: number; remainingQuantity?: number; price?: number },
    @GetUser() user: User
  ) {
    return this.suppliesService.updateBatch(batchId, updateDto, user);
  }

  @Delete('batches/:batchId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeBatch(
    @Param('batchId', ParseIntPipe) batchId: number,
    @GetUser() user: User
  ) {
    await this.suppliesService.removeBatch(batchId, user);
  }
}
