# Utility module.

lum_factor_ = 4
cb_factor_ = 1
cr_factor_ = 1

def InflateObservations(observations):
  for obs in observations:
    obs[0] *= lum_factor_
    obs[1] *= cb_factor_
    obs[2] *= cr_factor_
  return True

def DeflateObservations(observations):
  for obs in observations:
    obs[0] /= lum_factor_
    obs[1] /= cb_factor_
    obs[2] /= cr_factor_
  return True
