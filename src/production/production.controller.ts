import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ProductionService } from './production.service';
import { CreateProductionDto } from './dto/create-production.dto';
import { UpdateProductionDto } from './dto/update-production.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../auth/entities/user.entity';

@Auth()
@Controller('production')
export class ProductionController {
  constructor(private readonly productionService: ProductionService) { }
  
  @Post('execute')
  execute(@Body() data: { recipeId: number, quantity: number, realQuantity?: number }, @GetUser() user: User) {
    return this.productionService.executeProduction(data.recipeId, data.quantity, user, data.realQuantity);
  }

  @Post()
  create(@Body() createProductionDto: CreateProductionDto, @GetUser() user: User) {
    return this.productionService.create(createProductionDto, user);
  }

  @Get('finished-products')
  findAllFinished(@GetUser() user: User) {
    return this.productionService.findAllFinished(user);
  }

  @Get()
  findAll(@GetUser() user: User) {
    return this.productionService.findAll(user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @GetUser() user: User) {
    return this.productionService.findOne(+id, user);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProductionDto: UpdateProductionDto, @GetUser() user: User) {
    return this.productionService.update(+id, updateProductionDto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @GetUser() user: User) {
    return this.productionService.remove(+id, user);
  }
}
