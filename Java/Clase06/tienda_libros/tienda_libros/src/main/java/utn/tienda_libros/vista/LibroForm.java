package utn.tienda_libros.vista;

import java.awt.BorderLayout;
import java.awt.FlowLayout;

import javax.swing.BorderFactory;
import javax.swing.JButton;
import javax.swing.JFrame;
import javax.swing.JLabel;
import javax.swing.JOptionPane;
import javax.swing.JPanel;
import javax.swing.JTextField;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import utn.tienda_libros.modelo.Libro;
import utn.tienda_libros.servicio.LibroServicio;

@Component
public class LibroForm extends JFrame {
    private final LibroServicio libroServicio;

    private JPanel panelPrincipal;
    private JLabel lblTitulo;
    private JTextField txtNombreLibro;
    private JButton btnGuardar;

    @Autowired
    public LibroForm(LibroServicio libroServicio) {
        this.libroServicio = libroServicio;
        iniciarFormulario();
    }

    private void iniciarFormulario() {
        setTitle("Tienda de Libros");
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setSize(900, 700);
        setLocationRelativeTo(null);
        setResizable(false);

        // Panel principal con márgenes internos
        panelPrincipal = new JPanel(new BorderLayout(10, 10));
        panelPrincipal.setBorder(BorderFactory.createEmptyBorder(20, 20, 20, 20));

        // Formulario (etiqueta + campo de texto)
        JPanel panelCampos = new JPanel(new FlowLayout(FlowLayout.CENTER, 10, 10));
        lblTitulo = new JLabel("Nombre del Libro:");
        txtNombreLibro = new JTextField(20);
        panelCampos.add(lblTitulo);
        panelCampos.add(txtNombreLibro);

        // Botón
        JPanel panelBoton = new JPanel();
        btnGuardar = new JButton("Guardar");
        panelBoton.add(btnGuardar);

        // Evento del botón Guardar
        btnGuardar.addActionListener(e -> guardarLibro());

        // Ensamblar la ventana
        panelPrincipal.add(panelCampos, BorderLayout.CENTER);
        panelPrincipal.add(panelBoton, BorderLayout.SOUTH);

        add(panelPrincipal);
    }

    private void guardarLibro() {
        String nombre = txtNombreLibro.getText().trim();

        if (nombre.isEmpty()) {
            JOptionPane.showMessageDialog(this, "Ingresa un nombre para el libro.");
            return;
        }

        Libro libro = new Libro();
        libro.setNombreLibro(nombre);
        // Si tu modelo tiene más campos (ej. autor o precio), asígnalos aquí antes de guardar

        this.libroServicio.guardarLibro(libro);

        JOptionPane.showMessageDialog(this, "Libro guardado exitosamente.");
        txtNombreLibro.setText("");
    }
}