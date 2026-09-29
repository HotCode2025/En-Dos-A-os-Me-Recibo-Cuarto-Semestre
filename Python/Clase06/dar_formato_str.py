# dar formato a un string
nombre = 'Ramiro'
edad = 24
mensaje_con_formato = 'Mi nombre es %s y tengo %d años' % (nombre, edad)

# A esto se los llama parámetros posicionales (%s, %d, %f, etc...)

persona = ('Candela', 'Tarifa', 5000.00)
mensaje_con_formato = 'Mi nombre es %s %s y mi salario es %.2f' 
print(mensaje_con_formato % persona)

nombre = 'Juan'
edad = 19
sueldo = 3000
# mensaje_con_formato = 'Nombre {} Edad {} Sueldo {:.2f}'
# print(mensaje_con_formato.format(nombre, edad, sueldo))
# mensaje = 'Nombre {0} Edad {1} Sueldo {2:.2f}'.format(nombre, edad, sueldo)
# print(mensaje)

mensaje = 'Nombre {n} Edad {e} Sueldo {s:.2f}'.format(n=nombre, e=edad, s=sueldo)
# print(mensaje)

diccionario = {'nombre': 'Ivan', 'edad': 20, 'sueldo': 4000.00}
mensaje = 'Nombre {dic[nombre]} Edad {dic[edad]} Sueldo {dic[sueldo]:.2f}'.format(dic=diccionario)
print(mensaje)