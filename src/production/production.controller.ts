import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ProductionService } from './production.service';
import { CreateProductionDto } from './dto/create-production.dto';
import { UpdateProductionDto } from './dto/update-production.dto';

@Controller('production')
export class ProductionController {
  constructor(private readonly productionService: ProductionService) { }
  
  @Post('execute')
  execute(@Body() data: { recipeId: number, quantity: number, realQuantity?: number }) {
    return this.productionService.executeProduction(data.recipeId, data.quantity, data.realQuantity);
  }

  @Post()
  create(@Body() createProductionDto: CreateProductionDto) {
    return this.productionService.create(createProductionDto);
  }

  @Get('finished-products')
  findAllFinished() {
    return this.productionService.findAllFinished();
  }

  @Get()
  findAll() {
    return this.productionService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productionService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProductionDto: UpdateProductionDto) {
    return this.productionService.update(+id, updateProductionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productionService.remove(+id);
  }
}
