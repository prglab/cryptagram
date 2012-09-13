package org.prglab.cryptogram;

import java.io.ByteArrayOutputStream;

import android.net.Uri;
import android.os.Bundle;
import android.provider.MediaStore;
import android.app.Activity;
import android.content.ContentResolver;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.Bitmap.CompressFormat;
import android.view.Menu;
import android.view.View;
import android.webkit.WebView;
import android.widget.Button;
import android.widget.ImageView;
import android.util.Base64;
import android.util.Log;
import android.widget.Toast;

import android.webkit.MimeTypeMap;

public class MainActivity extends Activity {
	
	public final String DEBUG_TAG = "Cryptogram Main Activity";
	private final int GALLERY_IMAGE_CODE = 1;
	private final int CAMERA_IMAGE_CODE = 2;
	
	/**
	 * A class to share data with the sjcl javascript library. Passed with
	 * @author david
	 *
	 */
	public class DataAccessor{
		String inputData;
		String encryptedData;
		boolean done = false;
		
		public DataAccessor(String input){
			this.inputData = input;
		}
		
		public synchronized String getData(){
			return inputData;
		}
		
		public synchronized void setEncryptedData(String encrypted){
			this.encryptedData = encrypted;
		}
		
		public synchronized boolean isDone(){
			return done;		
		}
	}
	

	Button buttonTakePhoto;
	Button buttonSelectPhoto;
	Button buttonUploadPhoto;
	
	ImageView imagePreview;
	WebView jsExecutionView;
	
	Uri imageUri;
	
	Bitmap imageBitmap;
	
	
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        
        buttonTakePhoto = (Button) findViewById(R.id.button_snap_photo);
        buttonSelectPhoto = (Button) findViewById(R.id.button_select_photo);
        buttonUploadPhoto = (Button) findViewById(R.id.button_upload_photo);
        
        imagePreview = (ImageView) findViewById(R.id.image_preview);
        jsExecutionView = (WebView) findViewById(R.id.js_encryption_webview);
    }
    
    /**
     * Click handler of buttonSelectPhoto
     * @param v Clicked view
     */
    public void selectPhoto(View v){
	    Intent intent = new Intent(Intent.ACTION_PICK,
		android.provider.MediaStore.Images.Media.EXTERNAL_CONTENT_URI);
		startActivityForResult(intent, GALLERY_IMAGE_CODE);
    }
    
    /**
     * Click handler of buttonSnapPhoto
     * @param v
     */
    public void takePhoto(View v){
    	return;
    }
    
    /**
     * Click handler of buttonUploadPhoto
     * @param v
     */
    public void encryptPhoto(View v){
    	// Convert the image to jpeg if it is not already. Then turn it into a base-64 stream   	
    	String base64String;    	

		try{
			ByteArrayOutputStream byteOut = new ByteArrayOutputStream();
    		
			imageBitmap.compress(CompressFormat.JPEG, 80, byteOut);
			byte[] readBuffer = byteOut.toByteArray();
			
    		base64String = Base64.encodeToString(readBuffer, Base64.DEFAULT);
    		
    		// Debugging with toasts: the best way to debug
    		Toast.makeText(this, base64String, Toast.LENGTH_SHORT).show();
		}
		
		catch (Exception e){
			Toast.makeText(this, "Could not read file, aborting..." + e.toString(), Toast.LENGTH_SHORT).show();
			return;
		}
		
		// Send the string to the WebView here using DataAccessor
    }

	/**
     * Set the image to a result from the gallery
     * @param data
     */
    void useImageFromGallery(Intent data){
    	Uri targetUri = data.getData();
	   	// Just show the uri in a Toast for now, we'll do something with it later
	   	Toast.makeText(this, targetUri.toString(), Toast.LENGTH_SHORT).show();
	
	   		
	   	try{
		   	imageBitmap = MediaStore.Images.Media.getBitmap(getContentResolver(), targetUri);
		   	imagePreview.setImageBitmap(imageBitmap);
	   	}
	   	catch(Exception e){
	   		Toast.makeText(this, "could not find file", Toast.LENGTH_SHORT).show();
	   	}
	   	//imagePreview.setImageURI(targetUri);
	   	
	   	
	   	imageUri = targetUri;
    }
    
    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
	     // TODO Auto-generated method stub
	     super.onActivityResult(requestCode, resultCode, data);
	
	     if (resultCode == RESULT_OK){
	    	 switch (requestCode){
	    	 	case GALLERY_IMAGE_CODE:
	    	 		useImageFromGallery(data);
	    	 		break;
	    		
	    	 	case CAMERA_IMAGE_CODE:
	    	 		break;
	    	 }
	    	 	      
	     }
    }

    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        getMenuInflater().inflate(R.menu.activity_main, menu);
        return true;
    }
}
