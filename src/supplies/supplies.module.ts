import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryBatch } from './entities/inventory-batch.entity';
import { Supply } from './entities/supply.entity';
import { UnitConversion } from './entities/unit-conversion.entity';
import { SuppliesController } from './supplies.controller';
import { SuppliesService } from './supplies.service';

@Module({
  imports: [TypeOrmModule.forFeature([Supply, InventoryBatch, UnitConversion])],
  controllers: [SuppliesController],
  providers: [SuppliesService],
  exports: [SuppliesService],
})
export class SuppliesModule {}
