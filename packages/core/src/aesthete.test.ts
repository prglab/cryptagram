import { describe, it, expect } from 'vitest';
import { AestheteCodec } from './aesthete';

describe('AestheteCodec', () => {
  const codec = new AestheteCodec();

  it('should be detectable', () => {
     expect(codec.decode).toBeDefined();
  });
});
