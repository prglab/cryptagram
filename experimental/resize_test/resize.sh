cp -r $1 $1_$2

mogrify -resize $2% -quality 70 $1_$2/*