import { CardStatus } from "src/generated/prisma/client";

export class CreateFlashcardDto {
    term: string;
    definition: string;
    moduleId: string;
    isStarred?: boolean;
    status?: CardStatus;
}
