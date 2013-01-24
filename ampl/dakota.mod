#
# Dakota’s problem
#
# This finds the optimal solution for maximizing Dakota’s revenue

/* Decision variables */
var x1 >=0; /* desk */
var x2 >=0; /* table */
var x3 >=0; /* chair */
  /* Objective function */
maximize z: 60*x1 + 30*x2 + 20*x3;
  /* Constraints */
  s.t. Lumber : 8*x1 + 6*x2 + x3 <= 48;
  s.t. Finishing : 4*x1 + 2*x2 + 1.5*x3 <= 20;
  s.t. Carpentry : 2*x1 + 1.5*x2 + 0.5*x3 <= 8;
  s.t. Demand : x2 <= 40;
