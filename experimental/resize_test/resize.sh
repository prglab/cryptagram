cp -r $1 $1_s$2

mogrify -resize $2 -quality 90 $1_s$2/*jpg