package org.prglab.cryptogram;

import java.util.ArrayList;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.Color;

/**
 * Encodes a data stream to a Cryptogram-compliant bitmap
 * @author david
 *
 */
public class ImageEncoder {
	
	private final static double BLOCK_HEIGHT = 2;
	private final static double BLOCK_WIDTH  = 2;
	
	private final static int HEADER_WIDTH = 8;
	private final static int HEADER_HEIGHT = 8;

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
	
	private static ArrayList<Integer> getOctalArray(String data){
		ArrayList<Integer> builder = new ArrayList<Integer>();
		for (int i = 0; i < data.length(); i++){
			int val = getValueOfSymbol(data.charAt(i));
			int upper = val >> 3;
			int lower = val & 7;
			
			builder.add(upper);
			builder.add(lower);
		}
		
		return builder;
	}
	
	public static int getValueOfSymbol(char symbol){
		if (base64Symbols.indexOf(symbol) == -1){
			throw new RuntimeException("Invalid base64 symbol " + Character.toString(symbol));
		}
		return base64Symbols.indexOf(symbol);
	}
	
	public static Bitmap encodeToBitmap(ArrayList<Integer> data, ArrayList<Integer> header, double widthHeightRatio){
		int length = data.size() + header.size();
		// Add a little extra space
		double width = Math.ceil(Math.sqrt(length*widthHeightRatio));
		double height = Math.ceil(width/widthHeightRatio);
		
		// Make output height a multiple of block height
		height = Math.ceil(Math.ceil(height) / BLOCK_HEIGHT) * BLOCK_HEIGHT;
		
		// Make width a multiple of block width * 2 so that all octal pairs are contained in the same line
		width = Math.ceil(width / (2*BLOCK_WIDTH)) * 2 * BLOCK_WIDTH;
					
		int[] imageData = new int[(int)(width*height)];
		
		// Write header
		for (int y = 0; y < HEADER_HEIGHT; y += BLOCK_HEIGHT){
			for (int x = 0; x < HEADER_WIDTH; x += BLOCK_WIDTH){
				int idx = (int) (x / BLOCK_WIDTH + (y / BLOCK_HEIGHT) * (HEADER_WIDTH / BLOCK_WIDTH)); 
				int val = THRESHOLDS[header.get(idx)];
				int pixel = Color.argb(255, val, val, val);
				
				//TODO: Change this to be block-size agnostic later
				imageData[(int)(y*width + x)] = pixel;
				imageData[(int)(y*width + x + 1)] = pixel;
				imageData[(int)((y+1)*width + x)] = pixel;
				imageData[(int)((y+1)*width + x + 1)] = pixel;
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
				y = i / headerRowSymbolsTotal;
				x = (i - (y*headerRowSymbolsTotal));
				x = (int)(HEADER_WIDTH + (x * BLOCK_WIDTH));
			}
			else{
				int new_i = i + header.size();
				y = (int)Math.floor(new_i / (width/BLOCK_WIDTH));
				x = new_i - (int)(y * (width/BLOCK_WIDTH));
				x *= (int)BLOCK_WIDTH;
				
			}
			
			y *= (int)BLOCK_WIDTH;
			
			int pixel = Color.argb(255, val, val, val);
			
			//TODO: Change this to be block-size agnostic later
			imageData[(int)(y*width + x)] = pixel;
			imageData[(int)(y*width + x + 1)] = pixel;
			imageData[(int)((y+1)*width + x)] = pixel;
			imageData[(int)((y+1)*width + x + 1)] = pixel;
		}
		
		Bitmap encodedBitmap = Bitmap.createBitmap(imageData, (int)width, (int)height, Bitmap.Config.ARGB_8888);
		
		
		return encodedBitmap;
	}
	
	public static Bitmap encodeBase64(String data, String header, double widthHeightRatio){
		ArrayList<Integer> headerOctal = getOctalArray(header);
	    ArrayList<Integer> dataOctal = getOctalArray(data);
	    
	    return encodeToBitmap(dataOctal, headerOctal, widthHeightRatio);
	}
}
