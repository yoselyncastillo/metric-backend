import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Between, IsNull, Brackets } from 'typeorm';
import { CashClosure } from './entities/cash-closure.entity';
import { FinishedProduct } from '../production/entities/finished-product.entity';
import { ExtraExpense } from '../accounting/entities/extra-expense.entity';
import { InventoryBatch } from '../supplies/entities/inventory-batch.entity';
import { PreviewClosureDto } from './dto/preview-closure.dto';
import { CreateClosureDto } from './dto/create-closure.dto';
import { User } from '../auth/entities/user.entity';

@Injectable()
export class ClosuresService {
  constructor(
    @InjectRepository(CashClosure)
    private closureRepo: Repository<CashClosure>,
    private dataSource: DataSource,
  ) {}

  async previewClosure(dto: PreviewClosureDto, user: User) {
    const { startDate, endDate } = dto;
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // 1. Get Revenues (FinishedProducts with amountPaid > 0 and no closure)
    const products = await this.dataSource.getRepository(FinishedProduct)
      .createQueryBuilder('product')
      .where('product.user_id = :userId', { userId: user.id })
      .andWhere('product.closure_id IS NULL')
      .andWhere(new Brackets(qb => {
        qb.where('product.soldAt BETWEEN :start AND :end', { start, end })
          .orWhere('product.updatedAt BETWEEN :start AND :end', { start, end });
      }))
      .getMany();

    const totalRevenue = products.reduce((sum, p) => sum + parseFloat(p.amountPaid || '0'), 0);

    // 2. Get Extra Expenses
    const extraExpenses = await this.dataSource.getRepository(ExtraExpense)
      .createQueryBuilder('expense')
      .where('expense.user_id = :userId', { userId: user.id })
      .andWhere('expense.closure_id IS NULL')
      .andWhere('expense.date BETWEEN :start AND :end', { start, end })
      .getMany();

    const extraExpenseTotal = extraExpenses.reduce((sum, e) => sum + parseFloat(e.amount || '0'), 0);

    // 3. Get Inventory Batches (External Purchases)
    const inventoryBatches = await this.dataSource.getRepository(InventoryBatch)
      .createQueryBuilder('batch')
      .leftJoinAndSelect('batch.supply', 'supply')
      .where('batch.user_id = :userId', { userId: user.id })
      .andWhere('batch.closure_id IS NULL')
      .andWhere('batch.createdAt BETWEEN :start AND :end', { start, end })
      .andWhere('supply.category != :category', { category: 'Semielaborados' })
      .getMany();

    const supplyExpenseTotal = inventoryBatches.reduce((sum, b) => {
      const cost = parseFloat(b.initialQuantity || '0') * parseFloat(b.costPerUnit || '0');
      return sum + cost;
    }, 0);

    const totalExpenses = extraExpenseTotal + supplyExpenseTotal;
    const netProfit = totalRevenue - totalExpenses;

    const titheAmount = netProfit > 0 ? netProfit * 0.1 : 0;
    
    // We don't calculate offering here since preview might not have percentage,
    // but if we want we could add offeringPercentage to preview DTO as well.
    // Assuming preview doesn't strictly need offering, or we default it to 0.

    return {
      totalRevenue,
      totalExpenses,
      netProfit,
      titheAmount,
      productsCount: products.length,
      extraExpensesCount: extraExpenses.length,
      inventoryBatchesCount: inventoryBatches.length,
      startDate: start.toISOString(),
      endDate: end.toISOString()
    };
  }

  async createClosure(dto: CreateClosureDto, user: User) {
    const preview = await this.previewClosure(dto, user);
    
    const offeringAmount = preview.netProfit > 0 
      ? preview.netProfit * (dto.offeringPercentage / 100)
      : 0;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Create the Closure
      const closure = queryRunner.manager.create(CashClosure, {
        startDate: dto.startDate,
        endDate: dto.endDate,
        totalRevenue: preview.totalRevenue.toString(),
        totalExpenses: preview.totalExpenses.toString(),
        netProfit: preview.netProfit.toString(),
        titheAmount: preview.titheAmount.toString(),
        offeringAmount: offeringAmount.toString(),
        user: user,
      });

      const savedClosure = await queryRunner.manager.save(closure);

      const start = new Date(dto.startDate);
      const end = new Date(dto.endDate);
      end.setHours(23, 59, 59, 999);

      // Seal Products
      await queryRunner.manager.createQueryBuilder()
        .update(FinishedProduct)
        .set({ closure: savedClosure })
        .where('user_id = :userId', { userId: user.id })
        .andWhere('closure_id IS NULL')
        .andWhere(new Brackets(qb => {
          qb.where('soldAt BETWEEN :start AND :end', { start, end })
            .orWhere('updatedAt BETWEEN :start AND :end', { start, end });
        }))
        .execute();

      // Seal Extra Expenses
      await queryRunner.manager.createQueryBuilder()
        .update(ExtraExpense)
        .set({ closure: savedClosure })
        .where('user_id = :userId', { userId: user.id })
        .andWhere('closure_id IS NULL')
        .andWhere('date BETWEEN :start AND :end', { start, end })
        .execute();

      // Seal Inventory Batches
      // We need a subquery or join for the category filter in update, 
      // but TypeORM update doesn't support joins easily.
      // So we get the IDs first, then update by ID.
      const batchesToUpdate = await queryRunner.manager.getRepository(InventoryBatch)
        .createQueryBuilder('batch')
        .leftJoin('batch.supply', 'supply')
        .where('batch.user_id = :userId', { userId: user.id })
        .andWhere('batch.closure_id IS NULL')
        .andWhere('batch.createdAt BETWEEN :start AND :end', { start, end })
        .andWhere('supply.category != :category', { category: 'Semielaborados' })
        .select('batch.id')
        .getMany();

      if (batchesToUpdate.length > 0) {
        const batchIds = batchesToUpdate.map(b => b.id);
        await queryRunner.manager.createQueryBuilder()
          .update(InventoryBatch)
          .set({ closure: savedClosure })
          .whereInIds(batchIds)
          .execute();
      }

      await queryRunner.commitTransaction();
      return savedClosure;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async markTithePaid(id: number, user: User) {
    const closure = await this.closureRepo.findOne({ where: { id, user: { id: user.id } } });
    if (!closure) throw new BadRequestException('Closure not found');
    closure.isTithed = true;
    return this.closureRepo.save(closure);
  }

  async markOfferingPaid(id: number, user: User) {
    const closure = await this.closureRepo.findOne({ where: { id, user: { id: user.id } } });
    if (!closure) throw new BadRequestException('Closure not found');
    closure.isOffered = true;
    return this.closureRepo.save(closure);
  }

  async findAll(user: User) {
    return this.closureRepo.find({
      where: { user: { id: user.id } },
      order: { createdAt: 'DESC' }
    });
  }
}
