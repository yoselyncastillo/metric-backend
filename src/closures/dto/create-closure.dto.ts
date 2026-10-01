import { IsDateString, IsNumber, Min } from 'class-validator';

export class CreateClosureDto {
  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsNumber()
  @Min(0)
  offeringPercentage: number;
}
