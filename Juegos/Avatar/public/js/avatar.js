// === CANTIDAD DE VIDAS INICIALES ===
// Constante compartida por todos los personajes (jugador y enemigo).
const VIDAS_INICIALES = 3;

// === CLASE PERSONAJE (Programación Orientada a Objetos) ===
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

// === INSTANCIAS DE CADA PERSONAJE ===
// Acá sí se usa "new Personaje(...)": creamos, uno por uno, cada
// personaje disponible como un objeto real (con sus propias vidas,
// aunque todavía no estén jugando ninguna partida).
const zuko = new Personaje('Zuko', './media/zuko.png');
const katara = new Personaje('Katara', './media/katara.png');
const aang = new Personaje('Aang', './media/aang.png');
const toph = new Personaje('Toph', './media/toph.png');
const sokka = new Personaje('Sokka', './media/sokka.png'); // PERSONAJE CREADO
const azula = new Personaje('Azula', './media/azula.png'); // PERSONAJE CREADO
const suki = new Personaje('Suki', './media/suki.jpg'); // Nuevo personaje 


// === ARREGLO CON TODOS LOS PERSONAJES DISPONIBLES ===
// Se crea vacío y se va llenando con .push(): si mañana agregás un
// personaje nuevo, solo hace falta crearlo arriba (con "new") y
// agregarlo acá con push — el resto del juego no se toca.
const avatares = [];
avatares.push(zuko, katara, aang, toph, sokka, azula,suki);

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

    // Busca en el array "avatares" el objeto del personaje elegido, y con
    // su nombre e imagen fabrica un objeto Personaje NUEVO (con "new"):
    // así "jugador" no comparte instancia con el avatar guardado en el
    // array ni con el enemigo, aunque hayan elegido el mismo personaje.
    const avatarJugador = avatares.find(avatar => avatar.nombre === nombreElegido);
    jugador = new Personaje(avatarJugador.nombre, avatarJugador.imagen);
    spanPersonajeJugador.innerHTML = jugador.nombre;

    // Transición de vistas en la interfaz
    seccionSeleccionarPersonaje.style.display = 'none';
    seccionSeleccionarAtaque.style.display = 'block';

    // Selección aleatoria del rival: se elige un avatar al azar del array
    // (usando .length, tal como lo vimos con los arrays) y se fabrica
    // OTRO objeto Personaje nuevo e independiente para el enemigo.
    const random = Math.floor(Math.random() * avatares.length);
    const avatarEnemigo = avatares[random];
    enemigo = new Personaje(avatarEnemigo.nombre, avatarEnemigo.imagen);
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