# Instrucciones del proyecto — E-commerce PuntoZero

## Documentación

- `README.md` debe mantenerse siempre actualizado. Todo cambio que afecte cómo se instala, configura o usa el proyecto se documenta en el README dentro de la misma tarea, entre otros:
  - variables de entorno y puertos;
  - endpoints, roles y pantallas;
  - flujo de pagos;
  - problemas frecuentes;
  - limitaciones conocidas.
- El README está escrito en español neutro y profesional, pensado para alguien que inicializa el proyecto por primera vez.

## Restricciones de trabajo

- No hacer commits, push ni deploy sin una indicación explícita del responsable del proyecto.
- No leer ni escribir archivos `.env`.
- No escribir en la base de datos real. Los cambios de datos o de esquema los ejecuta el responsable.
- Backend: TDD con `cd backend && npm test` (`node --test`). Frontend: verificar con `cd frontend && npm run build`.
- Seguimiento de tareas en `odd/tasks/plan-accion-auditoria.md`.
