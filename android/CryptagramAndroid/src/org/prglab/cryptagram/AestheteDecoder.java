package org.prglab.cryptagram;

import android.graphics.Bitmap;
import android.graphics.Color;
import android.util.Base64;

/** Skeleton for AestheteDecoder */
public class AestheteDecoder implements ImageDecoder {
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
	
	/** The base64 header string for the cryptogram protocol */
	private final static String PROTOCOL_NAME = "aesthete";

	/**RL Grayscale bins */
	/*
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
	};*/
	
	public static final String base64Symbols = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
	
	private static int getBase8(Bitmap encryptedImage, int x, int y){
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
	
	private static String getHeader(Bitmap encryptedImage){
		
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
	
	/**
	 * Try decoding the given bitmap with the given password using the
	 * Cryptagram decoding scheme
	 * 
	 * @param encryptedImage the Bitmap of the image to decode
	 * @param password the password protecting the image
	 * @return the base64-encoded data in the image
	 */
	public String decodeBitmap(Bitmap encryptedImage, String password){
		StringBuilder imageData = new StringBuilder();
		
		String header = getHeader(encryptedImage);
		if (!header.equals(PROTOCOL_NAME)){
			return null;
		}

		for (int y = 0; y < encryptedImage.getHeight(); y += BLOCK_HEIGHT){
			for (int x = 0; x < encryptedImage.getWidth(); x += BLOCK_WIDTH * 2){
				
				// Skip the header block
				if (y < HEADER_HEIGHT && x < HEADER_WIDTH){
					continue;
				}
				
				int upperBase8 = getBase8(encryptedImage, x, y);
				int lowerBase8 = getBase8(encryptedImage, x + HEADER_WIDTH, y);
				
				int base64num = 8*upperBase8 +lowerBase8;
				
				if (base64num > 0){
					char base64char = base64Symbols.charAt(base64num);
					imageData.append(base64char);
				}
				
			}
		}
		
		return imageData.toString();

	}

}
