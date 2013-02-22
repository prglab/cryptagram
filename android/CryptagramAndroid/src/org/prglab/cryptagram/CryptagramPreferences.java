package org.prglab.cryptagram;

import android.content.Intent;
import android.os.Bundle;
import android.preference.EditTextPreference;
import android.preference.Preference;
import android.preference.Preference.OnPreferenceClickListener;
import android.preference.PreferenceActivity;
import com.davidiserovich.android.filedialog.FolderSelectActivity;;

public class CryptagramPreferences extends PreferenceActivity {
	
	@SuppressWarnings("deprecation")
	@Override
	public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        addPreferencesFromResource(R.xml.cryptogram_preferences);
        
        EditTextPreference myPref = (EditTextPreference) findPreference(getString(R.string.folder_path_key));
        myPref.setOnPreferenceClickListener(new OnPreferenceClickListener() {
	         public boolean onPreferenceClick(Preference preference) {
	        	 
	        	 Intent intent = new Intent(CryptagramPreferences.this, FolderSelectActivity.class);

	        	 startActivityForResult(intent, FOLDER_SELECT_REQUEST_CODE);
	        	 
	        	 // Continue with the editText to confirm the selected folder
	        	 return false;
	         }
	    });
	}
	
	int FOLDER_SELECT_REQUEST_CODE = 101;
	
	public void onActivityResult(int requestCode, int resultCode, Intent data){
		if (requestCode == FOLDER_SELECT_REQUEST_CODE){
			if (resultCode == RESULT_OK){
				// We're targeting 2.3 as baseline, this is the proper way to do things
				@SuppressWarnings("deprecation")
				EditTextPreference t = (EditTextPreference)(findPreference(getString(R.string.folder_path_key)));
				t.getEditText().setText(data.getStringExtra(FolderSelectActivity.SELECTED_PATH)); 
			}
			
		}
	}
}
