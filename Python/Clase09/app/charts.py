import matplotlib.pyplot as plt

def generate_bar_chart(name, labels, values):
    fig, ax = plt.subplots()
    ax.bar(labels, values)
    
    # Título visible dentro de la gráfica
    ax.set_title(f'Población histórica - {name}')
    ax.set_xlabel('Año')
    ax.set_ylabel('Población')
    
    # Nombre del archivo guardado
    plt.savefig(f'./imgs/{name}_bar.png', bbox_inches='tight')
    plt.close()

def generate_pie_chart(name, labels, values):
    values = [float(v) for v in values]
    
    fig, ax = plt.subplots()
    ax.pie(values, labels=labels, autopct='%1.1f%%')
    ax.axis('equal')
    
    # Título visible dentro de la gráfica
    ax.set_title(f'Distribución de población - {name}')
    
    # Nombre del archivo guardado
    plt.savefig(f'./imgs/{name}_pie.png', bbox_inches='tight')
    plt.close()

if __name__ == '__main__':
    labels = ['a', 'b', 'c']
    values = [10, 40, 800]
    # generate_bar_chart('Test', labels, values)
    generate_pie_chart('Test_Region', labels, values)