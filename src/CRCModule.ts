export interface CRCModule {
  calculate(chunk: Buffer | string, initial?: number): number;
}
