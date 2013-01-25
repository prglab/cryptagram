./requality.sh original $1

./resize.sh q$1 95
./resize.sh q$1 90
./resize.sh q$1 85
./resize.sh q$1 80
./resize.sh q$1 75
./resize.sh q$1 70
./resize.sh q$1 65
./resize.sh q$1 60
./resize.sh q$1 55
./resize.sh q$1 50
./resize.sh q$1 45
./resize.sh q$1 40
./resize.sh q$1 35
./resize.sh q$1 30
./resize.sh q$1 25
./resize.sh q$1 20
./resize.sh q$1 15
./resize.sh q$1 10
./resize.sh q$1 5

mv q$1 q$1_00

du -k  q$1_*/* | tr "_/." \\t | sort -n -k 3 -k 4 > sizes_$1.txt
awk -f pivot.awk sizes_$1.txt > filesize_by_rescale_$1.csv








