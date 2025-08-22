export interface CreateLabResultDto {
  labSampleId: number;
  reportUrl: string;
  extractedData: Record<string, any>;
}

export interface UpdateLabResultDto {
  extractedData?: Record<string, any>;
  status?: string;
}

export interface EditLabResultDto {
  extractedData: Record<string, any>;
  notes?: string;
  editedBy?: string;
}
