import { Module } from '@nestjs/common';
import { ProductionService } from './production.service';
import { ProductionController } from './production.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecipesModule } from 'src/recipes/recipes.module';
import { SuppliesModule } from 'src/supplies/supplies.module';
import { FinishedProduct } from './entities/finished-product.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([FinishedProduct]),
    SuppliesModule,
    RecipesModule, 
  ],
  controllers: [ProductionController],
  providers: [ProductionService],
})
export class ProductionModule {}
