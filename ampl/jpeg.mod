set HORIZONTAL;
set VERTICAL;

set ENTRIES := HORIZONTAL cross VERTICAL;

param alpha{HORIZONTAL};

param PI;

var F {(x,y) in HORIZONTAL cross VERTICAL};

var slacks{(x,y) in HORIZONTAL cross VERTICAL};
