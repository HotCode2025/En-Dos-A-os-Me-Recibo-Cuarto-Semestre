package com.utn.presentacion;

import java.util.Scanner;

import com.utn.datos.EstudianteDAO;
import com.utn.datos.IEstudianteDAO;
import com.utn.dominio.Estudiante;

public class SistemaEstudiantesApp {

    public static void main(String[] args) {
        boolean salir = false;
        Scanner consola = new Scanner(System.in);
        // Creamos la instancia del DAO
        IEstudianteDAO estudianteDao = new EstudianteDAO();

        while (!salir) {
            try {
                mostrarMenu();
                salir = ejecutarOpciones(consola, estudianteDao);
            } catch (Exception e) {
                System.out.println("Ocurrió un error al procesar la opción: " + e.getMessage());
            }
            System.out.println();
        }
    }

    private static void mostrarMenu() {
        System.out.print("""
                --- Sistema de Gestión de Estudiantes ---
                1. Listar Estudiantes
                2. Buscar Estudiante
                3. Agregar Estudiante
                4. Modificar Estudiante
                5. Eliminar Estudiante
                6. Salir
                Elige una opción:\s""");
    }

    private static boolean ejecutarOpciones(Scanner consola, IEstudianteDAO estudianteDao) {
        var opcion = Integer.parseInt(consola.nextLine());
        var salir = false;

        switch (opcion) {
            case 1 -> { // Listar estudiantes
                System.out.println("\n--- Listado de Estudiantes ---");
                var estudiantes = estudianteDao.listarEstudiantes();
                estudiantes.forEach(System.out::println);
            }
            case 2 -> { // Buscar estudiante por ID
                System.out.print("\nIntroduce el ID del estudiante a buscar: ");
                var idEstudiante = Integer.parseInt(consola.nextLine());
                var estudiante = new Estudiante(idEstudiante);
                var encontrado = estudianteDao.buscarEstudiantePorId(estudiante);
                if (encontrado) {
                    System.out.println("Estudiante encontrado: " + estudiante);
                } else {
                    System.out.println("Estudiante NO encontrado con ID: " + idEstudiante);
                }
            }
            case 3 -> { // Agregar estudiante
                System.out.println("\n--- Agregar Estudiante ---");
                System.out.print("Nombre: ");
                var nombre = consola.nextLine();
                System.out.print("Apellido: ");
                var apellido = consola.nextLine();
                System.out.print("Teléfono: ");
                var telefono = consola.nextLine();
                System.out.print("Email: ");
                var email = consola.nextLine();

                var estudiante = new Estudiante(nombre, apellido, telefono, email);
                var agregado = estudianteDao.agregarEstudiante(estudiante);
                if (agregado) {
                    System.out.println("Estudiante agregado con éxito: " + estudiante);
                } else {
                    System.out.println("Error al agregar estudiante.");
                }
            }
            case 4 -> { // Modificar estudiante
                System.out.println("\n--- Modificar Estudiante ---");
                System.out.print("ID del Estudiante a modificar: ");
                var idEstudiante = Integer.parseInt(consola.nextLine());

                // Verificamos si existe primero
                var estudiante = new Estudiante(idEstudiante);
                var encontrado = estudianteDao.buscarEstudiantePorId(estudiante);

                if (encontrado) {
                    System.out.print("Nuevo Nombre: ");
                    var nombre = consola.nextLine();
                    System.out.print("Nuevo Apellido: ");
                    var apellido = consola.nextLine();
                    System.out.print("Nuevo Teléfono: ");
                    var telefono = consola.nextLine();
                    System.out.print("Nuevo Email: ");
                    var email = consola.nextLine();

                    estudiante.setNombre(nombre);
                    estudiante.setApellido(apellido);
                    estudiante.setTelefono(telefono);
                    estudiante.setEmail(email);

                    var modificado = estudianteDao.modificarEstudiante(estudiante);
                    if (modificado) {
                        System.out.println("Estudiante modificado correctamente: " + estudiante);
                    } else {
                        System.out.println("Error al modificar estudiante.");
                    }
                } else {
                    System.out.println("No se encontró el estudiante con ID: " + idEstudiante);
                }
            }
            case 5 -> { // Eliminar estudiante
                System.out.println("\n--- Eliminar Estudiante ---");
                System.out.print("ID del Estudiante a eliminar: ");
                var idEstudiante = Integer.parseInt(consola.nextLine());
                var estudiante = new Estudiante(idEstudiante);
                var eliminado = estudianteDao.eliminarEstudiante(estudiante);

                if (eliminado) {
                    System.out.println("Estudiante eliminado correctamente.");
                } else {
                    System.out.println("Error al eliminar estudiante con ID: " + idEstudiante);
                }
            }
            case 6 -> {
                System.out.println("¡Hasta pronto!");
                salir = true;
            }
            default -> System.out.println("Opción no válida: " + opcion);
        }
        return salir;
    }
}
