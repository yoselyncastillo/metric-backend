import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClosuresService } from './closures.service';
import { ClosuresController } from './closures.controller';
import { CashClosure } from './entities/cash-closure.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CashClosure])],
  controllers: [ClosuresController],
  providers: [ClosuresService],
})
export class ClosuresModule {}
