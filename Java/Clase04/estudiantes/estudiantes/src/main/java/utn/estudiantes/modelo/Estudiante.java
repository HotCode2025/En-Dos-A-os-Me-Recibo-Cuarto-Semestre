package utn.estudiantes.modelo;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Entity // Indica que la clase representa una entidad en la base de datos
//boilerplate - Codigo repetitivo
@Data // Genera getters y setters
@NoArgsConstructor // Genera constructor sin argumentos
@AllArgsConstructor // Genera constructor con todos los argumentos
@ToString // Genera toString
public class Estudiante {

    @Id // Indica que el atributo es la clave primaria de la entidad
    @GeneratedValue (strategy= GenerationType.IDENTITY) // Indica que el valor del atributo se generará automáticamente por la base de datos
    private Integer idEstudiante;
    private String nombre;
    private String apellido;
    private String telefono;
    private String email;
}
