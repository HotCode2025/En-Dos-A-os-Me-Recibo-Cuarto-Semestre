package utn.estudiantes.servicio;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import utn.estudiantes.modelo.Estudiante;
import utn.estudiantes.repositorio.EstudianteRepositorio;

@Service
public class EstudianteServicio implements IEstudianteServicio {
    @Autowired
    private EstudianteRepositorio estudianteRepositorio; //inyecta el repositorio

    @Override
    public List<Estudiante> listarEstudiantes(){
        List<Estudiante> estudiantes = estudianteRepositorio.findAll(); //llama al metodo findAll del repositorio para obtener todos los estudiantes
        return estudiantes;
    };
    @Override
    public Estudiante buscarEstudiantePorId(Integer idestudiante2026){
        Estudiante estudiante = estudianteRepositorio.findById(idestudiante2026).orElse(null); //llama al metodo findById del repositorio para obtener el estudiante con el id especificado, y si no lo encuentra, devuelve null
        return estudiante;
    };
    @Override
    public void guardarEstudiante(Estudiante estudiante){
        estudianteRepositorio.save(estudiante); //llama al metodo save del repositorio para guardar el estudiante en la base de datos
    };
    @Override
    public void eliminarEstudiante(Estudiante estudiante){
        estudianteRepositorio.delete(estudiante); //llama al metodo delete del repositorio para eliminar el estudiante de la base de datos
    };
}
