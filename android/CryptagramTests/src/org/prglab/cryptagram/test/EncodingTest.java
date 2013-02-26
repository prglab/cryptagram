package org.prglab.cryptagram.test;

import junit.framework.TestCase;

import org.prglab.cryptagram.*;

import java.util.Random;

import android.graphics.Bitmap;
import android.util.Base64;

public class EncodingTest extends TestCase {
	
	private static final int NUM_BYTES = 1024 * 10; // 10 KB for now
	private String testPayload;
	
	protected void setUp(){
		Random r = new Random();
		byte[] randomBytes = new byte[NUM_BYTES];
		r.nextBytes(randomBytes);
		
		testPayload = Base64.encodeToString(randomBytes, Base64.NO_PADDING | Base64.NO_WRAP);
	}
	
	public void testAestheteCodec(){
		Bitmap b = AestheteEncoder.getEncoder().encodeToBitmap(testPayload, 1f);
		String s = "";
		try{
			s = AestheteDecoder.getDecoder().decodeBitmap(b);
		}
		catch (ImageDecoder.HashCheckFailedException e){
			assertTrue(false);
		}
		assertTrue(testPayload.equals(s));
	}
	
	public void testBacchantCodec(){
		Bitmap b = BacchantEncoder.getEncoder().encodeToBitmap(testPayload, 1);
		String s = BacchantDecoder.getDecoder().decodeBitmap(b);
		
		assertTrue(testPayload.equals(s));	
	}
	
	public void testCodecDetection(){
		Bitmap b = BacchantEncoder.getEncoder().encodeToBitmap(testPayload, 1);
		String s = "";
		try{
			s = ImageDecoderFactory.getDecoder(b).decodeBitmap(b);
		}
		catch (ImageDecoder.HashCheckFailedException e){
			assertTrue(false);
		}
		
		assertTrue(testPayload.equals(s));
		
		b = AestheteEncoder.getEncoder().encodeToBitmap(testPayload, 1);
		try{
			s = ImageDecoderFactory.getDecoder(b).decodeBitmap(b);
		}
		catch(ImageDecoder.HashCheckFailedException e){
			assertTrue(false);
		}
		assertTrue(testPayload.equals(s));		
	}
}
