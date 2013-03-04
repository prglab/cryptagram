find q*[1-4].jpg -exec sips -g pixelWidth -g pixelHeight {} ";" > output_dims_temp.txt
sed -f chop.sed output_dims_temp.txt > output_dims.txt

find q*[1-4].jpg -exec du -k {} ";" > output_sizes.txt

find q*original.jpg -exec sips -g pixelWidth -g pixelHeight {} ";" > original_dims_temp.txt
sed -f chop.sed original_dims_temp.txt > original_dims.txt

find q*original.jpg -exec du -k {} ";" > original_sizes.txt
