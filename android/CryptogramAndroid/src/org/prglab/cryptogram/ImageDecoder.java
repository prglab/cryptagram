package org.prglab.cryptogram;

import android.graphics.Bitmap;

public interface ImageDecoder {
	/**
	 * Try decoding the given bitmap with the given password using a
	 * Cryptagram decoding scheme
	 * 
	 * @param encryptedImage the Bitmap of the image to decode
	 * @param password the password protecting the image
	 * @return the base64-encoded data in the image
	 */
	public abstract String decodeBitmap(Bitmap encryptedImage, String password);
}
