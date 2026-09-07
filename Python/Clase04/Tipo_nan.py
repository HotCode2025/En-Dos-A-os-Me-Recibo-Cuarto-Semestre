# Tipo NaN (Not a Number)
a = float('NaN')
print(f'a: {a}')

# Módulo Math
import math
a = float('nan')
print(f'Es de tipo NaN?: {math.isnan(a)}')

# Módulo Decimal
from decimal import Decimal
a = Decimal('NaN')
print(f'Es de tipo NaN?: {math.isnan(a)}')