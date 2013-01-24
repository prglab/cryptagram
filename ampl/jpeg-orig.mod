set HORIZONTAL;
set VERTICAL;

set ENTRIES := HORIZONTAL cross VERTICAL;

param quant{HORIZONTAL cross VERTICAL};
param alpha{HORIZONTAL};

param PI;

var F {(x,y) in HORIZONTAL cross VERTICAL};

var slacks{(x,y) in HORIZONTAL cross VERTICAL};

maximize z: sum{(h,v) in HORIZONTAL cross VERTICAL}((1 / quant[h,v]) * F[h,v]);
  s.t. DCT {(eh,ev) in ENTRIES}: sum{h in HORIZONTAL}(sum{v in VERTICAL}(alpha[h]*alpha[v]* F[h,v] *cos((PI/8)*(eh + 0.5)*h)*cos((PI/8)*(ev + 0.5)*v))) <= 127;
  s.t. NDCT {(eh,ev) in ENTRIES}: -1 * sum{h in HORIZONTAL}(sum{v in VERTICAL}(alpha[h]*alpha[v]* F[h,v] *cos((PI/8)*(eh + 0.5)*h)*cos((PI/8)*(ev + 0.5)*v))) <= 128;
  s.t. GZ {(h,v) in HORIZONTAL cross VERTICAL}: (1 / quant[h,v]) * F[h,v] != 0;
