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

        // --- Datos para dibujar al personaje en el mapa (canvas) ---
        this.x = 20;                    // Posición horizontal inicial (0 = borde izquierdo)
        this.y = 30;                    // Posición vertical inicial (0 = borde de arriba)
        this.ancho = 80;                // Ancho con el que se dibuja
        this.alto = 80;                 // Alto con el que se dibuja
        this.mapaFoto = new Image();    // Objeto imagen que el canvas sabe dibujar
        this.mapaFoto.src = imagen;     // Le decimos qué archivo cargar
        this.velocidadX = 0;            // Cuánto se mueve en x por cada "tic" (0 = quieto)
        this.velocidadY = 0;            // Cuánto se mueve en y por cada "tic" (0 = quieto)
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
const azula = new Personaje('Azula', './media/azula.jpg'); // PERSONAJE CREADO (corregido a .jpg, igual que el archivo real)
const suki = new Personaje('Suki', './media/suki.jpg'); // Nuevo personaje

// === ARREGLO CON TODOS LOS PERSONAJES DISPONIBLES ===
// Se crea vacío y se va llenando con .push(): si mañana agregás un
// personaje nuevo, solo hace falta crearlo arriba (con "new") y
// agregarlo acá con push — el resto del juego no se toca.
const avatares = [];
avatares.push(zuko, katara, aang, toph, sokka, azula, suki);

// === VARIABLES Y CONSTANTES ===
// Estas SÍ cambian durante la partida: van a apuntar a los objetos
// Personaje que el jugador y la máquina eligieron para jugar esta ronda.
let jugador;
let enemigo;

// Guarda el "reloj" que redibuja el mapa cada 50 ms (lo crea setInterval).
// Es "let" porque recién se le asigna un valor cuando se elige personaje.
let intervalo;

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

// Este SÍ se puede capturar acá arriba, junto a los demás: el <div>
// vacío "contenedorTarjetas" ya existe en el HTML desde que carga la
// página. Lo que NO existe todavía son los inputs de cada personaje:
// esos los vamos a crear nosotros mismos más abajo, con forEach.
const contenedorTarjetas = document.getElementById('contenedorTarjetas');

// Sección y canvas del mapa: ambos están escritos a mano en el HTML,
// por eso se pueden capturar acá arriba sin problema.
const seccionVerMapa = document.getElementById('ver-mapa');
const mapa = document.getElementById('mapa');

// El "lienzo" es la herramienta con la que se dibuja dentro del canvas.
// "2d" = trabajamos en dos dimensiones (x horizontal, y vertical).
// Es const porque nunca lo reasignamos: solo lo usamos para dibujar.
const lienzo = mapa.getContext('2d');

// Aplicando el principio DRY (Don't Repeat Yourself):
// Mapeo de cada tipo de ataque a su emoji, reutilizado en toda la app.
const EMOJIS_ATAQUE = { punio: '👊', patada: '🦵', barrida: '👣' };

// === RENDERIZADO DINÁMICO DE LAS TARJETAS DE PERSONAJES ===
// Recorre el array "avatares" (un elemento por vuelta, en orden) y arma
// el HTML de cada tarjeta con un template literal (backticks). Por cada
// avatar, concatena (+=) su tarjeta dentro de "contenedorTarjetas".
// Esto reemplaza lo que antes escribías a mano en el HTML: agregar un
// personaje nuevo ya no requiere tocar ningún archivo HTML.
function renderizarTarjetasPersonajes() {
    avatares.forEach((avatar) => {
        const tarjetaHTML = `
            <div class="personaje">
                <img src="${avatar.imagen}" alt="${avatar.nombre}">
                <label for="${avatar.nombre}">${avatar.nombre}</label>
                <input type="radio" name="personaje" id="${avatar.nombre}" value="${avatar.nombre}">
            </div>
        `;
        contenedorTarjetas.innerHTML += tarjetaHTML;
    });
}

// === FUNCIÓN INICIAL ===
function iniciarJuego() {
    // Primero generamos las tarjetas dinámicamente. Tiene que pasar ANTES
    // de que cualquier otra parte del código intente buscar los inputs
    // de personaje — si alguien los buscara arriba, junto a los demás
    // "const" globales, estarían vacíos porque todavía no se crearon
    // (ese es justamente el bug de "declaración lenta" que vimos).
    renderizarTarjetasPersonajes();

    // Estado inicial de la interfaz
    seccionSeleccionarAtaque.style.display = 'none';
    seccionReiniciar.style.display = 'none';
    seccionVerMapa.style.display = 'none';

    // Asignación de event listeners mediante funciones flecha
    botonPunio.addEventListener('click', () => ataque('punio'));
    botonPatada.addEventListener('click', () => ataque('patada'));
    botonBarrida.addEventListener('click', () => ataque('barrida'));
    botonPersonajeJugador.addEventListener('click', seleccionarPersonajeJugador);
    botonReiniciar.addEventListener('click', () => location.reload());
}

// === SELECCIÓN DE PERSONAJES ===
function seleccionarPersonajeJugador() {
    // Importante: estos inputs se buscan ACÁ DENTRO, cada vez que se
    // ejecuta la función (es decir, cuando el usuario hace click en
    // "Seleccionar") — nunca arriba, junto a los const globales. Para
    // ese momento, renderizarTarjetasPersonajes() ya se ejecutó y los
    // inputs ya existen en el DOM.
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
    // Por ahora el combate queda en pausa: primero se recorre el mapa.
    // (La versión completa con combate está guardada como v1.)
    // seccionSeleccionarAtaque.style.display = 'block';
    seccionVerMapa.style.display = 'flex';

    // Cada 50 milisegundos se vuelve a ejecutar pintarPersonaje().
    // Eso es lo que permite ver el movimiento como una animación.
    intervalo = setInterval(pintarPersonaje, 50);

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

// === DIBUJO DEL PERSONAJE EN EL MAPA ===
// Se ejecuta cada 50 ms (por el setInterval). En cada "tic":
// 1) actualiza la posición sumando la velocidad (si es 0, no se mueve),
// 2) borra todo el canvas, 3) dibuja la imagen en la nueva posición.
function pintarPersonaje() {
    jugador.x = jugador.x + jugador.velocidadX;
    jugador.y = jugador.y + jugador.velocidadY;
    lienzo.clearRect(0, 0, mapa.width, mapa.height);
    lienzo.drawImage(
        jugador.mapaFoto,   // la imagen a dibujar
        jugador.x,          // posición en x
        jugador.y,          // posición en y
        jugador.ancho,      // ancho con el que se dibuja
        jugador.alto        // alto con el que se dibuja
    );
}

// === MOVIMIENTO ===
// Estas funciones NO dibujan: solo cambian la velocidad. Quien mueve
// de verdad al personaje es pintarPersonaje(), que se repite sola.
// En el canvas, x crece hacia la derecha e y crece hacia ABAJO.
function moverDerecha() {
    jugador.velocidadX = 5;
}

function moverIzquierda() {
    jugador.velocidadX = -5;
}

function moverAbajo() {
    jugador.velocidadY = 5;
}

function moverArriba() {
    jugador.velocidadY = -5;
}

// Al soltar el botón la velocidad vuelve a 0 y el personaje se frena.
function detenerMovimiento() {
    jugador.velocidadX = 0;
    jugador.velocidadY = 0;
}

// INICIO DEL CICLO DE VIDA
// El <script> está al final del <body>, así que el HTML ya existe:
// se puede llamar directamente, sin esperar el evento "load".
iniciarJuego();