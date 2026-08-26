import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsBoolean, IsOptional, IsString, IsUUID, MaxLength, ValidateNested } from 'class-validator';

class CreateFlashcardNestedDto {
    @IsString()
    @MaxLength(200)
    term!: string;

    @IsString()
    @MaxLength(500)
    definition!: string;
}


export class CreateModuleDto {
    @IsString()
    @MaxLength(60)
    name!: string;

    @IsOptional()
    @IsString()
    @MaxLength(300)
    description?: string;

    @IsOptional()
    @IsBoolean()
    isFavorite?: boolean;

    @IsOptional()
    @IsBoolean()
    isPublic?: boolean;

    @IsOptional()
    @IsUUID()
    folderId?: string;

    @IsOptional()
    @IsArray()
    @ArrayMaxSize(1000)
    @ValidateNested({ each: true })
    @Type(() => CreateFlashcardNestedDto)
    flashcards?: CreateFlashcardNestedDto[];
}

