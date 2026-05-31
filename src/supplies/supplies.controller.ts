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

@Controller('supplies')
export class SuppliesController {
  constructor(private readonly suppliesService: SuppliesService) { }

  @Post()
  create(@Body() createSupplyDto: CreateSupplyDto) {
    return this.suppliesService.create(createSupplyDto);
  }

  @Get()
  findAll() {
    return this.suppliesService.findAll();
  }

  @Post('formats')
  createFormat(@Body() createFormatDto: CreateSupplyFormatDto) {
    return this.suppliesService.createFormat(createFormatDto);
  }

  @Post(':id/batches')
  addBatch( 
    @Param('id') id: string,
    @Body() createBatchDto: CreateBatchDto,
  ) {
    return this.suppliesService.addBatch(+id, createBatchDto);
  }

  @Post(':id/conversions')
  addConversion(
    @Param('id') id: string,
    @Body() dto: CreateUnitConversionDto,
  ) {
    return this.suppliesService.addConversion(+id, dto);
  }

  @Patch('conversions/:conversionId')
  updateConversion(
    @Param('conversionId', ParseIntPipe) conversionId: number,
    @Body() dto: UpdateUnitConversionDto,
  ) {
    return this.suppliesService.updateConversion(conversionId, dto);
  }

  @Delete('conversions/:conversionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeConversion(
    @Param('conversionId', ParseIntPipe) conversionId: number,
  ) {
    await this.suppliesService.removeConversion(conversionId);
  }

  @Post(':id/consume-test')
  consumeTest(@Param('id') id: string, @Body() body: ConsumeTestDto) {
    return this.suppliesService.processConsumption(
      +id,
      body.quantity,
      body.execute,
    );
  }

  @Get(':id/pricing')
  getPricing(
    @Param('id') id: string,
    @Query('quantity', new ParseFloatPipe({ optional: false }))
    quantity: number,
  ) {
    return this.suppliesService.getSupplyPricing(+id, quantity);
  }

  @Get(':id/convert-test')
  convertTest(
    @Param('id') id: string,
    @Query('amount', new ParseFloatPipe({ optional: false }))
    amount: number,
    @Query('unit') unit: string,
  ) {
    return this.suppliesService.getAmountInBaseUnit(+id, amount, unit);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.suppliesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSupplyDto: UpdateSupplyDto) {
    return this.suppliesService.update(+id, updateSupplyDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.suppliesService.remove(+id);
  }
}
