package utn.tienda_libros.servicio;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import utn.tienda_libros.modelo.Libro;
import utn.tienda_libros.repositorio.LibroRepositorio;

@Service 
public class LibroServicio implements ILibroServicio{

    @Autowired //inyeccion una instancia de la clase
    private LibroRepositorio libroRepositorio;

    @Override 
    public List<Libro> listarLibros() {
        return libroRepositorio.findAll(); // regresa una lista con todos los libros
    }

    @Override 
    public Libro buscarLibroPorId(Integer idLibro) {
        Libro libro = libroRepositorio.findById(idLibro).orElse(null); // busca un libro por id y si no lo encuentra regresa null
        return libro;
    }

    @Override 
    public void guardarLibro(Libro libro) {
        libroRepositorio.save(libro); // guarda un libro 
    }

    @Override 
    public void eliminarLibro(Integer idLibro) {
        libroRepositorio.deleteById(idLibro); // elimina un libro por id
    }
}
