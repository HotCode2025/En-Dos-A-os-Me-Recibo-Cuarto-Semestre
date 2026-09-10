package utn.estudiantes.servicio;

import java.util.List;

import utn.estudiantes.modelo.Estudiante;

public interface IEstudianteServicio {
    public List<Estudiante> listarEstudiantes();
    public Estudiante buscarEstudiantePorId(Integer idestudiantes2026);
    public void guardarEstudiante(Estudiante estudiante);
    public void eliminarEstudiante(Estudiante estudiante);
}
