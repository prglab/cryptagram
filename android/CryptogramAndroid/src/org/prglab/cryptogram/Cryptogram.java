package org.prglab.cryptogram;

import java.io.ByteArrayOutputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.OutputStream;
import java.net.URLDecoder;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.StringTokenizer;

import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.provider.MediaStore;
import android.provider.MediaStore.Images;
import android.provider.MediaStore.MediaColumns;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.ContentValues;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.Bitmap.CompressFormat;
import android.view.LayoutInflater;
import android.view.Menu;
import android.view.MenuItem;
import android.view.View;
import android.webkit.ConsoleMessage;
import android.webkit.WebChromeClient;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ImageView;
import android.util.Base64;
import android.util.Log;
import android.widget.Toast;


public class Cryptogram extends Activity {
	
	public final String DEBUG_TAG = "Cryptogram Main Activity";
	private final int GALLERY_IMAGE_CODE = 1;
	private final int CAMERA_IMAGE_CODE = 2;
	
	AlertDialog a;
	
	//TODO: Make this a user setting
	/** The largest width for an image so that the app doesn't crash.*/
	public final int MAX_IMAGE_WIDTH = 800;
	/** The largest height for an image so that the app doesn't crash.*/
	public final int MAX_IMAGE_HEIGHT = 600;
	
	/** The fewest number of characters acceptable in the password */
	public final int MIN_PASSWORD_LENGTH = 8;
	
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
		        @SuppressWarnings("deprecation")
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
				
				@Override
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
	
	int targetWidth, targetHeight;
	
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
    
    private void showPasswordPrompt(){
    	
    	// get prompts.xml view
    	LayoutInflater li = LayoutInflater.from(context);
		View promptsView = li.inflate(R.layout.password_prompt, null);

		AlertDialog.Builder alertDialogBuilder = new AlertDialog.Builder(
				context);

		// set prompts.xml to alertdialog builder
		alertDialogBuilder.setView(promptsView);
		
		alertDialogBuilder.setTitle(R.string.password_prompt);

		final EditText userInput = (EditText) promptsView
				.findViewById(R.id.inputText);

		// set dialog message
		alertDialogBuilder
			.setCancelable(false)
			.setPositiveButton("OK",
			  new DialogInterface.OnClickListener() {
			    @Override
				public void onClick(DialogInterface dialog,int id) {
			    	String password = userInput.getText().toString();
			    	if (password.length() >= MIN_PASSWORD_LENGTH)
			    		//Encrypt the photo using the user-defined password
			    		encryptPhoto(password);
			    	
			    	else
			    		Toast.makeText(context, "Please enter a password of at least " + MIN_PASSWORD_LENGTH + " characters.", Toast.LENGTH_LONG)
			    			.show();
			    }
			  })
			.setNegativeButton("Cancel",
			  new DialogInterface.OnClickListener() {
			    @Override
				public void onClick(DialogInterface dialog,int id) {
					dialog.cancel();
			    }
			  });

		// create alert dialog
		AlertDialog alertDialog = alertDialogBuilder.create();

		// show it
		alertDialog.show();
    
    }
    
    private void showSettingsView(View v){
    	return;
    }
    
