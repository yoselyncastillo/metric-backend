import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Store } from './entities/store.entity';
import { UpdateStoreDto } from './dto/update-store.dto';
import { User } from '../auth/entities/user.entity';

@Injectable()
export class StoresService {
  constructor(
    @InjectRepository(Store)
    private readonly storesRepository: Repository<Store>,
  ) {}

  async create(dto: any, user: User) {
    const store = this.storesRepository.create({ ...dto, user });
    return await this.storesRepository.save(store);
  }

  async findAll(user: User) {
    return await this.storesRepository.find({ 
      where: { user: { id: user.id } },
      order: { name: 'ASC' } 
    });
  }

  async findOne(id: number, user: User) {
    const store = await this.storesRepository.findOne({ 
        where: { id, user: { id: user.id } },
        relations: ['batches', 'batches.supply']
    });
    if (!store) throw new NotFoundException(`Tienda #${id} no encontrada`);
    return store;
  }

  async update(id: number, updateStoreDto: UpdateStoreDto, user: User) {
    const store = await this.findOne(id, user);
    this.storesRepository.merge(store, updateStoreDto);
    return await this.storesRepository.save(store);
  }

  async remove(id: number, user: User) {
    const store = await this.findOne(id, user);
    return await this.storesRepository.remove(store);
  }
}