export interface CreateLabResultDto {
  labSampleId: number;
  reportUrl: string;
  extractedData: Record<string, any>;
}

export interface UpdateLabResultDto {
  extractedData?: Record<string, any>;
  status?: string;
}
