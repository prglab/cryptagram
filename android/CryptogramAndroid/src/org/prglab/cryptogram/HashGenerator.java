package org.prglab.cryptogram;
import java.io.IOException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

/**
 * Generates a Cryptogram-compliant SHA-256 checksum hex digest
 * @author david
 *
 */
public class HashGenerator {
	public static String generateSha256(String data){
		try{
			MessageDigest md = MessageDigest.getInstance("SHA-256");
			md.update(data.getBytes());
			
			byte[] byteData = md.digest();
			
			StringBuffer hexString = new StringBuffer();
	    	for (int i=0;i<byteData.length;i++) {
	    		String hex=Integer.toHexString(0xff & byteData[i]);
	   	     	if(hex.length()==1) hexString.append('0');
	   	     	hexString.append(hex);
	    	}
	    	
	    	return hexString.toString();
		}
		catch(NoSuchAlgorithmException e){
			throw new RuntimeException("SHA-256 unsupported! What kind of system is this???");
		}
	}
}
