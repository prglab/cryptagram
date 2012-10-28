package org.prglab.cryptogram;

import java.util.ArrayList;

/** Implements internals of the Cryptogram encoding properly */
public class CryptogramEncoding {
	
	/** Data block width in pixels */
	public final static int BLOCK_HEIGHT = 2;
	/** Data block height in pixels */
	public final static int BLOCK_WIDTH  = 2;
	
	/** Header width in pixels */
	public final static int HEADER_WIDTH = 8;
	
	/** Header height in pixels */
	public final static int HEADER_HEIGHT = 8;

	/**RL Grayscale bins */
	public final static int[] THRESHOLDS = {	
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
	
	public static ArrayList<Integer> getOctalArray(String data){
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
}
