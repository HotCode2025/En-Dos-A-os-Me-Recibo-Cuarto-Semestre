// === VARIABLES Y CONSTANTES ===
// Variables para almacenar los estados dinámicos del estado de juego

let ataqueJugador;
let ataqueEnemigo;
let vidasJugador = 3;
let vidasEnemigo = 3;

// Declaración de variables para los botones del DOM
let botonPunio;
let botonPatada;
let botonBarrida;
let botonPersonajeJugador;
let botonReiniciar;

// Declaración de variables para los contenedores dinámicos del DOM
let spanPersonajeJugador;
let spanPersonajeEnemigo;
let spanVidasJugador;
let spanVidasEnemigo;

// Declaración de variables para la visibilidad de secciones
let seccionSeleccionarPersonaje;
let seccionSeleccionarAtaque;
let seccionReiniciar;

// Aplicando el principio DRY (Don't Repeat Yourself):
// Definición de estructuras de datos inmutables reutilizables en lugar de duplicar valores en el código
const PERSONAJES = ['Zuko', 'Katara', 'Aang', 'Toph'];
const EMOJIS_ATAQUE = { punio: '👊', patada: '🦵', barrida: '👣' };

// === FUNCIÓN INICIAL ===
// Asigna los eventos y captura las referencias del DOM una vez cargado el documento
function iniciarJuego() {
    botonPunio = document.getElementById('boton-punio');
    botonPatada = document.getElementById('boton-patada');
    botonBarrida = document.getElementById('boton-barrida');
    botonPersonajeJugador = document.getElementById('boton-personaje');
    botonReiniciar = document.getElementById('boton-reiniciar');

    spanPersonajeJugador = document.getElementById('personaje-jugador');
    spanPersonajeEnemigo = document.getElementById('personaje-enemigo');
    spanVidasJugador = document.getElementById('vidas-jugador');
    spanVidasEnemigo = document.getElementById('vidas-enemigo');

    seccionSeleccionarPersonaje = document.getElementById('seleccionar-personaje');
    seccionSeleccionarAtaque = document.getElementById('seleccionar-ataque');
    seccionReiniciar = document.getElementById('reiniciar');

    // Estado inicial de la interfaz
    seccionSeleccionarAtaque.style.display = 'none';
    seccionReiniciar.style.display = 'none';

    // Asignación de event listeners mediante funciones flecha
    botonPunio.addEventListener('click', () => ataque('punio'));
    botonPatada.addEventListener('click', () => ataque('patada'));
    botonBarrida.addEventListener('click', () => ataque('barrida'));
    botonPersonajeJugador.addEventListener('click', seleccionarPersonajeJugador);
    botonReiniciar.addEventListener('click', () => location.reload());
}
// === SELECCIÓN DE PERSONAJES ===
function seleccionarPersonajeJugador() {
    const inputs = document.querySelectorAll('input[name="personaje"]');
    let seleccionado = false;
    // Recorre los inputs aplicando DRY para validar cuál fue seleccionado
    inputs.forEach(input => {
        if (input.checked) {
            spanPersonajeJugador.innerHTML = input.value;
            seleccionado = true;
        }
    });

    if (!seleccionado) {
        alert('Por favor seleccioná un personaje');
        return;
    }
    // Transición de vistas en la interfaz
    seccionSeleccionarPersonaje.style.display = 'none';
    seccionSeleccionarAtaque.style.display = 'block';

    // Selección aleatoria del rival consumiendo el arreglo de la constante PERSONAJES (DRY)
    const random = Math.floor(Math.random() * PERSONAJES.length);
    spanPersonajeEnemigo.innerHTML = PERSONAJES[random];
}
    // === LOGICA DEL ATAQUE ==
function ataque(tipoAtaque) {
    ataqueJugador = tipoAtaque;

        // Generación aleatoria del ataque enemigo reutilizando una estructura en arreglo
    const opciones = ['punio', 'patada', 'barrida'];
    ataqueEnemigo = opciones[Math.floor(Math.random() * 3)];

    combate();
}
    // === RESOLUCIÓN DEL COMBATE Y ANIMACIONES ===
function combate() {
    const visuJugador = document.getElementById('ataque-visu-jugador');
    const visuEnemigo = document.getElementById('ataque-visu-enemigo');
    const banner = document.getElementById('banner-resultado');
    const tarjetaJugador = document.getElementById('tarjeta-jugador');
    const tarjetaEnemigo = document.getElementById('tarjeta-enemigo');

    // Mapeo dinámico visual consumiendo el objeto EMOJISATAQUE (DRY)
    visuJugador.innerHTML = EMOJIS_ATAQUE[ataqueJugador];
    visuEnemigo.innerHTML = EMOJIS_ATAQUE[ataqueEnemigo];

    // Despliegue de animación de choque
    visuJugador.classList.add('animar-choque');
    visuEnemigo.classList.add('animar-choque');
    setTimeout(() => {
        visuJugador.classList.remove('animar-choque');
        visuEnemigo.classList.remove('animar-choque');
    }, 400);

    banner.className = '';

    // Evaluación del ganador de la ronda aplicando reglas condicionales
    if (ataqueJugador === ataqueEnemigo) {
        banner.innerHTML = '¡EMPATE!';
        banner.classList.add('banner-empate');
    } else if (
        (ataqueJugador === 'punio' && ataqueEnemigo === 'barrida') ||
        (ataqueJugador === 'patada' && ataqueEnemigo === 'punio') ||
        (ataqueJugador === 'barrida' && ataqueEnemigo === 'patada')
    ) {
        vidasEnemigo--;
        banner.innerHTML = '¡ASALTO GANADO!';
        banner.classList.add('banner-ganaste');
        tarjetaEnemigo.classList.add('animar-dano');
        setTimeout(() => tarjetaEnemigo.classList.remove('animar-dano'), 300);
    } else {
        vidasJugador--;
        banner.innerHTML = '¡ASALTO PERDIDO!';
        banner.classList.add('banner-perdiste');
        tarjetaJugador.classList.add('animar-dano');
        setTimeout(() => tarjetaJugador.classList.remove('animar-dano'), 300);
    }
    // Actualización de la representación visual de vidas usando el método .repeat() (DRY)
    spanVidasJugador.innerHTML = '❤️'.repeat(Math.max(0, vidasJugador));
    spanVidasEnemigo.innerHTML = '❤️'.repeat(Math.max(0, vidasEnemigo));

    // Comprobación de fin de juego y desactivación de controles
    if (vidasJugador === 0 || vidasEnemigo === 0) {
        banner.innerHTML = vidasJugador === 0 ? '💀 ¡Juego Terminado: Perdiste!' : '🎉 ¡Victoria!';
        botonPunio.disabled = true;
        botonPatada.disabled = true;
        botonBarrida.disabled = true;
        seccionReiniciar.style.display = 'block';
    }
}
//INICIO DEL CICLO DE VIDA 
// Carga del script al finalizar el renderizado del DOM
window.addEventListener('load', iniciarJuego);