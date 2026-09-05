// === CANTIDAD DE VIDAS INICIALES ===
// Constante compartida por todos los personajes (jugador y enemigo).
const VIDAS_INICIALES = 3;

//  CLASE PERSONAJE (POO) 
// Una clase es el "molde" o plano: describe qué datos (propiedades) y
// qué acciones (métodos) va a tener CADA personaje que creemos a partir
// de ella. No es un personaje en sí — es la receta para fabricarlos.
class Personaje {
    // El constructor se ejecuta automáticamente cada vez que hacemos
    // "new Personaje(...)". Acá definimos qué necesita cada personaje
    // para "nacer", y se lo guardamos con "this." (this = este objeto puntual).
    constructor(nombre, imagen) {
        this.nombre = nombre;           // Propiedad: nombre del personaje
        this.imagen = imagen;           // Propiedad: ruta de su imagen
        this.vidas = VIDAS_INICIALES;   // Propiedad: arranca con las vidas iniciales
        this.ataque = null;             // Propiedad: todavía no eligió ataque
    }

    // Métodos: acciones que puede "hacer" un personaje.
    elegirAtaque(tipo) {
        this.ataque = tipo;
    }

    recibirDano() {
        this.vidas--;
    }

    estaDerrotado() {
        return this.vidas <= 0;
    }

    // Devuelve los corazones ya armados según sus vidas actuales.
    corazones() {
        return '❤️'.repeat(Math.max(0, this.vidas));
    }
}

// === PLANTILLA DE PERSONAJES DISPONIBLES ===
// Acá está toda la info particular de cada personaje. Si mañana querés
// agregar 100 o 1000 personajes más, solo agregás líneas acá — no hace
// falta tocar ninguna otra parte del código.
const DATOS_PERSONAJES = [
    { nombre: 'Zuko', imagen: './media/zuko.png' },
    { nombre: 'Katara', imagen: './media/katara.png' },
    { nombre: 'Aang', imagen: './media/aang.png' },
    { nombre: 'Toph', imagen: './media/toph.png' },
    { nombre: 'Sokka', imagen: './media/sokka.png' }, // PERSONAJE CREADO
    { nombre: 'Azula', imagen: './media/azula.png' }, // PERSONAJE CREADO 
];

// Importante: DATOS_PERSONAJES son solo los DATOS (el "catálogo"), no
// objetos Personaje todavía. Los objetos reales se crean con "new" recién
// cuando se elige un participante (más abajo), para que el jugador y el
// enemigo sean SIEMPRE dos objetos independientes, aunque les toque el
// mismo nombre — así cada uno tiene sus propias vidas y su propio ataque.

// === VARIABLES Y CONSTANTES ===
// Estas SÍ cambian durante la partida: van a apuntar a los objetos
// Personaje que el jugador y la máquina eligieron para jugar esta ronda.
let jugador;
let enemigo;

// Referencias globales del DOM: se buscan una sola vez, arriba de todo,
// y se reutilizan en todas las funciones. Como se asignan en la misma línea
// donde se declaran, pueden ser "const" (requiere que el HTML ya exista
// al ejecutarse esta línea: script al final del <body> o con "defer").
const botonPunio = document.getElementById('boton-punio');
const botonPatada = document.getElementById('boton-patada');
const botonBarrida = document.getElementById('boton-barrida');
const botonPersonajeJugador = document.getElementById('boton-personaje');
const botonReiniciar = document.getElementById('boton-reiniciar');

const spanPersonajeJugador = document.getElementById('personaje-jugador');
const spanPersonajeEnemigo = document.getElementById('personaje-enemigo');
const spanVidasJugador = document.getElementById('vidas-jugador');
const spanVidasEnemigo = document.getElementById('vidas-enemigo');

const seccionSeleccionarPersonaje = document.getElementById('seleccionar-personaje');
const seccionSeleccionarAtaque = document.getElementById('seleccionar-ataque');
const seccionReiniciar = document.getElementById('reiniciar');

// Aplicando el principio DRY (Don't Repeat Yourself):
// Mapeo de cada tipo de ataque a su emoji, reutilizado en toda la app.
const EMOJIS_ATAQUE = { punio: '👊', patada: '🦵', barrida: '👣' };

