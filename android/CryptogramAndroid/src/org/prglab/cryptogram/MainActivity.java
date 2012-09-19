package org.prglab.cryptogram;

import java.io.ByteArrayOutputStream;
import java.net.URLDecoder;
import java.util.StringTokenizer;

import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.provider.MediaStore;
import android.app.Activity;
import android.content.ContentResolver;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.Bitmap.CompressFormat;
import android.view.Menu;
import android.view.View;
import android.webkit.WebView;
import android.webkit.WebViewClient;
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
	
	private final String HEADER = "aesthete";
	
	/**
	 * Workaround for broken addJavascriptInterface
	 * @see http://code.google.com/p/android/issues/detail?id=12987
	 */
	private class workaroundWebViewClient extends WebViewClient {
		   @Override
		   public void onLoadResource(WebView view, String url) {
		        //Toast.makeText(getBaseContext(), "shouldOverrideUrlLoadin url: " + url, Toast.LENGTH_SHORT).show();
			    
		        StringTokenizer st = new StringTokenizer(url, "|");
		        //Toast.makeText(getApplicationContext(), "Recieved request " + url, Toast.LENGTH_LONG ).show();
		        if (st.countTokens() < 3)
		        	return;
		        st.nextToken();
		        String func = st.nextToken();
		        String parameter = URLDecoder.decode(st.nextToken());
		        
		        Toast.makeText(getApplicationContext(), func + " " + parameter, Toast.LENGTH_SHORT ).show();
		        if ( func.equalsIgnoreCase("setIv") ) {
		           Toast.makeText(getApplicationContext(), "android call 01 value received: " + parameter, Toast.LENGTH_SHORT).show();
		           // do your stuff here.....
		           dataAccessor.setIv(parameter);
		           //return true;
		        } else if ( func.equalsIgnoreCase("setSalt") ) {
		           Toast.makeText(getApplicationContext(), "android call 02 value received: " + parameter, Toast.LENGTH_SHORT).show();
		           dataAccessor.setSalt(parameter);
		           //return true;  
		           
		        }else if ( func.equalsIgnoreCase("setCt")){
		           Toast.makeText(getApplicationContext(), "android call 03 value received: " + parameter, Toast.LENGTH_SHORT).show();
			       dataAccessor.setCt(parameter);
		           //return true;
			       
		        }else if ( func.equalsIgnoreCase("setDone") ) {
		        	dataAccessor.setDone();
		        	
		        } else {
		           // its not an android call back 
		           // let the browser navigate normally
		           //return false;
		        }
		   }   
		}
	
	/**
	 * A class to share data with the sjcl javascript library. Passed with
	 * @author david
	 *
	 */
	public class DataAccessor{
		String inputData;
		String iv;
		String salt;
		String ct;
		String passwordString;
		boolean done = false;
		
		public synchronized void setData(String data){
			inputData = data;
		}
		
		public synchronized void setPassword(String password){
			passwordString = password;
		}
		
		public synchronized String getData(){
			return inputData;
		}
		
		public synchronized String getPassword(){
			return passwordString;
		}
		
		public synchronized void setIv(String iv){
			this.iv = iv;
		}
		
		public synchronized String getIv(){
			return iv;
		}
		
		public synchronized void setSalt(String salt){
			this.salt = salt;
		}
		
		public synchronized String getSalt(){
			return salt;
		}
		
		public synchronized void setCt(String ct){
			this.ct = ct;
		}
		
		public synchronized String getCt(){
			return ct;
		}
		
		public synchronized void setDone(){
			done = true;
			
			// Run code on the main thread
			// Get a handler that can be used to post to the main thread
			Handler mainHandler = new Handler(context.getMainLooper());

			// Currently running the encode on the main thread - this will hang the UI for a bit
			// Will thread it later
			Runnable myRunnable = new Runnable(){
				
				public void run(){
					encodeToImage();
				}
				
			}; 
			mainHandler.post(myRunnable);

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
	
	DataAccessor dataAccessor;
	
	Context context;
	
	Bitmap cryptogramImage;
	
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        
        buttonTakePhoto = (Button) findViewById(R.id.button_snap_photo);
        buttonSelectPhoto = (Button) findViewById(R.id.button_select_photo);
        buttonUploadPhoto = (Button) findViewById(R.id.button_upload_photo);
        
        jsExecutionView = (WebView) findViewById(R.id.js_encryption_webview);
        imagePreview = (ImageView) findViewById(R.id.image_preview);
        
        dataAccessor = new DataAccessor();
        
        context = this;
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
    	Toast.makeText(this, "Starting encode", Toast.LENGTH_SHORT).show();
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
		
		dataAccessor.setData(base64String);
		//TODO:Implement password prompt
		dataAccessor.setPassword("password");
		
		// Send the string to the WebView here using DataAccessor
		jsExecutionView.addJavascriptInterface(dataAccessor, "dataAccessor");
		jsExecutionView.getSettings().setJavaScriptEnabled(true);
		jsExecutionView.setWebViewClient(new workaroundWebViewClient());
		jsExecutionView.loadUrl("file:///android_asset/run_sjcl.html?password="+"password"+"&data="+base64String);
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
    
    private void encodeToImage(){
    	String encodeData = dataAccessor.getIv() + dataAccessor.getSalt() + dataAccessor.getCt();
    	String hash = HashGenerator.generateSha256(encodeData);
    	encodeData = hash + encodeData; 
  
    	cryptogramImage = ImageEncoder.encodeBase64(encodeData, HEADER, imageBitmap.getWidth()/((double)imageBitmap.getHeight()));
    	imagePreview.setImageBitmap(cryptogramImage);
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
