package org.prglab.cryptagram;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.net.URLDecoder;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.StringTokenizer;

import org.json.JSONArray;
import org.json.JSONException;

import android.net.Uri;
import android.os.Bundle;
import android.os.Environment;
import android.os.Handler;
import android.provider.MediaStore;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Bitmap.CompressFormat;
import android.graphics.drawable.Drawable;
import android.view.LayoutInflater;
import android.view.Menu;
import android.view.MenuItem;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.ConsoleMessage;
import android.webkit.WebChromeClient;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.EditText;
import android.widget.GridView;
import android.widget.ImageView;
import android.widget.ListView;
import android.util.Base64;
import android.util.Log;
import android.widget.Toast;


public class Cryptagram extends Activity {
	
	public final static String DEBUG_TAG = "Cryptagram Main Activity";
	/** Activity call code for a gallery image selection */
	private final static int GALLERY_IMAGE_CODE = 101;
	/** Activity call code for taking a photo with the camera */
	private final static int CAMERA_IMAGE_CODE = 102;
	
	AlertDialog a;
	
	//TODO: Make this a user setting
	/** The largest width for an image so that the app doesn't crash.*/
	public int MAX_IMAGE_WIDTH = 800;
	/** The largest height for an image so that the app doesn't crash.*/
	public int MAX_IMAGE_HEIGHT = 600;
	/** The folder into which to export the generated images */
	private String EXPORT_FOLDER_PATH = Environment.getExternalStorageDirectory().getPath()+"/Cryptagram";
	
	private int THUMBNAIL_HEIGHT = 75;
	
	/** The fewest number of characters acceptable in the password */
	public final int MIN_PASSWORD_LENGTH = 8;
	
	private final String HEADER = "aesthete";
	
	private final String TEMP_PHOTO_PATH_KEY = "tmp_file_path";
	
	private String DATA_URIS_BUNDLE_KEY = "cryptagram_bundle_datauris";
	
	private String SHARED_PREFS = "Cryptagram_shared_prefs";
	
	/** The list of pictures the user has selected. May be String paths or Uri resources ids */
	private ArrayList<Object> dataUris;
	
	/** The name the user has selected for the current album to export to */
	private String albumName;
	
