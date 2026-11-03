import utils
import read_csv
import charts

def run():
    data = read_csv.read_csv('./data.csv')
    continent = 'South America'
    data = list(filter(lambda item: item['Continent'] == continent, data))

    countries = list(map(lambda x: x['Country'], data))
    percentages = list(map(lambda x: float(x['World Population Percentage']), data))
    
    # Se le pasa el nombre del continente/región
    charts.generate_pie_chart(continent, countries, percentages)
    
    country_name = input('Type Country => ')
    print(country_name)

    result = utils.population_by_country(data, country_name)

    if len(result) > 0:
        country = result[0]
        labels, values = utils.get_population(country)
        # Se le pasa el nombre del país para el título y el archivo
        charts.generate_bar_chart(country['Country'], labels, values)
    else:
        print(f"No se encontró el país '{country_name}' en los datos.")

if __name__ == '__main__':
    run()