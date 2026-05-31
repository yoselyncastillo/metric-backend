import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateAccountingDto } from './dto/create-accounting.dto';
import { UpdateAccountingDto } from './dto/update-accounting.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExtraExpense } from './entities/extra-expense.entity';

@Injectable()
export class AccountingService {

  constructor(
    @InjectRepository(ExtraExpense)
    private readonly repository: Repository<ExtraExpense>,
  ) {}

  create(createAccountingDto: CreateAccountingDto) {
    // Mapeamos el DTO a un objeto que la entidad entienda (amount de number a string)
    const expenseData = {
      ...createAccountingDto,
      amount: createAccountingDto.amount.toString(), // <--- La conversión mágica
    };
  
    const expense = this.repository.create(expenseData);
    return this.repository.save(expense);
  }

  findAll() {
    return this.repository.find({ order: { date: 'DESC' } });
  }

  async findOne(id: number) {
    const expense = await this.repository.findOneBy({ id });
    if (!expense) throw new NotFoundException(`Gasto #${id} no encontrado`);
    return expense;
  }

  async update(id: number, updateAccountingDto: UpdateAccountingDto) {
    // Convertimos el amount a string solo si viene en el DTO
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

  async remove(id: number) {
    const expense = await this.findOne(id);
    return this.repository.remove(expense);
  }
}
