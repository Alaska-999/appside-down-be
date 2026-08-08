import { IsEnum, IsOptional, IsBoolean, IsString, IsUUID, MaxLength } from "class-validator";
import { CardStatus } from "src/generated/prisma/client";

export class CreateFlashcardDto {
    @IsString()
    @MaxLength(200)
    term!: string;

    @IsString()
    @MaxLength(500)
    definition!: string;

    @IsUUID()
    moduleId!: string;

    @IsOptional()
    @IsBoolean()
    isStarred?: boolean;

    @IsOptional()
    @IsEnum(CardStatus)
    status?: CardStatus;
}
