set HORIZONTAL;
set VERTICAL;

set ENTRIES := HORIZONTAL cross VERTICAL;

param alpha{HORIZONTAL};

param PI;

var F {(x,y) in HORIZONTAL cross VERTICAL};

var slacks{(x,y) in HORIZONTAL cross VERTICAL};

# maximize z: sum{(h,v) in HORIZONTAL cross VERTICAL}(F[h,v]);
# maximize z: sum{(h,v) in HORIZONTAL cross VERTICAL}(slacks[h,v]);
maximize z: F[4,4];
  s.t. F00: F[0,0] = 1016;
  s.t. DCT {(eh,ev) in ENTRIES}: sum{h in HORIZONTAL}(sum{v in VERTICAL}(alpha[h]*alpha[v]* F[h,v] *cos((PI/8)*(eh + 0.5)*h)*cos((PI/8)*(ev + 0.5)*v))) <= 127;
  s.t. NDCT {(eh,ev) in ENTRIES}: -1 * sum{h in HORIZONTAL}(sum{v in VERTICAL}(alpha[h]*alpha[v]* F[h,v] *cos((PI/8)*(eh + 0.5)*h)*cos((PI/8)*(ev + 0.5)*v))) <= 128;
  s.t. US{(eh,ev) in HORIZONTAL cross VERTICAL}: slacks[eh,ev] >= sum{h in HORIZONTAL}(sum{v in VERTICAL}(alpha[h]*alpha[v]* F[h,v] *cos((PI/8)*(eh + 0.5)*h)*cos((PI/8)*(ev + 0.5)*v)));
  s.t. LS{(eh,ev) in HORIZONTAL cross VERTICAL}: slacks[eh,ev] >= -1 * sum{h in HORIZONTAL}(sum{v in VERTICAL}(alpha[h]*alpha[v]* F[h,v] *cos((PI/8)*(eh + 0.5)*h)*cos((PI/8)*(ev + 0.5)*v)));

# end;
