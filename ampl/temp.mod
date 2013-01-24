set HORIZONTAL;
set VERTICAL;

set ENTRIES := HORIZONTAL cross VERTICAL;

param alpha{HORIZONTAL};
param quant{HORIZONTAL cross VERTICAL};

param PI;

var F {(x,y) in HORIZONTAL cross VERTICAL};

var slacks{(x,y) in HORIZONTAL cross VERTICAL};

maximize z: F[7,7];
s.t. DCT {(eh,ev) in ENTRIES}: sum{h in HORIZONTAL}(sum{v in VERTICAL}(alpha[h]*alpha[v]* F[h,v] *cos((PI/8)*(eh + 0.5)*h)*cos((PI/8)*(ev + 0.5)*v))) <= 127;
s.t. NDCT {(eh,ev) in ENTRIES}: -1 * sum{h in HORIZONTAL}(sum{v in VERTICAL}(alpha[h]*alpha[v]* F[h,v] *cos((PI/8)*(eh + 0.5)*h)*cos((PI/8)*(ev + 0.5)*v))) <= 128;
s.t. FIX_0_1: F[0,1] = 325;
s.t. FIX_2_7: F[2,7] = -243;
s.t. FIX_4_7: F[4,7] = -333;
s.t. FIX_5_6: F[5,6] = 162;
s.t. FIX_1_5: F[1,5] = 56;
s.t. FIX_0_5: F[0,5] = 57;
s.t. FIX_1_0: F[1,0] = 624;
s.t. FIX_4_0: F[4,0] = 207;
end;
