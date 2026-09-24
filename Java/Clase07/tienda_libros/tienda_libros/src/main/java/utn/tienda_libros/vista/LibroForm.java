package utn.tienda_libros.vista;

import java.awt.BorderLayout;
import java.awt.Font;
import java.util.List;

import javax.swing.BorderFactory;
import javax.swing.JFrame;
import javax.swing.JLabel;
import javax.swing.JPanel;
import javax.swing.JScrollPane;
import javax.swing.JTable;
import javax.swing.ListSelectionModel;
import javax.swing.SwingConstants;
import javax.swing.table.DefaultTableModel;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import utn.tienda_libros.modelo.Libro;
import utn.tienda_libros.servicio.LibroServicio;

@Component
public class LibroForm extends JFrame {
    private final LibroServicio libroServicio;

    private JPanel panelPrincipal;
    private JLabel lblTitulo;
    private JTable tablaLibros;
    private DefaultTableModel tablaModeloLibros;

    @Autowired
    public LibroForm(LibroServicio libroServicio) {
        this.libroServicio = libroServicio;
        iniciarFormulario();
        listarLibros();
    }

    private void iniciarFormulario() {
        setTitle("Tienda de Libros");
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setSize(900, 600);
        setLocationRelativeTo(null); // Centrar en la pantalla

        panelPrincipal = new JPanel(new BorderLayout(15, 15));
        panelPrincipal.setBorder(BorderFactory.createEmptyBorder(20, 20, 20, 20));

        // 1. Título superior centrado y con fuente destacada
        lblTitulo = new JLabel("Tienda de Libros", SwingConstants.CENTER);
        lblTitulo.setFont(new Font("Arial", Font.BOLD, 26));
        panelPrincipal.add(lblTitulo, BorderLayout.NORTH);

        // 2. Modelo de la tabla (columnas y que no sea editable directamente)
        tablaModeloLibros = new DefaultTableModel(
                new Object[]{"Id", "Libro", "Autor", "Precio", "Existencias"}, 0
        ) {
            @Override
            public boolean isCellEditable(int row, int column) {
                return false; // Deshabilitar edición directa al hacer clic
            }
        };

        // 3. Tabla dentro de un JScrollPane para que se vean los encabezados
        tablaLibros = new JTable(tablaModeloLibros);
        tablaLibros.setSelectionMode(ListSelectionModel.SINGLE_SELECTION);
        tablaLibros.setRowHeight(22);

        JScrollPane scrollPane = new JScrollPane(tablaLibros);
        panelPrincipal.add(scrollPane, BorderLayout.CENTER);

        add(panelPrincipal);
    }

    // Consulta los registros a la base de datos mediante el servicio y llena la tabla
    private void listarLibros() {
        tablaModeloLibros.setRowCount(0); // Limpiar datos previos
        List<Libro> libros = this.libroServicio.listarLibros();

        if (libros != null) {
            libros.forEach(libro -> {
                Object[] renglonLibro = {
                    libro.getIdLibro(),       // Ajusta al nombre de tu getter de ID en Libro.java
                    libro.getNombreLibro(),   // Ajusta al getter de nombre/título
                    libro.getAutor(),         // Getter del autor
                    libro.getPrecio(),        // Getter del precio
                    libro.getExistencias()    // Getter de las existencias/stock
                };
                this.tablaModeloLibros.addRow(renglonLibro);
            });
        }
    }
}