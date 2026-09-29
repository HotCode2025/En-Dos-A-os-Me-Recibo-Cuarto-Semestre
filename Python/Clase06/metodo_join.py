tupla_str = ('Hola', 'Alumnos', 'Tecnicatura', 'Universitaria')
mensaje = ' '.join(tupla_str)
print(f'Mensaje: {mensaje}')

lista_cursos = ['Python', 'Java', 'C++', 'JavaScript']
mensaje = ', '.join(lista_cursos)
print(f'Mensaje: {mensaje}')

cadena = 'HolaMundo'
mensaje = '.'.join(cadena)
print(f'Mensaje: {mensaje}')

diccionario = {'nombre': 'Ramiro', 'apellido': 'Muñoz', 'edad': '24'}
llaves = '-'.join(diccionario.keys())
valores = '-'.join(diccionario.values())
print(f'Llaves: {llaves}, Type: {type(llaves)}')
print(f'Valores: {valores}, Type: {type(valores)}')