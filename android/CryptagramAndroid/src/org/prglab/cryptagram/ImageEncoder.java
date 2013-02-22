package org.prglab.cryptagram;

import android.graphics.Bitmap;

/**
 * An interface for singleton Cryptagram image encoders of all versions.
 * @author david
 *
 */
public interface ImageEncoder {
	
	/**
	 * 
	 * @param data a string of base64 encoded data
	 * @param hash the hash of the data, also base64
	 * @param widthHeightRatio the desired shape of the resulting image
	 * @return the encoded Cryptagram image
	 */
	public abstract Bitmap encodeToBitmap(String data, double widthHeightRatio);
}
