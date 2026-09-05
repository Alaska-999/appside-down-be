import { ArrayMaxSize, IsArray, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateFolderDto {
    @IsString()
    @MaxLength(60)
    name!: string;

    @IsString()
    icon!: string;

    @IsOptional()
    @IsArray()
    @ArrayMaxSize(20)
    @IsString({ each: true })
    @MaxLength(30, { each: true })
    tags?: string[];
}
