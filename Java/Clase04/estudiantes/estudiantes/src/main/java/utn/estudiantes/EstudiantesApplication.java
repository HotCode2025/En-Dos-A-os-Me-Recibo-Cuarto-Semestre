package utn.estudiantes;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import utn.estudiantes.servicio.EstudianteServicio;

@SpringBootApplication
public class EstudiantesApplication implements CommandLineRunner {

	@Autowired
	private EstudianteServicio estudianteServicio; // Inyección de dependencia del servicio de estudiantes
	private static final Logger logger = LoggerFactory.getLogger(EstudiantesApplication.class); // Logger para registrar información en la consola, su funcion es registrar mensajes de depuración, información y errores durante la ejecución de la aplicación.

	String nl = System.lineSeparator(); // Variable para almacenar el salto de línea del sistema operativo

	public static void main(String[] args) { // Método principal que se ejecuta al iniciar la aplicación
		logger.info("Iniciando la aplicacion...");
		// Levantar fabrica de Spring Boot y ejecutar la aplicación
		SpringApplication.run(EstudiantesApplication.class, args);
		logger.info("Aplicacion Finalizada!");
	}

	@Override
	public void run(String... args) throws Exception { 
		// Lógica de negocio que se ejecuta al iniciar la aplicación
		logger.info(nl+"Ejecutando el metodo run de Spring Boot..."+nl);

	}

}
