USE estudiantes;
-- Comenzamos con CRUD: create (insertar), read (leer), update (actualizar), delete (eliminar)
-- Listar estudiantes (read)
SELECT * FROM estudiantes.estudiantes2026;

-- Insertar estudiantes (create)
INSERT INTO estudiantes.estudiantes2026 (nombre, apellido, telefono, email) VALUES ("Juan", "Perez", "2604534765", "juan@gmail.com");

-- Actualizar estudiantes (update)
UPDATE estudiantes.estudiantes2026 SET nombre="Juan Carlos", apellido="García" WHERE idestudiantes2026=1;

-- Eliminar estuidantes (eliminar)
DELETE FROM estudiantes.estudiantes2026 WHERE idestudiantes2026=5;

-- Para modificar el id y comience en 1
ALTER TABLE estudiantes.estudiantes2026 AUTO_INCREMENT = 1;