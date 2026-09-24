package utn.tienda_libros;

import java.awt.EventQueue;

import org.springframework.boot.WebApplicationType;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.context.ConfigurableApplicationContext;

import utn.tienda_libros.vista.LibroForm;

@SpringBootApplication
public class TiendaLibrosApplication {

    public static void main(String[] args) {
        // Desactivar el modo headless para habilitar Swing
        ConfigurableApplicationContext contextoSpring =
                new SpringApplicationBuilder(TiendaLibrosApplication.class)
                        .headless(false)
                        .web(WebApplicationType.NONE)
                        .run(args);

        // Ejecutar la ventana en el hilo de eventos de Swing (EDT), es decir, ejecutamos el código para cargar el formulario
        EventQueue.invokeLater(() -> {
            // Obtenemos el objeto formulario a traves de Spring
            LibroForm libroForm = contextoSpring.getBean(LibroForm.class);
            libroForm.setVisible(true);
        });
    }
}