	/** The password entered by the user */
	private String password;
	

	
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
		        	Toast.makeText(context, "Got sjcl hash", Toast.LENGTH_SHORT).show();
		        	dataAccessor.setHash(parameter);
		        }
		        		
		        
		        else if ( func.equalsIgnoreCase("setDone") ) {
		        	Toast.makeText(getApplicationContext(), "Done sjcl encryption", Toast.LENGTH_SHORT).show();
		        	dataAccessor.setDone();
		        	
		        } else {
		           // its not an android call back 
		           // let the browser navigate normally
		           //return false;
		        }
		   }   
		}
	
	/**
	 * A class to share data with the javascript Cryptagram encoder library.
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
			//Toast.makeText(context, jsCt, Toast.LENGTH_SHORT).show();
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
	
	GridView selectedImagesView;
	WebView jsExecutionView;
	
	Uri imageUri;
	
	Bitmap imageBitmap;
	
	DataAccessor dataAccessor;
	
	Context context;
	
	Bitmap CryptagramImage;
	
	int targetWidth, targetHeight;
	
	Drawable noImageSelected;
	
	/**
	 * Initialize the activity
	 */
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        
        buttonTakePhoto = (Button) findViewById(R.id.button_snap_photo);
        buttonSelectPhoto = (Button) findViewById(R.id.button_select_photo);
        buttonUploadPhoto = (Button) findViewById(R.id.button_upload_photo);
        
        jsExecutionView = (WebView) findViewById(R.id.js_encryption_webview);
        
        dataAccessor = new DataAccessor();
        
        initializePreferences();
        
        
        selectedImagesView = (GridView) findViewById(R.id.selected_images_list);
        
    	dataUris = new ArrayList<Object>();
    	String uris = getSharedPreferences(SHARED_PREFS, MODE_PRIVATE).getString(DATA_URIS_BUNDLE_KEY, null);
    	// Restore the selections from the user's previous session
    	if (uris != null){
    		JSONArray a;
			try {
				a = new JSONArray(uris);
			
        		for (int i = 0; i < a.length(); i++){
        			String uri = (String)a.get(i);
        			// If it's a content: protocol string, treat it as a URI
        			// otherwise it's a string path
        			
        			// Apparently, Uris are stupidly difficult to build from strings because
        			// the Android Uri class tried to cover all the bases and ended up with a behemoth.
        			// Sorry to anyone reading this. Uri should have been serializable...
        			// TODO: Uri Serializable subclass.
        			if (uri.split(":")[0].equals("content")){
        				String ssp = uri.split(":")[1].split("#")[0].replaceFirst("//media", "");

        				Uri.Builder b = new Uri.Builder().scheme("content").authority("media").path(ssp);
        				
        				dataUris.add(b.build());        				
        			}
        			
        			else{
        				dataUris.add(uri);
        			}
        		}
    		
			} catch (JSONException e) {
				// This. should. not. happen.
				// The stored value should be a valid JSON array stored in sharedPrefs
				// TODO Auto-generated catch block
				e.printStackTrace();
				finish();
			}
    	}
    	
    	selectedImagesView.setOnItemClickListener(new AdapterView.OnItemClickListener() {
		    public void onItemClick(AdapterView<?> list, View v, int pos, long id) {
		    	dataUris.remove(pos);
		    	refreshImageList();
		    }
		});

        
        refreshImageList();
        Toast.makeText(this, Integer.toString(dataUris.size()), Toast.LENGTH_SHORT).show();
        
        noImageSelected = getResources().getDrawable(R.drawable.no_image_selected);
        
        context = this;
    }

    /**
     * Reload the list adapter containing all the user-selected images
     */
    private void refreshImageList(){
    	selectedImagesView.setAdapter(
        		
        		/**
        		 * Array adapter that fills the list of selected images with thumbnails and their image names
        		 */
        		new ArrayAdapter<Object>(this, R.id.selected_images_list, dataUris.toArray()){
        			@Override
    			    public View getView(int position, View convertView, ViewGroup parent) {
    			    	View v = convertView;
    			    	if (v == null) {
    			            LayoutInflater vi = (LayoutInflater)getSystemService(Context.LAYOUT_INFLATER_SERVICE);
    			            v = vi.inflate(R.layout.selected_item, null);
    			        }
    			    	if (v != null) {
    			                //TextView nameView = (TextView) v.findViewById(R.id.list_text);
    			                ImageView thumbnailView = (ImageView) v.findViewById(R.id.list_thumbnail);
    			                Object o = getItem(position);
    			                //nameView.setText(o.toString());
    			                if (thumbnailView.getDrawable() == null){
	    			                if (o instanceof String){
	    			                	thumbnailView.setImageBitmap(getThumbnail((String) o));
	    			                }
	    			                else if (o instanceof Uri){  			                	
	    			                	thumbnailView.setImageBitmap(getThumbnail((Uri) o));
	    			                }
    			                }
    			        
    			    	}else{
    			        	Log.d(DEBUG_TAG, "Failed to inflate ListView item view!");
    			    	}
    			        return v;
    			    	
    			    }
        		}
        		
        );
    }
    
    /**
     * Open an image file and return a small thumbnail of it
     * @param filepath the absolute path to the file
     * @return the thumbnail
     */
    private Bitmap getThumbnail(String filepath){
    	try{
    		Bitmap temp = BitmapFactory.decodeFile(filepath);
    		return scaleThumbnail(temp);
    		
    	}
    	catch(Exception e){
    		return null;
    	}
    }
    
    /**
     * Open an image uri and return a small thumbnail of it
     * @param u the MediaStore Uri for the image
     * @return the thumbnail
     */
    private Bitmap getThumbnail(Uri u){
    	try{
    		Bitmap temp = MediaStore.Images.Media.getBitmap(getContentResolver(), u);
    		return scaleThumbnail(temp);
    	}
    	catch (Exception e){
    		return null;
    	}
    }
    
    /**
     * Scale a given image to thumbnail size
     * @param temp
     */
    private Bitmap scaleThumbnail(Bitmap temp){
    	return Bitmap.createScaledBitmap(temp, (int)(temp.getWidth()*(((double)THUMBNAIL_HEIGHT)/temp.getHeight())),
				THUMBNAIL_HEIGHT , true);
    }
    
    
    /**
     * Set the current image preview with a file
     * @param filepath the path to the file
     */
    private boolean setImageBitmap(String filepath){

    	try{
	    	Bitmap temp = BitmapFactory.decodeFile(filepath);
	    	if (temp == null) throw new Exception("we need an image, yo");
	    	setImageBitmap(temp);
	    	return true;
    	}
    	catch ( Exception e ){
    		return false;
    	}
    }
    
    /**
     * Set the current image preview with a uri
     * @param u the image's MediaStore uri
     */
    private boolean setImageBitmap(Uri u){
    	try{
	    	Bitmap temp = MediaStore.Images.Media.getBitmap(getContentResolver(), u);
	    	setImageBitmap(temp);
	    	return true;
    	}
    	catch ( Exception e ){
    		return false;
    	}
    }
    
    
    /**
     * Set the image preview with a given Bitmap
     * @param b
     */
    private void setImageBitmap(Bitmap temp){
    	//TODO: Disable this when we do batch by uri/filenames, they'll get read from files on demand, and this
    	// just will waste memory
    	imageBitmap = temp;
    }
    
    /**
     * Set globals by values stored in SharedPreferences, or to defaults
     */
    void initializePreferences(){
    	SharedPreferences s = getPreferences(MODE_PRIVATE);
    	EXPORT_FOLDER_PATH  = s.getString(getString(R.string.folder_path_key), EXPORT_FOLDER_PATH);
    	try {
    		MAX_IMAGE_HEIGHT = Integer.parseInt(s.getString(getString(R.string.max_image_height_key), String.valueOf(MAX_IMAGE_HEIGHT)));
    		MAX_IMAGE_WIDTH  = Integer.parseInt(s.getString(getString(R.string.max_image_width_key), String.valueOf(MAX_IMAGE_WIDTH)));
    	}
    	// This should hopefully never happen
    	catch (NumberFormatException e){
    		Toast.makeText(this, "Invalid user-specified height/width value", Toast.LENGTH_SHORT).show();
    	}
    	
    }
    
    /** 
     * Utility method for checking if an app to fulfill an Intent is available. 
     * Thanks https://developer.android.com/training/camera/photobasics.html
     * 
     * @param context
     * @param action
     * @return
     */
    public static boolean isIntentAvailable(Context context, String action) {
        final PackageManager packageManager = context.getPackageManager();
        final Intent intent = new Intent(action);
        List<ResolveInfo> list =
                packageManager.queryIntentActivities(intent, PackageManager.MATCH_DEFAULT_ONLY);
        return list.size() > 0;
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
     * @param v the button
     */
    public void takePhoto(View v){
    	Intent intent;
    	if (isIntentAvailable(this, MediaStore.ACTION_IMAGE_CAPTURE))
    		intent = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
    	//TODO: Hide the photo button if we can't take pictures
    	else{
    		Toast.makeText(this, getString(R.string.no_camera_app), Toast.LENGTH_SHORT).show();
    		return;
    	}
    	if (checkDirectory(Environment.getExternalStorageDirectory()+"/Cryptagram/tmp")){
	    	String outFilename = new SimpleDateFormat("EEE_MMM_dd_HH_mm_ss_zzz_yyyy", Locale.US).format(new Date()) + ".jpg";
	    	File tmpOutfile = new File(Environment.getExternalStorageDirectory()+"/Cryptagram/tmp/" + outFilename);
	    	while (!getPreferences(MODE_PRIVATE).edit().putString(TEMP_PHOTO_PATH_KEY, tmpOutfile.getAbsolutePath()).commit());
	    	
	    	
	    	intent.putExtra(MediaStore.EXTRA_OUTPUT, Uri.fromFile(tmpOutfile));

	    	startActivityForResult(intent, CAMERA_IMAGE_CODE);
    	}
    	else
    		Toast.makeText(this, getString(R.string.file_creation_failed), Toast.LENGTH_SHORT).show();
    	return;
    }
    
    /**
     * Show a dialog box for the user to enter a password for his photo/album
     */
    private void showPasswordPrompt(){
    	
    	// get prompts.xml view
    	LayoutInflater li = LayoutInflater.from(context);
		View promptsView = li.inflate(R.layout.password_prompt, null);

		AlertDialog.Builder alertDialogBuilder = new AlertDialog.Builder(
				context);

		// set prompts.xml to alertdialog builder
		alertDialogBuilder.setView(promptsView);
		
		alertDialogBuilder.setTitle(R.string.password_prompt);

		final EditText passwordField = (EditText) promptsView
				.findViewById(R.id.inputText);
		final EditText albumNameField = (EditText) promptsView
				.findViewById(R.id.album_name);

		// set dialog message
		alertDialogBuilder
			.setCancelable(false)
			.setPositiveButton("OK",
			  new DialogInterface.OnClickListener() {
			    @Override
				public void onClick(DialogInterface dialog,int id) {
			    	String inputPassword = passwordField.getText().toString();
			    	albumName = albumNameField.getText().toString();
			    	if (inputPassword.length() >= MIN_PASSWORD_LENGTH){
			    		encryptFirstPhoto();
			    	}
			    	
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
    
    private void encryptFirstPhoto(){
    	if (!dataUris.isEmpty()){
    		//TODO: Refactor to pass image
    		Object o = dataUris.get(0);
    		if ( o instanceof String ){
    			setImageBitmap((String) o);
    		}
    		if ( o instanceof Uri ){
    			setImageBitmap((Uri) o);
    		}
    		encryptPhoto();
    		dataUris.remove(0);
    	}
    	// Clear what was encrypted from the selection window
    	else{
    		refreshImageList();
    	}
    }
    
    @SuppressLint("SetJavaScriptEnabled")
	private void encryptPhoto(){
    	String base64String; 
    	
    	try{
			ByteArrayOutputStream byteOut = new ByteArrayOutputStream();
			
			//Toast.makeText(this, "Width: " + imageBitmap.getWidth() + " Height: " + imageBitmap.getHeight(), Toast.LENGTH_SHORT).show();
			
			//Make sure we don't crash the app with huge images: resize to something reasonable
			if (imageBitmap.getWidth() > MAX_IMAGE_WIDTH){
				//Resize the bitmap
				imageBitmap = Bitmap.createScaledBitmap(imageBitmap, MAX_IMAGE_WIDTH, (int)(MAX_IMAGE_WIDTH*(((double)imageBitmap.getHeight())/imageBitmap.getWidth())), true);
			}
			
			// Debug outputted width
			Toast.makeText(this, "Resized Width: " + imageBitmap.getWidth() + " Height: " + imageBitmap.getHeight(), Toast.LENGTH_SHORT).show();
			
			if (imageBitmap.getHeight() > MAX_IMAGE_HEIGHT){
				//Resize the bitmap
				imageBitmap = Bitmap.createScaledBitmap(imageBitmap, (int)(MAX_IMAGE_HEIGHT*(((double)imageBitmap.getWidth())/imageBitmap.getHeight())), MAX_IMAGE_HEIGHT, true);
			}
			
			targetWidth = imageBitmap.getWidth();
			targetHeight = imageBitmap.getHeight();
    		
			imageBitmap.compress(CompressFormat.JPEG, 80, byteOut);
			imageBitmap = null;
			byte[] readBuffer = byteOut.toByteArray();
			
    		base64String = Base64.encodeToString(readBuffer, Base64.NO_WRAP | Base64.NO_PADDING);
    		
    		// Debugging with toasts: the best way to debug
    		//Toast.makeText(this, base64String, Toast.LENGTH_SHORT).show();
		}
		
		catch (Exception e){
			Toast.makeText(this, "Could not read file, aborting..." + e.toString(), Toast.LENGTH_SHORT).show();
			Log.d(DEBUG_TAG, e.toString());
			return;
		}
		
		
		dataAccessor.setData(base64String);
		dataAccessor.setPassword(password);
		
		// Send the string to the WebView here using DataAccessor
		//jsExecutionView.addJavascriptInterface(dataAccessor, "dataAccessor");
		jsExecutionView.getSettings().setJavaScriptEnabled(true);
		jsExecutionView.setWebViewClient(new workaroundWebViewClient());
		
		jsExecutionView.setWebChromeClient(new WebChromeClient() {
			
			@Override
			public boolean onConsoleMessage(ConsoleMessage consoleMessage){
				//Toast.makeText(context, consoleMessage.message() + ":" + Integer.toString(consoleMessage.lineNumber()), Toast.LENGTH_SHORT).show();
				
				return true;
			}
			
			
		});
		
		// Set the WebView to encrypt the data.
		// On completion, encodeToImage() is called
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
    private void useImageFromGallery(Intent data){
    	Uri targetUri = data.getData();

	   	// Just show the uri in a Toast for now, we'll do something with it later
	   	//Toast.makeText(this, targetUri.toString(), Toast.LENGTH_SHORT).show();
	
	   	try{
		   	if (!setImageBitmap(targetUri)) throw new RuntimeException("Failed to load uri");
		   	// We place this here because we only want to add valid uris to the list
	    	dataUris.add(targetUri);
	   	}
	   	catch(Exception e){
	   		Toast.makeText(this, getString(R.string.file_location_failed), Toast.LENGTH_SHORT).show();
	   	}
	   	//imagePreview.setImageURI(targetUri);
	   	
	   	
	   	imageUri = targetUri;
    }
    
    /**
     * Set the image to an image captured from the camera
     */
    private void useImageFromCamera(){
    	try{
    		String path = getPreferences(MODE_PRIVATE).getString(TEMP_PHOTO_PATH_KEY, null);
		   	if (!setImageBitmap(path)) throw new RuntimeException("File not found");
		   	// We place this here because we only want to add valid paths to the list
		   	dataUris.add(path);
	   	}
	   	catch(Exception e){
	   		Toast.makeText(this, getString(R.string.file_location_failed) + " " + e.getMessage(), Toast.LENGTH_LONG).show();
	   	}
    }
    
    private void encodeToImage(){
    	String base64String =  dataAccessor.getIv() + dataAccessor.getSalt() + dataAccessor.getCt() ;
    	//Toast.makeText(context, "Java ct length " + Integer.toString(dataAccessor.getCt().length()), Toast.LENGTH_SHORT).show();
    	//Toast.makeText(context, Integer.toString(dataAccessor.getCt().indexOf(' ')), Toast.LENGTH_SHORT).show();
    	// Debug: check hashing in java vs. sjcl
    	
    	// 
    	base64String = base64String.replace(' ', '+');
    	/* Hash is now calculated in ImageEncoder. Spaces must first be trimmed
    	 * Disabled. This part probably needs to be removed, keeping for future debugging just in case
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
			
		}*/
    	
    	// TODO: Replace AestheteEncoder with generic ImageEncoder, created by user preference
    	// onCreate.
    	Bitmap encodedBitmap = AestheteEncoder.getEncoder().encodeToBitmap(base64String, targetWidth/(double)targetHeight);

    	// Show just a preview
		//imagePreview.setImageBitmap(encodedBitmap);
    	if (encodedBitmap != null)
    		setImageBitmap(encodedBitmap);
		
		Toast.makeText(this, "Exporting image to gallery", Toast.LENGTH_SHORT).show();
		
		/** this is no longer necessary, as we're exporting to user-defined folder
		ContentValues values = new ContentValues();
		values.put(MediaColumns.TITLE, filename);
		values.put(MediaColumns.DATE_ADDED, System.currentTimeMillis());
		values.put(MediaColumns.MIME_TYPE, "image/jpeg");
		*/
		
		//Uri uri = context.getContentResolver().insert(Images.Media.EXTERNAL_CONTENT_URI, values);
		// We'll write to files now
		
		String outputDate = new SimpleDateFormat("EEE_MMM_dd_HH_mm_ss_zzz_yyyy", Locale.US).format(new Date());
		
		// Make sure the export directory exists, or try to make it if doesn't
		checkDirectory(EXPORT_FOLDER_PATH + "/" + albumName);
		File exportFile = new File(EXPORT_FOLDER_PATH + "/" + albumName + "/" + outputDate + ".jpg");
		
		try {
			FileOutputStream outStream = new FileOutputStream(exportFile);
			//OutputStream outStream = context.getContentResolver().openOutputStream(uri);
			encodedBitmap.compress(Bitmap.CompressFormat.JPEG, 98, outStream);
			outStream.flush();
			outStream.close();			
		} catch (FileNotFoundException e){
			Toast.makeText(this, getString(R.string.file_creation_failed), Toast.LENGTH_SHORT).show();
			//e.printStackTrace();
		} catch (IOException e){
			Toast.makeText(this, getString(R.string.file_creation_failed), Toast.LENGTH_SHORT).show();
			//e.printStackTrace();
		}
		
		encryptFirstPhoto();
    }
    
    /**
     * Sees if a directory exists  and is writable, and tries to create it if it isn't
     * 
     * @param path The path to the desired directory
     * @return true if the directory exists and is ready to be written to, false otherwise
     */
    public boolean checkDirectory(String path){
    	File f = new File(path);
    	if (!f.exists()){
    		if (!f.mkdirs()){
    			// This directory is no good
    			return false;
    		}
    	}
    	else if (!f.isDirectory()){
    		// We don't want to get rid of the existing file either
    		return false;
    	}
    	else if (!f.canWrite()){
    		return false;
    	}
		return true;	
    }
    
    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
	     super.onActivityResult(requestCode, resultCode, data);
	
	     if (resultCode == RESULT_OK){
	    	 switch (requestCode){
	    	 	case GALLERY_IMAGE_CODE:
	    	 		useImageFromGallery(data);
	    	 		break;
	    		
	    	 	case CAMERA_IMAGE_CODE:
	    	 		useImageFromCamera();
	    	 		break;
	    	 }
	    	 
	    	 refreshImageList();
	    	 	      
	     }
	     
    }
    
    @Override
    public void onPause(){
    	super.onPause();
    	JSONArray a = new JSONArray();
    	for (Object o : dataUris){
    		a.put(o.toString());
    	}
    	getSharedPreferences(SHARED_PREFS, MODE_PRIVATE).edit().
    		putString(DATA_URIS_BUNDLE_KEY, a.toString()).commit();

    }

    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        getMenuInflater().inflate(R.menu.main_menu, menu);
        return true;
    }
    
    public boolean onOptionsItemSelected (MenuItem item){
    	Intent intent;
    	switch (item.getItemId()) {
	        case R.id.main_settings:
		    	intent = new Intent(this, CryptagramPreferences.class);
		    	startActivity(intent);
		    	return true;
	    	
	    	case R.id.decrypt:
	    		intent = new Intent(this, DecryptImageActivity.class);
	    		intent.putExtra(DecryptImageActivity.ALBUM_FOLDER, EXPORT_FOLDER_PATH);
	    		startActivity(intent);
	    		return true;
    	}	
	    return super.onOptionsItemSelected(item);
    }
    
    
}
