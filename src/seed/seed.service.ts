// src/seed/seed.service.ts
import { Injectable } from '@nestjs/common';
import { RecipesService } from '../recipes/recipes.service';
import { StoresService } from '../stores/stores.service';
import { SuppliesService } from '../supplies/supplies.service';
import { SupplyFormat } from '../supplies/entities/supply-format.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../auth/entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SeedService {
  constructor(
    private readonly storesService: StoresService,
    private readonly suppliesService: SuppliesService,
    private readonly recipesService: RecipesService,
    @InjectRepository(SupplyFormat)
    private readonly formatsRepository: Repository<SupplyFormat>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async runSeed() {
    let user = await this.userRepository.findOneBy({ email: 'seed@metric.com' });
    if (!user) {
      user = this.userRepository.create({
        email: 'seed@metric.com',
        password: bcrypt.hashSync('Password123!', 10),
        name: 'Seed User',
      });
      user = await this.userRepository.save(user);
    }

    const store = await this.storesService.create({
      name: 'Repostería La Mejor',
      address: 'La Concordia',
      instagramUrl: 'https://instagram.com/reposterialamejor'
    }, user);

    const harina = await this.suppliesService.create({
      name: 'Harina de Trigo',
      unit: 'gr',
      initialQuantity: 1000,
      totalPaid: 7
    }, user);

    const formato1kg = this.formatsRepository.create({
      name: 'Empaque Robinson 1kg',
      quantity: '1000',
      supply: harina,
      user
    });
    await this.formatsRepository.save(formato1kg);

    const formato900g = this.formatsRepository.create({
      name: 'Empaque Robin Hood 900g',
      quantity: '900',
      supply: harina,
      user
    });
    await this.formatsRepository.save(formato900g);

    await this.suppliesService.addBatch(harina.id, {
      supplyFormatId: formato1kg.id,
      totalPaid: 5.50,
      storeId: store[0].id,
      initialQuantity: 0
    }, user);

    await this.suppliesService.addBatch(harina.id, {
      supplyFormatId: formato900g.id,
      totalPaid: 5.20,
      storeId: store[0].id,
      initialQuantity: 900
    }, user);

    const receta = await this.recipesService.create({
      name: 'Pan de Trigo',
      description: 'Receta básica de pan',
      portions: 10,
      profitMargin: 1.5,
      ingredients: [
        { supplyId: harina.id, quantity: 500, unit: 'gr' }
      ]
    }, user);

    return {
      message: 'Seed executed successfully with new Pricing Logic!',
      data: {
        store: store[0].name,
        supply: harina.name,
        formats: [formato1kg.name, formato900g.name],
        recipe: receta.name,
        user: user.email,
      }
    };
  }
}