package org.prglab.cryptogram;

import java.io.ByteArrayOutputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.OutputStream;
import java.net.URLDecoder;
import java.util.ArrayList;
import java.util.StringTokenizer;

import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.provider.MediaStore;
import android.provider.MediaStore.Images;
import android.app.Activity;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.Bitmap.CompressFormat;
import android.view.Menu;
import android.view.View;
import android.webkit.ConsoleMessage;
import android.webkit.WebChromeClient;
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
		        
		        //Toast.makeText(getApplicationContext(), func + " " + parameter, Toast.LENGTH_SHORT ).show();
		        if ( func.equalsIgnoreCase("setDataUrl") ) {
		           Toast.makeText(getApplicationContext(), "android call 01 value received: " + parameter, Toast.LENGTH_SHORT).show();
		           // do your stuff here.....
		           dataAccessor.setDataUrl(parameter);
		           //return true;			       
		           
		        }else if ( func.equalsIgnoreCase("setIv") ){
		        	
		        	dataAccessor.setIv(parameter);
		        	
		        }else if ( func.equalsIgnoreCase("setCt")) {
		        	dataAccessor.setCt(parameter);
		        }
		        
		        else if ( func.equalsIgnoreCase("setSalt")){
		        	dataAccessor.setSalt(parameter);
		        }
		        
		        else if ( func.equalsIgnoreCase("setHash")){
		        	Toast.makeText(context, "Got Hash" + parameter, Toast.LENGTH_SHORT).show();
		        	dataAccessor.setHash(parameter);
		        }
		        		
		        
		        else if ( func.equalsIgnoreCase("setDone") ) {
		        	Toast.makeText(getApplicationContext(), "Done sending!", Toast.LENGTH_SHORT).show();
		        	dataAccessor.setDone();
		        	
		        } else {
		           // its not an android call back 
		           // let the browser navigate normally
		           //return false;
		        }
		   }   
		}
	
	/**
	 * A class to share data with the javascript cryptogram encoder library.
	 * @author david
	 *
	 */
	public class DataAccessor{
		
		// Synchronizing access function in case real JS interface is implemented later,
		// functions may be called asynchronously.
		
		String inputData;
		String passwordString;
		String dataUrl;
		boolean done = false;
		
		String ct;
		String iv;
		String salt;
		String hash;
		
		int width;
		int height;

		ArrayList<Short> RgbAl;
		
		public DataAccessor(){
			RgbAl = new ArrayList<Short>();		
		}
		
		public synchronized void setIv(String jsIv){
			iv = jsIv;
		}
		
		public synchronized String getIv(){
			return iv;
		}
		
		public synchronized void setSalt(String jsSalt){
			salt = jsSalt;
		}
		
		public synchronized String getSalt(){
			return salt;
		}
		
		public synchronized void setCt(String jsCt){
			Toast.makeText(context, jsCt, Toast.LENGTH_SHORT).show();
			ct = jsCt;
		}
		
		public synchronized String getCt(){
			return ct;
		}
		
		public synchronized void setHash(String hash){
			this.hash = hash;
		}
		
		public synchronized String getHash(){
			return hash;
		}
		
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
		
		public synchronized void setDataUrl(String dataUrl){
			this.dataUrl = dataUrl;
		}
		
		public synchronized void setWidthHeight(String widthHeight){
			String[] wh = widthHeight.split(",");
			width = Integer.parseInt(wh[0]);
			height = Integer.parseInt(wh[1]);
				
		}
		
		public synchronized void buildRGB(String data){
			String[] tokens = data.split(",");
			for (int i = 0; i < tokens.length; i++){
				RgbAl.add(Short.parseShort(tokens[i]));
			}		
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
			
    		base64String = Base64.encodeToString(readBuffer, Base64.NO_WRAP | Base64.NO_PADDING);
    		
    		// Debugging with toasts: the best way to debug
    		//Toast.makeText(this, base64String, Toast.LENGTH_SHORT).show();
		}
		
		catch (Exception e){
			Toast.makeText(this, "Could not read file, aborting..." + e.toString(), Toast.LENGTH_SHORT).show();
			return;
		}
		
		
		dataAccessor.setData(base64String);
		//TODO:Implement password prompt
		dataAccessor.setPassword("password");
		
		// Send the string to the WebView here using DataAccessor
		//jsExecutionView.addJavascriptInterface(dataAccessor, "dataAccessor");
		jsExecutionView.getSettings().setJavaScriptEnabled(true);
		jsExecutionView.setWebViewClient(new workaroundWebViewClient());
		
		jsExecutionView.setWebChromeClient(new WebChromeClient() {
			
			@Override
			public boolean onConsoleMessage(ConsoleMessage consoleMessage){
				Toast.makeText(context, consoleMessage.message() + ":" + Integer.toString(consoleMessage.lineNumber()), Toast.LENGTH_SHORT).show();
				
				return true;
			}
			
			
		});
		
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
    	String base64String =  dataAccessor.getIv() + dataAccessor.getSalt() + dataAccessor.getCt() ;
    	
    	Bitmap encodedBitmap = ImageEncoder.encodeBase64(base64String, dataAccessor.getHash(), "aesthete", imageBitmap.getWidth()/(double)imageBitmap.getHeight());

		imagePreview.setImageBitmap(encodedBitmap);
		
		Toast.makeText(this, "Exporting image to gallery", Toast.LENGTH_SHORT).show();
		
		String filename = String.valueOf(System.currentTimeMillis());
		ContentValues values = new ContentValues();
		values.put(Images.Media.TITLE, filename);
		values.put(Images.Media.DATE_ADDED, System.currentTimeMillis());
		values.put(Images.Media.MIME_TYPE, "image/jpeg");
		
		Uri uri = context.getContentResolver().insert(Images.Media.EXTERNAL_CONTENT_URI, values);
		try {
			OutputStream outStream = context.getContentResolver().openOutputStream(uri);
			encodedBitmap.compress(Bitmap.CompressFormat.JPEG, 90, outStream);
			outStream.flush();
			outStream.close();			
		} catch (FileNotFoundException e){
			
			e.printStackTrace();
		} catch (IOException e){
			e.printStackTrace();
		}
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
