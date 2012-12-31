package org.prglab.cryptogram;

import java.io.UnsupportedEncodingException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;

import android.graphics.Bitmap;
import android.graphics.Color;

public class ImageDecoder {
	/** Data block width in pixels */
	private final static int BLOCK_HEIGHT = 2;
	/** Data block height in pixels */
	private final static int BLOCK_WIDTH  = 2;
	
	/** Header width in pixels */
	private final static int HEADER_WIDTH = 8;
	
	/** Header height in pixels */
	private final static int HEADER_HEIGHT = 8;
	
	/** Bin size - the decoder uses 28 for now, but a more complicated binning scheme may be in order **/
	private final static int BIN_SIZE = 28;

	/**RL Grayscale bins */
	private final static int[] THRESHOLDS = {	
	238,
    210,
    182,
    154,
    126,
    98,
    70,
    42,
    14
	};
	
	public static final String base64Symbols = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
	
	private int getBase8(Bitmap encryptedImage, int x, int y){
		int count = 0;
		double avg = 0.0;
		
		for (int i = 0; i < BLOCK_WIDTH; i++){
			for (int j = 0; j < BLOCK_HEIGHT; j++){
				
			     // Use green to estimate the luminance
				int green = Color.green(encryptedImage.getPixel(x + i, y + j));
				avg += green;
				count++;
				
			}
		}
		
		// Get the average
		avg /= count;
		
		int bin = (int)Math.floor(avg / BIN_SIZE);
		
		if (bin == 0) return -1;
		if (bin > 8) return 0;
		
		return 8 - bin;
	}
	
	private String getHeader(Bitmap encryptedImage){
		
		StringBuilder base64Sb= new StringBuilder();
		for (int y = 0; y < HEADER_HEIGHT; y += BLOCK_HEIGHT){
			for (int x = 0; x < HEADER_WIDTH; x += 2 * BLOCK_WIDTH){
				int upperBase8 = getBase8(encryptedImage, x, y);
				int lowerBase8 = getBase8(encryptedImage, x+BLOCK_WIDTH, y);
				int base64 = 8*upperBase8 + lowerBase8;
				if (base64 > 0){
					char base64char = base64Symbols.charAt(base64);
					base64Sb.append(base64char);
				}
			}
		
		}
		
		return base64Sb.toString();
	
	}
	
	public static Bitmap decodeBitmap(Bitmap encryptedImage, String password){
		int length = data.size() * BLOCK_WIDTH*BLOCK_HEIGHT + HEADER_HEIGHT * HEADER_WIDTH;
		// Add a little extra space
		int width = (int)Math.ceil(Math.sqrt(length*widthHeightRatio));
		int height = (int)Math.ceil(width/widthHeightRatio);
		
		// Make output height a multiple of block height
		height = (int)Math.ceil(Math.ceil((double)height) / BLOCK_HEIGHT) * BLOCK_HEIGHT;
		
		// Make width a multiple of block width * 2 so that all octal pairs are contained in the same line
		width = (int)Math.ceil((double)width / (2*BLOCK_WIDTH)) * 2 * BLOCK_WIDTH;
					
		int[] imageData = new int[(int)(width*height)];
		
		// Write header
		for (int y = 0; y < HEADER_HEIGHT; y += BLOCK_HEIGHT){
			for (int x = 0; x < HEADER_WIDTH; x += BLOCK_WIDTH){
				int idx = (x / BLOCK_WIDTH + (y / BLOCK_HEIGHT) * (HEADER_WIDTH / BLOCK_WIDTH)); 
				int val = THRESHOLDS[header.get(idx)];
				int pixel = Color.argb(255, val, val, val);
				
				//TODO: Change this to be block-size agnostic later
				imageData[(y*width + x)] = pixel;
				imageData[(y*width + x + 1)] = pixel;
				imageData[((y+1)*width + x)] = pixel;
				imageData[((y+1)*width + x + 1)] = pixel;
			}
			
		}
		
		int headerRowSymbolsWidth = (int)((width - HEADER_WIDTH) / BLOCK_WIDTH);
		int headerRowSymbolsTotal = (int)(headerRowSymbolsWidth * (HEADER_HEIGHT / BLOCK_HEIGHT));
		
		for (int i = 0; i < data.size(); i++){
			int idx = data.get(i);
			int val = THRESHOLDS[idx];
			int x;
			int y;
			
			if (i < headerRowSymbolsTotal){
				y = i / headerRowSymbolsWidth;
				x = (i - (y*headerRowSymbolsWidth));
				x = (HEADER_WIDTH + (x * BLOCK_WIDTH));
			}
			else{
				int new_i = i + header.size();
				y = (int)Math.floor(new_i / (width/BLOCK_WIDTH));
				x = new_i - (y * (width/BLOCK_WIDTH));
				x *= BLOCK_WIDTH;
				
			}
			
			y *= BLOCK_WIDTH;
			
			int pixel = Color.argb(255, val, val, val);
			
			//TODO: Change this to be block-size agnostic later
			imageData[(y*width + x)] = pixel;
			imageData[(y*width + x + 1)] = pixel;
			imageData[(y+1)*width + x] = pixel;
			imageData[((y+1)*width + x + 1)] = pixel;
		}
		
		Bitmap encodedBitmap = Bitmap.createBitmap(imageData, (int)width, (int)height, Bitmap.Config.ARGB_8888);
		
		
		return encodedBitmap;
	}

}
