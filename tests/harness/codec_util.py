#!/usr/bin/env python3

from PIL import Image

BASE64_VALUES = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
SYMBOL_THRESHOLDS = [0, 36, 72, 109, 145, 182, 218, 255]
BLOCK_SIZE = 2

class BacchantCodec:
    def __init__(self):
        self.block_size = BLOCK_SIZE

    def _get_luma_indices(self, char):
        idx = BASE64_VALUES.find(char)
        if idx == -1:
            raise ValueError(f"Invalid base64 char: {char}")
        return idx // 8, idx % 8

    def encode(self, payload, width=None, aspect=1.0):
        length_str = f"{len(payload):08d}"
        full_data = length_str + payload
        
        symbols = []
        for char in full_data:
            s0, s1 = self._get_luma_indices(char)
            symbols.append(s0)
            symbols.append(s1)
            
        n_header_values = 16
        header_dim = 8
        n_payload_symbols = len(symbols)
        total_pixels = (n_payload_symbols * (BLOCK_SIZE**2)) + (header_dim**2)
        
        if width is None:
            height = (total_pixels / aspect)**0.5
            width = int(aspect * height)
            width = ((width + 3) // 4) * 4
            height = ((int(total_pixels / width) + 1) // 2) * 2
            if width * height < total_pixels:
                height += 2
        
        img = Image.new("RGB", (width, height), (128, 128, 128))
        pixels = img.load()

        def set_block(x, y, symbol):
            level = SYMBOL_THRESHOLDS[symbol]
            for i in range(BLOCK_SIZE):
                for j in range(BLOCK_SIZE):
                    pixels[x + i, y + j] = (level, level, level)

        header_str = "bacchant"
        header_symbols = []
        for char in header_str:
            s0, s1 = self._get_luma_indices(char)
            header_symbols.append(s0)
            header_symbols.append(s1)
            
        for i, sym in enumerate(header_symbols):
            x = (i % 4) * BLOCK_SIZE
            y = (i // 4) * BLOCK_SIZE
            set_block(x, y, sym)

        n_header_row_symbols_wide = (width - header_dim) // BLOCK_SIZE
        for i, sym in enumerate(symbols):
            if i < n_header_row_symbols_wide * 4:
                y_coord = i // n_header_row_symbols_wide
                x_coord = i % n_header_row_symbols_wide
                x = header_dim + (x_coord * BLOCK_SIZE)
                y = y_coord * BLOCK_SIZE
            else:
                i2 = i + n_header_values
                n_symbols_in_full_row = width // BLOCK_SIZE
                y_coord = i2 // n_symbols_in_full_row
                x_coord = i2 % n_symbols_in_full_row
                x = x_coord * BLOCK_SIZE
                y = y_coord * BLOCK_SIZE
            
            if x + BLOCK_SIZE <= width and y + BLOCK_SIZE <= height:
                set_block(x, y, sym)

        return img, symbols

    def decode(self, img):
        rgb = img.convert("RGB")
        width, height = rgb.size
        pixels = rgb.load()
        
        def get_bin(x, y):
            total = 0
            for i in range(BLOCK_SIZE):
                for j in range(BLOCK_SIZE):
                    r, g, b = pixels[x + i, y + j]
                    lum = 0.299 * r + 0.587 * g + 0.114 * b
                    total += lum
            avg = total / (BLOCK_SIZE**2)
            inc = 255.0 / 7.0
            out = round(avg / inc)
            return min(7, max(0, out))

        header_size = 8
        header = ""
        for y in range(0, header_size, BLOCK_SIZE):
            for x in range(0, header_size, 2 * BLOCK_SIZE):
                b0 = get_bin(x, y)
                b1 = get_bin(x + BLOCK_SIZE, y)
                header += BASE64_VALUES[b0 * 8 + b1]
        
        if header != "bacchant":
            return None, "invalid header"

        y = 0
        length_chars = ""
        payload_chars = ""
        payload_len = None
        count = 0
        while y < height:
            x = 0
            while x + BLOCK_SIZE < width:
                if y < header_size and x < header_size:
                    x += BLOCK_SIZE * 2
                    continue
                b0 = get_bin(x, y)
                b1 = get_bin(x + BLOCK_SIZE, y)
                ch = BASE64_VALUES[b0 * 8 + b1]
                if y == 0 and x < header_size + 16 * BLOCK_SIZE:
                    length_chars += ch
                else:
                    if payload_len is None:
                        try:
                            payload_len = int(length_chars, 10)
                        except ValueError:
                            return None, "invalid length"
                    payload_chars += ch
                    count += 1
                    if count >= payload_len:
                        return payload_chars[:payload_len], "ok"
                x += BLOCK_SIZE * 2
            y += BLOCK_SIZE
        return payload_chars, "incomplete"

class AestheteCodec:
    def __init__(self):
        self.block_size = BLOCK_SIZE

    def decode(self, img):
        rgb = img.convert("RGB")
        width, height = rgb.size
        pixels = rgb.load()
        
        def get_bin(x, y):
            total = 0
            for i in range(BLOCK_SIZE):
                for j in range(BLOCK_SIZE):
                    _, g, _ = pixels[x + i, y + j]
                    total += g
            v = total / (BLOCK_SIZE**2)
            b = int(v // 28.0)
            if b == 0:
                return -1
            if b > 8:
                return 0
            return 8 - b

        header_size = 8
        header = ""
        for y in range(0, header_size, BLOCK_SIZE):
            for x in range(0, header_size, 2 * BLOCK_SIZE):
                b0 = get_bin(x, y)
                b1 = get_bin(x + BLOCK_SIZE, y)
                if b0 < 0 or b1 < 0:
                    return None, "invalid header"
                header += BASE64_VALUES[b0 * 8 + b1]
        
        if header != "aesthete":
            return None, "invalid header"

        y = 0
        payload = ""
        while y < height:
            x = 0
            while x + BLOCK_SIZE < width:
                if y < header_size and x < header_size:
                    x += BLOCK_SIZE * 2
                    continue
                b0 = get_bin(x, y)
                b1 = get_bin(x + BLOCK_SIZE, y)
                if b0 == -1 or b1 == -1:
                    return payload, "ok"
                payload += BASE64_VALUES[b0 * 8 + b1]
                x += BLOCK_SIZE * 2
            y += BLOCK_SIZE
        return payload, "incomplete"
