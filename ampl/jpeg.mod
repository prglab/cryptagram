set HORIZONTAL;
set VERTICAL;

set ENTRIES := HORIZONTAL cross VERTICAL;

param alpha{HORIZONTAL} >= 0;
param PI;

var x1 >= 0;
var x2 >= 0;

var F {(x,y) in HORIZONTAL cross VERTICAL};

maximize z: x1 + 2*x2;
  s.t. Foo: x1 <= 48;
  s.t. Bar: x2 <= 20;
  s.t. Baz {h in HORIZONTAL}: x1*cos(h * PI/8) + alpha[h] - x2 <= 20;
  s.t. DCT {(eh,ev) in ENTRIES}: sum{h in HORIZONTAL}(sum{v in VERTICAL}(alpha[h]*alpha[v]* F[eh,ev] *cos((PI/8)*(eh + 0.5)*h)*cos((PI/8)*(ev + 0.5)*v))) <= 127;
  s.t. NDCT {(eh,ev) in ENTRIES}: -1 * sum{h in HORIZONTAL}(sum{v in VERTICAL}(alpha[h]*alpha[v]* F[eh,ev] *cos((PI/8)*(eh + 0.5)*h)*cos((PI/8)*(ev + 0.5)*v))) <= 128;

end;
