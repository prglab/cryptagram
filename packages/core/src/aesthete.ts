import { BASE64_VALUES, BLOCK_SIZE, HEADER_SIZE } from './constants';
import { DecodedResult } from './bacchant';

export class AestheteCodec {
  public decode(imageData: ImageData): DecodedResult {
    const { width, height, data } = imageData;

    const getBin = (x: number, y: number): number => {
      let total = 0;
      for (let i = 0; i < BLOCK_SIZE; i++) {
        for (let j = 0; j < BLOCK_SIZE; j++) {
          const idx = ((y + j) * width + (x + i)) * 4;
          // Aesthete only uses the Green channel
          total += data[idx + 1];
        }
      }
      const v = total / (BLOCK_SIZE * BLOCK_SIZE);
      const b = Math.floor(v / 28.0);
      if (b === 0) return -1; // Black sentinel
      if (b > 8) return 0;
      return 8 - b;
    };

    // 1. Verify Header
    let header = "";
    for (let y = 0; y < HEADER_SIZE; y += BLOCK_SIZE) {
      for (let x = 0; x < HEADER_SIZE; x += 2 * BLOCK_SIZE) {
        const b0 = getBin(x, y);
        const b1 = getBin(x + BLOCK_SIZE, y);
        if (b0 < 0 || b1 < 0) return { payload: null, status: "invalid header" };
        header += BASE64_VALUES.charAt(b0 * 8 + b1);
      }
    }

    if (header !== "aesthete") {
      return { payload: null, status: "invalid header" };
    }

    // 2. Decode Payload (until black sentinel)
    let payload = "";
    for (let y = 0; y < height; y += BLOCK_SIZE) {
      for (let x = 0; x < width; x += 2 * BLOCK_SIZE) {
        if (y < HEADER_SIZE && x < HEADER_SIZE) continue;

        const b0 = getBin(x, y);
        const b1 = getBin(x + BLOCK_SIZE, y);
        
        if (b0 === -1 || b1 === -1) {
          return { payload, status: "ok" };
        }
        
        payload += BASE64_VALUES.charAt(b0 * 8 + b1);
      }
    }

    return { payload, status: "incomplete" };
  }
}
