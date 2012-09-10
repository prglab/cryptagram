package org.prglab.cryptogram;

import android.net.Uri;
import android.os.Bundle;
import android.app.Activity;
import android.content.Intent;
import android.view.Menu;
import android.view.View;
import android.widget.Button;

import android.util.Log;
import android.widget.Toast;

public class MainActivity extends Activity {
	
	public final String DEBUG_TAG = "Cryptogram Main Activity";

	Button buttonTakePhoto;
	Button buttonSelectPhoto;
	Button buttonUploadPhoto;
	
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        
        buttonTakePhoto = (Button) findViewById(R.id.button_snap_photo);
        buttonSelectPhoto = (Button) findViewById(R.id.button_select_photo);
        buttonUploadPhoto = (Button) findViewById(R.id.button_upload_photo);

    }
    
    /**
     * Callback for onclick of buttonSelectPhoto
     * @param v Clicked view
     */
    public void selectPhoto(View v){
	    Intent intent = new Intent(Intent.ACTION_PICK,
		android.provider.MediaStore.Images.Media.EXTERNAL_CONTENT_URI);
		startActivityForResult(intent, 0);
    }
    
    
    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
	     // TODO Auto-generated method stub
	     super.onActivityResult(requestCode, resultCode, data);
	
	     if (resultCode == RESULT_OK){
	    	 Uri targetUri = data.getData();
	    	 // Just show the uri in a Toast for now, we'll do something with it later
	    	 Toast.makeText(this, targetUri.toString(), Toast.LENGTH_SHORT).show();
	      
	     }
    }

    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        getMenuInflater().inflate(R.menu.activity_main, menu);
        return true;
    }
}
