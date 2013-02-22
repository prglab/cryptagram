import java.io.UnsupportedEncodingException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

public class HashTest {
    public static void main ( String[] args ){
        String input;
        if (args.length > 2){
            input = args[1];
        }
        else {
            // Hashes to: 06a58a32e7a8f8d9a2bf8c1313932a04d6adcb978ae601223afc6a47b57143e0
            input = "aesthete";
        }
        try{
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            digest.reset();
            try{
              digest.update(input.getBytes("UTF-8"));
            } catch (UnsupportedEncodingException e){
              e.printStackTrace();
            }

            byte[] byteData = digest.digest();
            StringBuffer sb = new StringBuffer();

            for ( int i = 0; i < byteData.length; i++ ){
              sb.append(Integer.toString((byteData[i] & 0xff) + 0x100, 16).substring(1));
            }
            
            System.out.println(sb.toString());
        }
        catch ( NoSuchAlgorithmException e ) {
            System.out.println("Encoding undefined");
        }
    }
}
