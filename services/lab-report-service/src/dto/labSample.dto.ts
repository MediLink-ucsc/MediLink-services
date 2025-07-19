export interface CreateLabSampleDto {
  labId: string;
  barcode: string;
  testTypeId: number;
  sampleType: string;
  volume: string;
  container: string;
  patientId: string;
  expectedTime: Date;
  priority?: string;
  notes?: string;
}

export interface UpdateLabSampleDto {
  status?: string;
  priority?: string;
  notes?: string;
}