// === FUNCIÓN INICIAL ===
// Ya no busca elementos del DOM (eso se hizo arriba); solo define el
// estado inicial de la interfaz y asigna los eventos.
function iniciarJuego() {
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
    let nombreElegido = null;
    // Recorre los inputs para encontrar cuál fue seleccionado
    inputs.forEach(input => {
        if (input.checked) {
            nombreElegido = input.value;
        }
    });

    if (!nombreElegido) {
        alert('Por favor seleccioná un personaje');
        return;
    }

    // Busca en el catálogo los datos del personaje elegido, y con esos
    // datos fabrica un objeto Personaje nuevo (con "new"): a partir de
    // acá "jugador" es un objeto completo, con sus propias vidas y ataque.
    const datosJugador = DATOS_PERSONAJES.find(datos => datos.nombre === nombreElegido);
    jugador = new Personaje(datosJugador.nombre, datosJugador.imagen);
    spanPersonajeJugador.innerHTML = jugador.nombre;

    // Transición de vistas en la interfaz
    seccionSeleccionarPersonaje.style.display = 'none';
    seccionSeleccionarAtaque.style.display = 'block';

    // Selección aleatoria del rival: se eligen datos al azar del catálogo
    // y se fabrica OTRO objeto Personaje nuevo e independiente para el enemigo.
    const random = Math.floor(Math.random() * DATOS_PERSONAJES.length);
    const datosEnemigo = DATOS_PERSONAJES[random];
    enemigo = new Personaje(datosEnemigo.nombre, datosEnemigo.imagen);
    spanPersonajeEnemigo.innerHTML = enemigo.nombre;
}

// === LOGICA DEL ATAQUE ===
function ataque(tipoAtaque) {
    // En vez de guardar el ataque en una variable suelta, se lo pedimos
    // al objeto: es EL PERSONAJE quien "elige su ataque" (método de la clase).
    jugador.elegirAtaque(tipoAtaque);

    // Generación aleatoria del ataque enemigo, reutilizando las claves de EMOJIS_ATAQUE (DRY)
    const opciones = Object.keys(EMOJIS_ATAQUE);
    enemigo.elegirAtaque(opciones[Math.floor(Math.random() * opciones.length)]);

    combate();
}

// === RESOLUCIÓN DEL COMBATE Y ANIMACIONES ===
function combate() {
    const visuJugador = document.getElementById('ataque-visu-jugador');
    const visuEnemigo = document.getElementById('ataque-visu-enemigo');
    const banner = document.getElementById('banner-resultado');
    const tarjetaJugador = document.getElementById('tarjeta-jugador');
    const tarjetaEnemigo = document.getElementById('tarjeta-enemigo');

    // Mapeo dinámico visual consumiendo el objeto EMOJIS_ATAQUE (DRY)
    visuJugador.innerHTML = EMOJIS_ATAQUE[jugador.ataque];
    visuEnemigo.innerHTML = EMOJIS_ATAQUE[enemigo.ataque];

    // Despliegue de animación de choque
    visuJugador.classList.add('animar-choque');
    visuEnemigo.classList.add('animar-choque');
    setTimeout(() => {
        visuJugador.classList.remove('animar-choque');
        visuEnemigo.classList.remove('animar-choque');
    }, 400);

    banner.className = '';

    // Evaluación del ganador de la ronda aplicando reglas condicionales
    if (jugador.ataque === enemigo.ataque) {
        banner.innerHTML = '¡EMPATE!';
        banner.classList.add('banner-empate');
    } else if (
        (jugador.ataque === 'punio' && enemigo.ataque === 'barrida') ||
        (jugador.ataque === 'patada' && enemigo.ataque === 'punio') ||
        (jugador.ataque === 'barrida' && enemigo.ataque === 'patada')
    ) {
        enemigo.recibirDano();
        banner.innerHTML = '¡ASALTO GANADO!';
        banner.classList.add('banner-ganaste');
        tarjetaEnemigo.classList.add('animar-dano');
        setTimeout(() => tarjetaEnemigo.classList.remove('animar-dano'), 300);
    } else {
        jugador.recibirDano();
        banner.innerHTML = '¡ASALTO PERDIDO!';
        banner.classList.add('banner-perdiste');
        tarjetaJugador.classList.add('animar-dano');
        setTimeout(() => tarjetaJugador.classList.remove('animar-dano'), 300);
    }

    // Actualización de la representación visual de vidas usando el método corazones() del objeto (DRY)
    spanVidasJugador.innerHTML = jugador.corazones();
    spanVidasEnemigo.innerHTML = enemigo.corazones();

    // Comprobación de fin de juego y desactivación de controles
    if (jugador.estaDerrotado() || enemigo.estaDerrotado()) {
        banner.innerHTML = jugador.estaDerrotado() ? '💀 ¡Juego Terminado: Perdiste!' : '🎉 ¡Victoria!';
        botonPunio.disabled = true;
        botonPatada.disabled = true;
        botonBarrida.disabled = true;
        seccionReiniciar.style.display = 'block';
    }
}

// INICIO DEL CICLO DE VIDA
// El <script> está al final del <body>, así que el HTML ya existe:
// se puede llamar directamente, sin esperar el evento "load".
iniciarJuego();