export interface CRCModule {
  // tslint: disable-next-line:no-any
  calculate(chunk: any, initial: number): number;
}