    @SuppressLint("SetJavaScriptEnabled")
	private void encryptPhoto(String password){
    	String base64String; 
    	
    	try{
			ByteArrayOutputStream byteOut = new ByteArrayOutputStream();
			
			Toast.makeText(this, "Width: " + imageBitmap.getWidth() + " Height: " + imageBitmap.getHeight(), Toast.LENGTH_SHORT).show();
			
			//Make sure we don't crash the app with huge images: resize to something reasonable
			if (imageBitmap.getWidth() > MAX_IMAGE_WIDTH){
				//Resize the bitmap
				imageBitmap = Bitmap.createScaledBitmap(imageBitmap, MAX_IMAGE_WIDTH, (int)(MAX_IMAGE_WIDTH*(((double)imageBitmap.getHeight())/imageBitmap.getWidth())), true);
			}
			
			Toast.makeText(this, "Width: " + imageBitmap.getWidth() + " Height: " + imageBitmap.getHeight(), Toast.LENGTH_SHORT).show();
			
			if (imageBitmap.getHeight() > MAX_IMAGE_HEIGHT){
				//Resize the bitmap
				imageBitmap = Bitmap.createScaledBitmap(imageBitmap, (int)(MAX_IMAGE_HEIGHT*(((double)imageBitmap.getWidth())/imageBitmap.getHeight())), MAX_IMAGE_HEIGHT, true);
			}
			
			targetWidth = imageBitmap.getWidth();
			targetHeight = imageBitmap.getHeight();
			
			// Save some memory!
			imagePreview.setImageBitmap(null);
    		
			imageBitmap.compress(CompressFormat.JPEG, 80, byteOut);
			imageBitmap = null;
			byte[] readBuffer = byteOut.toByteArray();
			
    		base64String = Base64.encodeToString(readBuffer, Base64.NO_WRAP | Base64.NO_PADDING);
    		
    		// Debugging with toasts: the best way to debug
    		//Toast.makeText(this, base64String, Toast.LENGTH_SHORT).show();
		}
		
		catch (Exception e){
			Toast.makeText(this, "Could not read file, aborting..." + e.toString(), Toast.LENGTH_SHORT).show();
			Log.d("cryptogram", e.toString());
			return;
		}
		
		
		dataAccessor.setData(base64String);
		//TODO:Implement password prompt
		dataAccessor.setPassword(password);
		
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
     * Click handler of buttonUploadPhoto
     * @param v
     */
    public void encryptPhoto(View v){
    	Toast.makeText(this, "Starting encode", Toast.LENGTH_SHORT).show();
    	// Convert the image to jpeg if it is not already. Then turn it into a base-64 stream   	
    	
    	showPasswordPrompt();	
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
    	//Toast.makeText(context, "Java ct length " + Integer.toString(dataAccessor.getCt().length()), Toast.LENGTH_SHORT).show();
    	//Toast.makeText(context, Integer.toString(dataAccessor.getCt().indexOf(' ')), Toast.LENGTH_SHORT).show();
    	// Debug: check hashing in java vs. sjcl
    	
    	// 
    	base64String = base64String.replace(' ', '+');
    	try {
			String checksum = ImageEncoder.computeHash(base64String);
			if (!checksum.equals(dataAccessor.getHash())){
				Toast.makeText(context, "Hash mismatch", Toast.LENGTH_SHORT).show();
				checksum = ImageEncoder.computeHash(ImageEncoder.trimSpaces(base64String));
				if (checksum.equals(dataAccessor.getHash())){
					Toast.makeText(context, "Hash of trimmed matched!", Toast.LENGTH_SHORT).show();
				}
				else{
					Toast.makeText(context, "Hash of trimmed mismatch!", Toast.LENGTH_SHORT).show();
				}
			}else{
				Toast.makeText(context, "Hash matched!", Toast.LENGTH_SHORT).show();
			}
		}
		catch (NoSuchAlgorithmException e) {
			throw new RuntimeException("Can't encode sha-256!!");
			
		}
    	
    	
    	Bitmap encodedBitmap = ImageEncoder.encodeBase64(base64String, dataAccessor.getHash(), HEADER, targetWidth/(double)targetHeight);

		imagePreview.setImageBitmap(encodedBitmap);
		
		Toast.makeText(this, "Exporting image to gallery", Toast.LENGTH_SHORT).show();
		
		String filename = String.valueOf(System.currentTimeMillis());
		ContentValues values = new ContentValues();
		values.put(MediaColumns.TITLE, filename);
		values.put(MediaColumns.DATE_ADDED, System.currentTimeMillis());
		values.put(MediaColumns.MIME_TYPE, "image/jpeg");
		
		Uri uri = context.getContentResolver().insert(Images.Media.EXTERNAL_CONTENT_URI, values);
		try {
			OutputStream outStream = context.getContentResolver().openOutputStream(uri);
			encodedBitmap.compress(Bitmap.CompressFormat.JPEG, 98, outStream);
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
        getMenuInflater().inflate(R.menu.main_menu, menu);
        return true;
    }
    
    public boolean onOptionsItemSelected (MenuItem item){
    	switch (item.getItemId()) {
        case R.id.main_settings:
	    	Intent intent = new Intent(this, CryptogramPreferences.class);
	    	startActivity(intent);
	    	return true;
    	}
	    return super.onOptionsItemSelected(item);
    }
    
    
}
