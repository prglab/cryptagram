use crate::constants::*;

pub struct BacchantCodec;

impl BacchantCodec {
    pub fn decode(width: usize, height: usize, data: &[u8]) -> (Option<String>, String) {
        let get_bin = |x: usize, y: usize| -> u8 {
            let mut total: f64 = 0.0;
            for i in 0..BLOCK_SIZE {
                for j in 0..BLOCK_SIZE {
                    let idx = ((y + j) * width + (x + i)) * 4;
                    if idx + 2 < data.len() {
                        let r = data[idx] as f64;
                        let g = data[idx + 1] as f64;
                        let b = data[idx + 2] as f64;
                        let lum = 0.299 * r + 0.587 * g + 0.114 * b;
                        total += lum;
                    }
                }
            }
            let avg = total / (BLOCK_SIZE * BLOCK_SIZE) as f64;
            let inc = 255.0 / 7.0;
            let bin = (avg / inc).round() as u8;
            bin.min(7)
        };

        // 1. Verify Header
        let mut header = String::new();
        for y in (0..HEADER_SIZE).step_by(BLOCK_SIZE) {
            for x in (0..HEADER_SIZE).step_by(2 * BLOCK_SIZE) {
                let b0 = get_bin(x, y);
                let b1 = get_bin(x + BLOCK_SIZE, y);
                let idx = (b0 * 8 + b1) as usize;
                if let Some(ch) = BASE64_VALUES.chars().nth(idx) {
                    header.push(ch);
                }
            }
        }

        if header != "bacchant" {
            return (None, "invalid header".to_string());
        }

        // 2. Decode Length and Payload
        let mut length_chars = String::new();
        let mut payload_chars = String::new();
        let mut payload_len: Option<usize> = None;
        let mut count = 0;

        for y in (0..height).step_by(BLOCK_SIZE) {
            for x in (0..width).step_by(2 * BLOCK_SIZE) {
                if y < HEADER_SIZE && x < HEADER_SIZE {
                    continue;
                }

                let b0 = get_bin(x, y);
                let b1 = get_bin(x + BLOCK_SIZE, y);
                let idx = (b0 * 8 + b1) as usize;
                let ch = BASE64_VALUES.chars().nth(idx).unwrap_or('?');

                if y == 0 && x < HEADER_SIZE + 16 * BLOCK_SIZE {
                    length_chars.push(ch);
                } else {
                    if payload_len.is_none() {
                        payload_len = length_chars.parse::<usize>().ok();
                        if payload_len.is_none() {
                            return (None, "invalid length".to_string());
                        }
                    }
                    
                    if let Some(len) = payload_len {
                        payload_chars.push(ch);
                        count += 1;
                        if count >= len {
                            return (Some(payload_chars), "ok".to_string());
                        }
                    }
                }
            }
        }

        (Some(payload_chars), "incomplete".to_string())
    }

    pub fn encode(payload: &str, width: usize, height: usize) -> Vec<u8> {
        let mut data = vec![128u8; width * height * 4];
        for i in 0..width * height {
            data[i * 4 + 3] = 255; // Opaque
        }

        let mut set_block = |x: usize, y: usize, symbol: u8| {
            let level = BACCHANT_SYMBOL_THRESHOLDS[symbol as usize];
            for i in 0..BLOCK_SIZE {
                for j in 0..BLOCK_SIZE {
                    let idx = ((y + j) * width + (x + i)) * 4;
                    data[idx] = level;
                    data[idx + 1] = level;
                    data[idx + 2] = level;
                }
            }
        };

        let get_octals = |ch: char| -> (u8, u8) {
            let idx = BASE64_VALUES.find(ch).unwrap_or(0);
            ((idx / 8) as u8, (idx % 8) as u8)
        };

        // 1. Header
        let header_str = "bacchant";
        for (i, ch) in header_str.chars().enumerate() {
            let (s0, s1) = get_octals(ch);
            let x = (i % 4) * BLOCK_SIZE;
            let y = (i / 4) * BLOCK_SIZE;
            set_block(x, y, s0);
            set_block(x + BLOCK_SIZE, y, s1);
        }

        // 2. Payload
        let length_str = format!("{:08}", payload.len());
        let full_data = format!("{}{}", length_str, payload);
        let mut symbols = Vec::new();
        for ch in full_data.chars() {
            let (s0, s1) = get_octals(ch);
            symbols.push(s0);
            symbols.push(s1);
        }

        let n_header_row_symbols_wide = (width - HEADER_SIZE) / BLOCK_SIZE;
        let n_symbols_in_full_row = width / BLOCK_SIZE;

        for (i, &sym) in symbols.iter().enumerate() {
            let (x, y);
            if i < n_header_row_symbols_wide * 4 {
                let y_coord = i / n_header_row_symbols_wide;
                let x_coord = i % n_header_row_symbols_wide;
                x = HEADER_SIZE + (x_coord * BLOCK_SIZE);
                y = y_coord * BLOCK_SIZE;
            } else {
                let i2 = i + 16;
                let y_coord = i2 / n_symbols_in_full_row;
                let x_coord = i2 % n_symbols_in_full_row;
                x = x_coord * BLOCK_SIZE;
                y = y_coord * BLOCK_SIZE;
            }

            if x + BLOCK_SIZE <= width && y + BLOCK_SIZE <= height {
                set_block(x, y, sym);
            }
        }

        data
    }
}
