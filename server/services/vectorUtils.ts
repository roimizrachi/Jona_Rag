export const toVectorLiteral = (embedding: number[]): string =>
  `[${embedding.join(',')}]`;
