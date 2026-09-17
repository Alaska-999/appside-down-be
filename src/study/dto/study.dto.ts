import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsISO8601,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class StudyEventInputDto {
  @IsUUID()
  id!: string;

  @IsUUID()
  flashcardId!: string;

  @IsUUID()
  moduleId!: string;

  @IsOptional()
  @IsEnum(['KNOWN', 'STILL_LEARNING'])
  status?: 'KNOWN' | 'STILL_LEARNING';

  @IsOptional()
  @IsEnum(['FLASHCARDS', 'MATCH', 'TEST', 'LEARN'])
  mode?: 'FLASHCARDS' | 'MATCH' | 'TEST' | 'LEARN';

  @IsOptional()
  @IsBoolean()
  correct?: boolean;

  @IsOptional()
  @IsBoolean()
  firstTry?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(600000)
  responseMs?: number;

  @IsISO8601()
  answeredAt!: string;
}

export class SubmitStudyEventsDto {
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => StudyEventInputDto)
  events!: StudyEventInputDto[];
}
