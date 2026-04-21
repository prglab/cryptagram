import { BASE64_VALUES, BACCHANT_SYMBOL_THRESHOLDS, BLOCK_SIZE, HEADER_SIZE } from './constants';

export interface DecodedResult {
  payload: string | null;
  status: string;
}

export class BacchantCodec {
  /**
   * Decodes a Bacchant payload from ImageData.
   */
  public decode(imageData: ImageData): DecodedResult {
    const { width, height, data } = imageData;

    const getBin = (x: number, y: number): number => {
      let total = 0;
      for (let i = 0; i < BLOCK_SIZE; i++) {
        for (let j = 0; j < BLOCK_SIZE; j++) {
          const idx = ((y + j) * width + (x + i)) * 4;
          if (idx + 2 >= data.length) return 0;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          total += lum;
        }
      }
      const avg = total / (BLOCK_SIZE * BLOCK_SIZE);
      const inc = 255.0 / 7.0;
      const bin = Math.round(avg / inc);
      return Math.min(7, Math.max(0, bin));
    };

    // 1. Verify Header
    let header = "";
    for (let y = 0; y < HEADER_SIZE; y += BLOCK_SIZE) {
      for (let x = 0; x < HEADER_SIZE; x += 2 * BLOCK_SIZE) {
        const b0 = getBin(x, y);
        const b1 = getBin(x + BLOCK_SIZE, y);
        header += BASE64_VALUES.charAt(b0 * 8 + b1);
      }
    }

    if (header !== "bacchant") {
      return { payload: null, status: "invalid header" };
    }

    // 2. Decode Length and Payload
    let lengthChars = "";
    let payloadChars = "";
    let payloadLen: number | null = null;
    let charCount = 0;

    for (let y = 0; y < height; y += BLOCK_SIZE) {
      for (let x = 0; x < width; x += 2 * BLOCK_SIZE) {
        if (y < HEADER_SIZE && x < HEADER_SIZE) {
          continue;
        }

        const b0 = getBin(x, y);
        const b1 = getBin(x + BLOCK_SIZE, y);
        const ch = BASE64_VALUES.charAt(b0 * 8 + b1);

        if (charCount < 8) {
          lengthChars += ch;
          charCount++;
        } else {
          if (payloadLen === null) {
            payloadLen = parseInt(lengthChars, 10);
            if (isNaN(payloadLen)) {
              return { payload: null, status: "invalid length" };
            }
          }
          payloadChars += ch;
          if (payloadChars.length >= payloadLen) {
            return { payload: payloadChars.substring(0, payloadLen), status: "ok" };
          }
        }
      }
    }

    return { payload: payloadChars, status: "incomplete" };
  }

  /**
   * Encodes a payload into ImageData (simulated via Uint8ClampedArray).
   */
  public encode(payload: string, width: number, height: number): Uint8ClampedArray {
    const data = new Uint8ClampedArray(width * height * 4);
    data.fill(128);

    const setBlock = (x: number, y: number, symbol: number) => {
      const level = BACCHANT_SYMBOL_THRESHOLDS[symbol];
      for (let i = 0; i < BLOCK_SIZE; i++) {
        for (let j = 0; j < BLOCK_SIZE; j++) {
          const idx = ((y + j) * width + (x + i)) * 4;
          if (idx + 3 < data.length) {
            data[idx] = level;
            data[idx + 1] = level;
            data[idx + 2] = level;
            data[idx + 3] = 255;
          }
        }
      }
    };

    const getOctals = (char: string): [number, number] => {
      const idx = BASE64_VALUES.indexOf(char);
      if (idx === -1) return [0, 0]; // Fallback for non-base64
      return [Math.floor(idx / 8), idx % 8];
    };

    // 1. Encode Header
    const headerStr = "bacchant";
    for (let i = 0; i < headerStr.length; i++) {
      const [s0, s1] = getOctals(headerStr[i]);
      const sym0Idx = 2 * i;
      const sym1Idx = 2 * i + 1;
      const x0 = (sym0Idx % 4) * BLOCK_SIZE;
      const y0 = Math.floor(sym0Idx / 4) * BLOCK_SIZE;
      setBlock(x0, y0, s0);
      const x1 = (sym1Idx % 4) * BLOCK_SIZE;
      const y1 = Math.floor(sym1Idx / 4) * BLOCK_SIZE;
      setBlock(x1, y1, s1);
    }

    // 2. Encode Payload
    const lengthStr = payload.length.toString().padStart(8, '0');
    const fullData = lengthStr + payload;
    const symbols: number[] = [];
    for (let i = 0; i < fullData.length; i++) {
      const [s0, s1] = getOctals(fullData[i]);
      symbols.push(s0, s1);
    }

    const nHeaderRowSymbolsWide = (width - HEADER_SIZE) / BLOCK_SIZE;
    const nSymbolsInFullRow = width / BLOCK_SIZE;

    symbols.forEach((sym, i) => {
      let x, y;
      if (i < nHeaderRowSymbolsWide * 4) {
        const yCoord = Math.floor(i / nHeaderRowSymbolsWide);
        const xCoord = i % nHeaderRowSymbolsWide;
        x = HEADER_SIZE + (xCoord * BLOCK_SIZE);
        y = yCoord * BLOCK_SIZE;
      } else {
        const i2 = i + 16;
        const yCoord = Math.floor(i2 / nSymbolsInFullRow);
        const xCoord = i2 % nSymbolsInFullRow;
        x = xCoord * BLOCK_SIZE;
        y = yCoord * BLOCK_SIZE;
      }

      if (x + BLOCK_SIZE <= width && y + BLOCK_SIZE <= height) {
        setBlock(x, y, sym);
      }
    });

    return data;
  }
}
