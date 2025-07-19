export interface CustomError extends Error {
  statusCode?: number;
  status?: string;
}

export interface TestType {
  id: number;
  value: string;
  label: string;
  category: string;
}

export interface TestTypeResponse {
  testTypes: TestType[];
}
export interface AddTestTypeRequest {
  value: string;
  label: string;
  category: string;
}
export interface GetTestTypeResponse {
  testType: TestType;
}
