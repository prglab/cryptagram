package org.prglab.cryptogram;

import java.io.UnsupportedEncodingException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
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
	
	/** Data block width in pixels */
	private final static int BLOCK_HEIGHT = 2;
	/** Data block height in pixels */
	private final static int BLOCK_WIDTH  = 2;
	
	/** Header width in pixels */
	private final static int HEADER_WIDTH = 8;
	
	/** Header height in pixels */
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
	
	public static String computeHash(String input) throws NoSuchAlgorithmException{
	    MessageDigest digest = MessageDigest.getInstance("SHA-256");
	    digest.reset();
	    try{
	      digest.update(input.getBytes("UTF-8"));
	    } catch (UnsupportedEncodingException e){
	      e.printStackTrace();
	    }

	    byte[] byteData = digest.digest(input.getBytes());
	    StringBuffer sb = new StringBuffer();

	    for (int i = 0; i < byteData.length; i++){
	      sb.append(Integer.toString((byteData[i] & 0xff) + 0x100, 16).substring(1));
	    }
	    return sb.toString();
	}

	
	public static Bitmap encodeBase64(String data, String header, double widthHeightRatio){
		// get rid of those pesky spaces
		data = data.replace(" ", "");
		header = header.replace(" ", "");
		
		String checksum = "";
		
		try {
			checksum = computeHash(data);
		
		}
		catch (NoSuchAlgorithmException e) {
			throw new RuntimeException("Can't encode sha-256!!");
			
		}
		
		ArrayList<Integer> headerOctal = getOctalArray(header);
	    ArrayList<Integer> dataOctal = getOctalArray(checksum + data);
	    
	    return encodeToBitmap(dataOctal, headerOctal, widthHeightRatio);
	}
}
