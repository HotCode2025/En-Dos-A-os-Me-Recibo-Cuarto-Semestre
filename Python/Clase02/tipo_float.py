# Profundizando en el tipo float
a = 3.0
print(f'a: {a:.2f}') 


#Constructor de tipo float -> puede recbir int y str 
a = float(10) # Le pasamos un tipo entero (int)
a = float('10')
print(f'a: {a:.2f}')

# Notacion exponencial (valores + o -)
a = 3e5
print(f'a: {a:.2f}') #positivo

a = 3e-5
print(f'a: {a:.5f}') #negativo

#Cualquier calculo que incluye un float, todo cambia a float 
a = 4.0 + 5
print(a)
print(type(a))
