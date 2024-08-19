declare module 'density-clustering' {
  export class DBSCAN {
    constructor();
    run(dataset: number[][], epsilon: number, minPts: number): number[][];
  }

  export class OPTICS {
    constructor();
    run(dataset: number[][]): number[][];
  }
}
