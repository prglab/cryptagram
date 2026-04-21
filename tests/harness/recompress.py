#!/usr/bin/env python3

import base64
import random
import sys
import io
from pathlib import Path
from PIL import Image

from codec_util import BacchantCodec, BASE64_VALUES

def run_test(payload_len=100):
    codec = BacchantCodec()
    payload = "".join(random.choice(BASE64_VALUES) for _ in range(payload_len))
    
    print(f"Testing payload length: {payload_len}")
    print(f"{'Quality':>8} | {'Status':>10} | {'Match?':>6} | {'Error Rate':>10}")
    print("-" * 45)
    
    # Baseline PNG
    img_png, _ = codec.encode(payload)
    decoded_png, status_png = codec.decode(img_png)
    
    for q in [100, 95, 90, 85, 80, 75, 70, 60, 50, 40, 30]:
        # Recompress
        buf = io.BytesIO()
        img_png.save(buf, format="JPEG", quality=q)
        buf.seek(0)
        img_jpg = Image.open(buf)
        
        # Decode
        decoded, status = codec.decode(img_jpg)
        
        if decoded is None:
            print(f"{q:>8} | {status:>10} | {'FAIL':>6} | {'N/A':>10}")
            continue
            
        matches = decoded == payload
        errors = sum(1 for a, b in zip(decoded, payload) if a != b)
        error_rate = errors / len(payload)
        
        match_str = "YES" if matches else "NO"
        print(f"{q:>8} | {status:>10} | {match_str:>6} | {error_rate:>10.2%}")

if __name__ == "__main__":
    run_test(500)
