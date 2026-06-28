import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { User } from '../auth/entities/user.entity';

@Injectable()
export class CustomersService {

  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {}

  create(createCustomerDto: CreateCustomerDto, user: User) {
    const customer = this.customerRepository.create({ ...createCustomerDto, user });
    return this.customerRepository.save(customer);
  }

  findAll(user: User) {
    return this.customerRepository.find({
      where: { user: { id: user.id } }
    });
  }

  async findOne(id: number, user: User) {
    const customer = await this.customerRepository.findOne({
      where: { id, user: { id: user.id } }
    });
    if (!customer) throw new NotFoundException(`Cliente #${id} no encontrado`);
    return customer;
  }

  async update(id: number, updateCustomerDto: UpdateCustomerDto, user: User) {
    const customer = await this.findOne(id, user);
    this.customerRepository.merge(customer, updateCustomerDto);
    return this.customerRepository.save(customer);
  }

  async remove(id: number, user: User) {
    const customer = await this.findOne(id, user);
    return this.customerRepository.remove(customer);
  }
}
