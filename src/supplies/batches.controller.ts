import {
  Controller,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SuppliesService } from './supplies.service';
import { UpdateBatchDto } from './dto/update-batch.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../auth/entities/user.entity';

@Auth()
@Controller('batches')
export class BatchesController {
  constructor(private readonly suppliesService: SuppliesService) {}

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBatchDto: UpdateBatchDto,
    @GetUser() user: User,
  ) {
    return this.suppliesService.updateBatch(id, updateBatchDto, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number, @GetUser() user: User) {
    return this.suppliesService.removeBatch(id, user);
  }
}
