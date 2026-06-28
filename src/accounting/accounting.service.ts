import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateAccountingDto } from './dto/create-accounting.dto';
import { UpdateAccountingDto } from './dto/update-accounting.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExtraExpense } from './entities/extra-expense.entity';
import { User } from '../auth/entities/user.entity';

@Injectable()
export class AccountingService {

  constructor(
    @InjectRepository(ExtraExpense)
    private readonly repository: Repository<ExtraExpense>,
  ) {}

  create(createAccountingDto: CreateAccountingDto, user: User) {
    const expenseData = {
      ...createAccountingDto,
      amount: createAccountingDto.amount.toString(),
      user,
    };
  
    const expense = this.repository.create(expenseData);
    return this.repository.save(expense);
  }

  findAll(user: User) {
    return this.repository.find({ 
      where: { user: { id: user.id } },
      order: { date: 'DESC' } 
    });
  }

  async findOne(id: number, user: User) {
    const expense = await this.repository.findOne({
      where: { id, user: { id: user.id } }
    });
    if (!expense) throw new NotFoundException(`Gasto #${id} no encontrado`);
    return expense;
  }

  async update(id: number, updateAccountingDto: UpdateAccountingDto, user: User) {
    // Primero validamos que existe y pertenece al usuario
    const existingExpense = await this.findOne(id, user);

    const dataToUpdate = {
      ...updateAccountingDto,
      amount: updateAccountingDto.amount !== undefined 
        ? updateAccountingDto.amount.toString() 
        : undefined,
    };
  
    const expense = await this.repository.preload({
      id,
      ...dataToUpdate,
    });
  
    if (!expense) throw new NotFoundException(`Gasto #${id} no existe`);
    
    return this.repository.save(expense);
  }

  async remove(id: number, user: User) {
    const expense = await this.findOne(id, user);
    return this.repository.remove(expense);
  }
}
