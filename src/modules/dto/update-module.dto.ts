import { OmitType, PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsBoolean, IsOptional, IsString, IsUUID, MaxLength, ValidateNested } from 'class-validator';
import { CreateModuleDto } from './create-module.dto';

class UpdateModuleFlashcardDto {
    @IsOptional()
    @IsUUID()
    id?: string;

    @IsString()
    @MaxLength(200)
    term!: string;

    @IsString()
    @MaxLength(500)
    definition!: string;
}

export class UpdateModuleDto extends PartialType(OmitType(CreateModuleDto, ['flashcards'] as const)) {
    @IsOptional()
    @IsBoolean()
    isPublic?: boolean

    @IsOptional()
    @IsArray()
    @ArrayMaxSize(1000)
    @ValidateNested({ each: true })
    @Type(() => UpdateModuleFlashcardDto)
    flashcards?: UpdateModuleFlashcardDto[];
}
