./requality original 70

./resize.sh q70 95
./resize.sh q70 90
./resize.sh q70 85
./resize.sh q70 80
./resize.sh q70 75
./resize.sh q70 70
./resize.sh q70 65
./resize.sh q70 60
./resize.sh q70 55
./resize.sh q70 50
./resize.sh q70 45
./resize.sh q70 40
./resize.sh q70 35
./resize.sh q70 30
./resize.sh q70 25
./resize.sh q70 20
./resize.sh q70 15
./resize.sh q70 10
./resize.sh q70 5

mv q70 q70_99

du -k  q70_*/* | tr "_/." \\t | sort -n -k 3 -k 4 > sizes.txt
awk -f pivot.awk sizes.txt > filesize_by_rescale.csv








