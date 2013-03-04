q=90

./requality.sh original $q

for (( c=50; c<=900; c+=50 ))
do
   ./resize.sh q$q $c
   echo "Resizing q$q @ max dim $c px"
done

mkdir q$q_all
cp q$q*/*jpg q$q_all

