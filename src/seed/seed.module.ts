import { Module } from '@nestjs/common';
import { SeedService } from './seed.service';
import { SeedController } from './seed.controller';
import { RecipesModule } from 'src/recipes/recipes.module';
import { StoresModule } from 'src/stores/stores.module';
import { SuppliesModule } from 'src/supplies/supplies.module';

@Module({
  imports: [
    StoresModule,
    SuppliesModule, 
    RecipesModule
  ],
  controllers: [SeedController],
  providers: [SeedService],
})
export class SeedModule {}
