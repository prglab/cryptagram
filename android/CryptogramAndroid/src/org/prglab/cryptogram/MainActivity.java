package org.prglab.cryptogram;

import android.net.Uri;
import android.os.Bundle;
import android.app.Activity;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.view.Menu;
import android.view.SurfaceView;
import android.view.View;
import android.view.ViewGroup.LayoutParams;
import android.widget.Button;
import android.widget.Gallery;
import android.widget.ImageView;

import android.util.AttributeSet;
import android.util.Log;
import android.widget.Toast;

public class MainActivity extends Activity {
	
	public final String DEBUG_TAG = "Cryptogram Main Activity";
	private final int GALLERY_IMAGE_CODE = 1;
	private final int CAMERA_IMAGE_CODE = 2;
	

	Button buttonTakePhoto;
	Button buttonSelectPhoto;
	Button buttonUploadPhoto;
	
	ImageView imagePreview;
	
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        
        buttonTakePhoto = (Button) findViewById(R.id.button_snap_photo);
        buttonSelectPhoto = (Button) findViewById(R.id.button_select_photo);
        buttonUploadPhoto = (Button) findViewById(R.id.button_upload_photo);
        
        imagePreview = (ImageView) findViewById(R.id.image_preview);
    }
    
    /**
     * Callback for onclick of buttonSelectPhoto
     * @param v Clicked view
     */
    public void selectPhoto(View v){
	    Intent intent = new Intent(Intent.ACTION_PICK,
		android.provider.MediaStore.Images.Media.EXTERNAL_CONTENT_URI);
		startActivityForResult(intent, GALLERY_IMAGE_CODE);
    }
    
    public void takePhoto(View v){
    	return;
    }
    
    /**
     * Set the image to a result from the gallery
     * @param data
     */
    void useImageFromGallery(Intent data){
    	Uri targetUri = data.getData();
	   	// Just show the uri in a Toast for now, we'll do something with it later
	   	Toast.makeText(this, targetUri.toString(), Toast.LENGTH_SHORT).show();
	
	   	imagePreview.setImageURI(targetUri);
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
