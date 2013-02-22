package org.prglab.cryptogram;

import java.io.File;
import java.util.Arrays;
import java.util.Comparator;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.drawable.Drawable;
import android.os.Bundle;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.ImageView;
import android.widget.ListView;
import android.widget.TextView;
import android.widget.Toast;

public class DecryptImageActivity extends Activity {
	
	/** The Intent Extra key for the cryptagram album containing folder, with all subfolders
	 *  being user-generated albums.
	 */
	public static final String ALBUM_FOLDER = "cryptagram.DecryptImageActivity.ALBUM_FOLDER";
	
	private static final int THUMB_HEIGHT = 100; 
	
	ListView albumList;
	
	/** The adapter providing the list items for the fileList */
	ArrayAdapter<File> fileListAdapter;
	
	/** The list of files in the current directory */
	private File[] items;
	
	File currentDirectory;
	
	private Drawable folderIcon;
	private Drawable fileIcon;
	
	@Override
	public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_decrypt);
        
        albumList = (ListView) findViewById(R.id.select_album);
        
        // Cache the icons
		folderIcon = getResources().getDrawable(R.drawable.collections_collection);
		fileIcon = getResources().getDrawable(R.drawable.collections_view_as_list);
        
        Intent launchingIntent = getIntent();
		String startPath = launchingIntent.getStringExtra(ALBUM_FOLDER);
		
		// Terminate if there is no ALBUM_FOLDER given.
		if (startPath == null){
			Toast.makeText(this, "No ALBUM_FOLDER specified in launching Intent. Terminating decryption Activity",
					Toast.LENGTH_SHORT).show();
			finish();
		}
		
		currentDirectory = new File(startPath);
		
		// Terminate if the ALBUM_FOLDER is not actually a folder
		if (!currentDirectory.isDirectory()){
			Toast.makeText(this, "Invalid ALBUM_FOLDER " + 
									startPath + 
									" specified in launching Intent. Terminating decryption Activity", 
									Toast.LENGTH_SHORT).show();
			finish();
		}
        
        /* 
		 * Set the listener to view the image if it's a file
		 *  or navigate deeper, taking a password if it's an album directory
		 */
		albumList.setOnItemClickListener(new AdapterView.OnItemClickListener() {
		    public void onItemClick(AdapterView<?> list, View v, int pos, long id) {
		        File f = fileListAdapter.getItem(pos);
		        
		        if (f.isDirectory()){
		        	currentDirectory = f;
		        	populateList();
		        }
		        
		        else {
		        	// Decrypt the image
		        	Toast.makeText(DecryptImageActivity.this, "Decrypting image", Toast.LENGTH_SHORT).show();
		        }
		    }
		});
        
	}
	
	/** 
	 * Set the array adapter for the file list 
	 */
	private void populateList(){
		// Fill up the items list
		items = currentDirectory.listFiles();
		
		// Sort alphabetically, showing directories first
		Arrays.sort(items, new Comparator<File>(){
		    public int compare(File f1, File f2)
		    {
		    	if ( f1.isDirectory() && !f2.isDirectory() ) return -1;
		    	if ( f2.isDirectory() && !f1.isDirectory() ) return 1;
		    	
		    	
		        return f1.getName().compareTo(f2.getName());
		    } 	    
		});
		
		if (items != null){ 
			fileListAdapter = new ArrayAdapter<File>(this, R.id.files_list, items){
				@Override
			    public View getView(int position, View convertView, ViewGroup parent) {
			    	View v = convertView;
			    	if (v == null) {
			            LayoutInflater vi = (LayoutInflater)getSystemService(Context.LAYOUT_INFLATER_SERVICE);
			            v = vi.inflate(R.layout.file_list_item, null);
			        }
			        if (v != null) {
			                TextView titleView = (TextView) v.findViewById(R.id.filename);
			                ImageView icon = (ImageView) v.findViewById(R.id.icon_image);
			                
			                String[] nameSplit = items[position].getName().split("\\.");			                

		                	titleView.setText(items[position].getName());
		                	if (items[position].isDirectory())
		                		icon.setImageDrawable(folderIcon);
		                	else if (nameSplit[nameSplit.length].equalsIgnoreCase("jpg")
		                				|| nameSplit[nameSplit.length].equalsIgnoreCase("jpeg"))
		                		setThumbnail(icon, items[position]);

			        }else{
			        	Log.d("Something", "Is Wrong");
			        }
			        return v;
			    	
			    }
				
			};
			
			albumList.setAdapter(fileListAdapter);
		}
		else {
			Toast.makeText(this, "Directory " + currentDirectory.toString() + " inaccessible.", Toast.LENGTH_SHORT).show();
		}
	}
	
	private void setThumbnail(ImageView thumb, File f){
		Bitmap fullImage = BitmapFactory.decodeFile(f.getAbsolutePath());
		thumb.setImageBitmap(Bitmap.createScaledBitmap(fullImage, 
				fullImage.getWidth() * (THUMB_HEIGHT/fullImage.getHeight()), THUMB_HEIGHT, true));
				
	}
}
