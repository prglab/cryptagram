package org.prglab.cryptogram;

import java.util.ArrayList;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;

/**
 * Encodes a data stream to a Cryptogram-compliant bitmap
 * @author david
 *
 */
public class ImageEncoder {

	/**RL Grayscale bins */
	private final int[] THRESHOLDS = {	
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
		return base64Symbols.indexOf(symbol);
	}
	
	public static Bitmap encodeToBitmap(String data, String header, double widthHeightRatio){
		int length = data.length() + header.length();
		int numPixels = 2*2*length;
		// Add a little extra space
		int width = (int) Math.sqrt(numPixels*widthHeightRatio);
		int height = (int)(width/widthHeightRatio) + 1;
		
		
		Bitmap encodedBitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
		
		
		
		return encodedBitmap;
	}
	
	public static Bitmap encodeBase64(String data, String header, double widthHeightRatio){
		ArrayList<Integer> headerOctal = getOctalArray(header);
	    ArrayList<Integer> dataOctal = getOctalArray(data);
	    
	    
	    
	    return encodeToBitmap(data, header, widthHeightRatio);
	}
}
