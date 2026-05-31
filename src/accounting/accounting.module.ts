import { Module } from '@nestjs/common';
import { AccountingService } from './accounting.service';
import { AccountingController } from './accounting.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExtraExpense } from './entities/extra-expense.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ExtraExpense])],
  controllers: [AccountingController],
  providers: [AccountingService],
})
export class AccountingModule {}
