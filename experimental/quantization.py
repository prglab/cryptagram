import sys
from PIL import Image
from numpy import reshape

imName = sys.argv[1]
sys.stdout.write(imName + "\t")
im = Image.open(imName)
lumQuantization = im.quantization[0]
#lumQuantization = reshape(lumQuantization, [8, 8])
lumQuantization = reshape(lumQuantization,64)
print(lumQuantization[0:8])
