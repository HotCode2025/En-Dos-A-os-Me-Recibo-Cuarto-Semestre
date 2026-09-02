package utn.estudiantes.servicio;

import java.util.List;

import utn.estudiantes.modelo.Estudiante;

public interface IEstudianteServicio {
    List<Estudiante> listarEstudiantes();
    Estudiante buscarEstudiantePorId(Integer idEstudiante);
    void guardarEstudiante(Estudiante estudiante);
    void eliminarEstudiante(Estudiante estudiante);
}
