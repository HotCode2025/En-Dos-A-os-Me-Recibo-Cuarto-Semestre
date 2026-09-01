# Bool contiene los valores de verdadero (True) y falso (False)
# Los tipos numéricos, es false para el 0, true para los demas valores.
valor = 0
resultado = bool(valor)
print(f'Valor: {valor}, Resultado: {resultado}')

valor = 15
resultado = bool(valor)
print(f'Valor: {valor}, Resultado: {resultado}')

#Tipo String -> False '', True demás valores
valor = 'Hola'
resultado = bool(valor)
print(f'Valor: {valor}, Resultado: {resultado}')

#Tipo de Colecciones -> False para colecciones vacías, True demás valores
valor = [1,2,3]
resultado = bool(valor)
print(f'Valor de coleccion: {valor}, Resultado: {resultado}')

#Tupla
valor = (1,2,3)
resultado = bool(valor)
print(f'Valor de una tupla: {valor}, Resultado: {resultado}')

#Diccionario
valor = {'a':1, 'b':2, 'c':3}
resultado = bool(valor)
print(f'Valor de un diccionario: {valor}, Resultado: {resultado}')

#Sentencias de control con bool 
if bool('a'):
    print('Verdadero')
else:
    print('Falso')

# Ciclos
variable = 3
while variable:
    print('Verdadero')
    break
else:
    print('Falso')