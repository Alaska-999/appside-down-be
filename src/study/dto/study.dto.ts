export class StudyEventInputDto {
  flashcardId: string;
  moduleId: string;
  status: 'KNOWN' | 'STILL_LEARNING';
  answeredAt: string;
}

export class SubmitStudyEventsDto {
  events: StudyEventInputDto[];
}
