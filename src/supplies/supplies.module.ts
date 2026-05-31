import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryBatch } from './entities/inventory-batch.entity';
import { Supply } from './entities/supply.entity';
import { UnitConversion } from './entities/unit-conversion.entity';
import { SuppliesController } from './supplies.controller';
import { SuppliesService } from './supplies.service';
import { StoresModule } from 'src/stores/stores.module';
import { SupplyFormat } from './entities/supply-format.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Supply, InventoryBatch, UnitConversion, SupplyFormat]),
    StoresModule,
],
  controllers: [SuppliesController],
  providers: [SuppliesService],
  exports: [SuppliesService],
})
export class SuppliesModule {}
