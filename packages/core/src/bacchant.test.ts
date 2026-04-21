import { describe, it, expect } from 'vitest';
import { BacchantCodec } from './bacchant';
import goldenVectors from '../../../tests/harness/golden_vectors.json';

// Simple ImageData mock for Node environment
class MockImageData {
  width: number;
  height: number;
  data: Uint8ClampedArray;
  constructor(data: Uint8ClampedArray, width: number, height: number) {
    this.width = width;
    this.height = height;
    this.data = data;
  }
}

describe('BacchantCodec', () => {
  const codec = new BacchantCodec();

  it('should encode and decode a payload correctly', () => {
    const payload = "SGVsbG8gZnJvbSBUeXBlU2NyaXB0IENvcmUh"; 
    const width = 128;
    const height = 128;
    
    const encodedData = codec.encode(payload, width, height);
    const imageData = new MockImageData(encodedData, width, height) as unknown as ImageData;
    
    const result = codec.decode(imageData);
    expect(result.status).toBe('ok');
    expect(result.payload).toBe(payload);
  });

  it('should decode golden vectors correctly', () => {
    for (const vector of goldenVectors) {
      if (vector.codec !== 'bacchant') continue;

      const encodedData = codec.encode(vector.full_payload, vector.width, vector.height);
      const imageData = new MockImageData(encodedData, vector.width, vector.height) as unknown as ImageData;
      
      const result = codec.decode(imageData);
      expect(result.status).toBe('ok');
      expect(result.payload).toBe(vector.full_payload);
    }
  });
});
