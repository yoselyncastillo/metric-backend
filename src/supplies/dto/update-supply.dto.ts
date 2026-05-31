import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateSupplyDto } from './create-supply.dto';

export class UpdateSupplyDto extends PartialType(
  OmitType(CreateSupplyDto, ['initialQuantity', 'totalPaid'] as const),
) {}
