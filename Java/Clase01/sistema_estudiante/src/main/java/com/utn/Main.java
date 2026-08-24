package com.utn;

import com.utn.datos.EstudianteDAO;
import com.utn.datos.IEstudianteDAO;
import com.utn.dominio.Estudiante;

public class Main {
    public static void main(String[] args) {
        IEstudianteDAO estudianteDao = new EstudianteDAO();

        // 1. Probar Listar
        System.out.println("=== Listado de Estudiantes ===");
        var estudiantes = estudianteDao.listarEstudiantes();
        estudiantes.forEach(System.out::println);

        // 2. Probar Buscar por ID
        System.out.println("\n=== Buscar Estudiante idestudiantes2026 = 1 ===");
        var estudiante1 = new Estudiante(1);
        boolean encontrado = estudianteDao.buscarEstudiantePorId(estudiante1);
        if (encontrado) {
            System.out.println("Estudiante encontrado: " + estudiante1);
        } else {
            System.out.println("No se encontró el estudiante con ID 1");
        }
    }
}