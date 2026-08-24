package com.utn.datos;

import java.util.List;

import com.utn.dominio.Estudiante;

public interface IEstudianteDAO {
    List<Estudiante> listarEstudiantes();
    boolean buscarEstudiantePorId(Estudiante estudiante);
    boolean agregarEstudiante(Estudiante estudiante);
    boolean modificarEstudiante(Estudiante estudiante);
    boolean eliminarEstudiante(Estudiante estudiante);
}
