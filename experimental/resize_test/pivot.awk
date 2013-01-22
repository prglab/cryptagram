BEGIN {

lastS = ""

}

/./ {

if ($3 != lastS) {
  print ""
  printf $3
  lastS = $3
}

printf "\t" $1

}