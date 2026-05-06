import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SuppliesModule } from './supplies/supplies.module';
import { StoresModule } from './stores/stores.module';
import { SeedModule } from './seed/seed.module';
import { RecipesModule } from './recipes/recipes.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: +(process.env.DB_PORT ?? 5432),
      database: process.env.DB_NAME,
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      autoLoadEntities: true,
      synchronize: true, // TODO: Remove in production
    }),
    SuppliesModule,
    RecipesModule,
    StoresModule,
    SeedModule,
  ],
})
export class AppModule {}
