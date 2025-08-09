export interface CreateTestTypeDto {
  value: string;
  label: string;
  category: string;
  parserClass?: string;
  parserModule?: string;
  reportFields?: Array<{
    name: string;
    type: string;
    required: boolean;
    unit?: string;
    normalRange?: string;
  }>;
  referenceRanges?: Record<
    string,
    {
      min?: number;
      max?: number;
      unit: string;
      normalRange: string;
    }
  >;
  basicFields?: Array<{
    name: string;
    required: boolean;
    patterns: string[];
  }>;
}

export interface UpdateTestTypeDto {
  value?: string;
  label?: string;
  category?: string;
  parserClass?: string;
  parserModule?: string;
  reportFields?: Array<{
    name: string;
    type: string;
    required: boolean;
    unit?: string;
    normalRange?: string;
  }>;
  referenceRanges?: Record<
    string,
    {
      min?: number;
      max?: number;
      unit: string;
      normalRange: string;
    }
  >;
  basicFields?: Array<{
    name: string;
    required: boolean;
    patterns: string[];
  }>;
}

export interface ReportTemplateDto {
  testTypeId: number;
  reportFields: Array<{
    name: string;
    type: string;
    required: boolean;
    unit?: string;
    normalRange?: string;
  }>;
  referenceRanges: Record<
    string,
    {
      min?: number;
      max?: number;
      unit: string;
      normalRange: string;
    }
  >;
}

export interface AvailableParserDto {
  module: string;
  class: string;
  name: string;
  description: string;
}
