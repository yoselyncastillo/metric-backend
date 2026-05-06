import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Store } from './entities/store.entity';
import { UpdateStoreDto } from './dto/update-store.dto';

@Injectable()
export class StoresService {
  constructor(
    @InjectRepository(Store)
    private readonly storesRepository: Repository<Store>,
  ) {}

  async create(dto: any) {
    const store = this.storesRepository.create(dto);
    return await this.storesRepository.save(store);
  }

  async findAll() {
    return await this.storesRepository.find({ order: { name: 'ASC' } });
  }

  async findOne(id: number) {
    const store = await this.storesRepository.findOne({ 
        where: { id },
        relations: ['batches', 'batches.supply'] // Para ver qué has comprado allí
    });
    if (!store) throw new NotFoundException(`Tienda #${id} no encontrada`);
    return store;
  }

  update(id: number, updateStoreDto: UpdateStoreDto) {
    return `This action updates a #${id} store`;
  }

  remove(id: number) {
    return `This action removes a #${id} store`;
  }
}