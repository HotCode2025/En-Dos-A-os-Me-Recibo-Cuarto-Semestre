// ==================== CONFIGURACIÓN Y PERSONAJES ====================
const VIDAS_INICIALES = 3;
const VELOCIDAD_JUGADOR = 5;
const VELOCIDAD_ENEMIGO = 1.8;

const EMOJIS_ATAQUE = {
    punio: '👊',
    patada: '🦵',
    barrida: '👣'
};

// ==================== CLASE PERSONAJE ====================
class Personaje {
    constructor(nombre, imagen) {
        this.nombre = nombre;
        this.imagen = imagen;
        this.vidas = VIDAS_INICIALES;
        this.ataque = null;
        this.x = 0;
        this.y = 0;
        this.ancho = 65;
        this.alto = 65;

        this.mapaFoto = new Image();
        this.mapaFoto.src = imagen;
    }

    recibirDano() {
        this.vidas = Math.max(0, this.vidas - 1);
    }

    estaDerrotado() {
        return this.vidas <= 0;
    }

    corazones() {
        return '❤️'.repeat(Math.max(0, this.vidas)) || '🖤';
    }

    pintarEnMapa() {
        if (this.mapaFoto.complete && this.mapaFoto.naturalWidth > 0) {
            lienzo.drawImage(
                this.mapaFoto,
                this.x,
                this.y,
                this.ancho,
                this.alto
            );
        } else {
            lienzo.fillStyle = this === jugador ? '#2563eb' : '#dc2626';
            lienzo.beginPath();
            lienzo.arc(
                this.x + this.ancho / 2,
                this.y + this.alto / 2,
                this.ancho / 2,
                0,
                Math.PI * 2
            );
            lienzo.fill();

            lienzo.fillStyle = '#fff';
            lienzo.font = '12px sans-serif';
            lienzo.textAlign = 'center';
            lienzo.fillText(
                this.nombre,
                this.x + this.ancho / 2,
                this.y + this.alto + 14
            );
        }
    }
}

// ==================== PERSONAJES DISPONIBLES ====================
const avatares = [
    new Personaje('Zuko', './media/zuko.png'),
    new Personaje('Katara', './media/katara.png'),
    new Personaje('Aang', './media/aang.png'),
    new Personaje('Toph', './media/toph.png'),
    new Personaje('Sokka', './media/sokka.png'),
    new Personaje('Azula', './media/azula.jpg'),
    new Personaje('Suki', './media/suki.jpg')
];

// ==================== ELEMENTOS HTML ====================
const $ = id => document.getElementById(id);

const contenedorTarjetas = $('contenedorTarjetas');
const botonPersonaje = $('boton-personaje');
const botonReiniciar = $('boton-reiniciar');

const seccionSeleccionarPersonaje = $('seleccionar-personaje');
const seccionVerMapa = $('ver-mapa');
const seccionSeleccionarAtaque = $('seleccionar-ataque');
const seccionReiniciar = $('reiniciar');

const mapa = $('mapa');
const lienzo = mapa.getContext('2d');

const mapaBackground = new Image();
mapaBackground.src = './media/mapa.png';

// ==================== VARIABLES DEL JUEGO ====================
let jugador = null;
let enemigo = null;

let intervaloMapa = null;
let intervaloCombate = null;

let combateEnCurso = false;
let partidaTerminada = false;
let ronda = 0;

const teclas = new Set();

// ==================== NÚMERO ALEATORIO ====================
function numeroAleatorio(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ==================== SELECCIÓN DE PERSONAJE ====================
function renderizarTarjetasPersonajes() {
    contenedorTarjetas.innerHTML = '';

    avatares.forEach(avatar => {
        const tarjeta = document.createElement('div');
        tarjeta.className = 'personaje';

        tarjeta.innerHTML = `
            <img src="${avatar.imagen}" alt="${avatar.nombre}">
            <label>${avatar.nombre}</label>
            <input type="radio" name="personaje"
                value="${avatar.nombre}"
                aria-label="Elegir ${avatar.nombre}">
        `;

        const radio = tarjeta.querySelector('input');

        tarjeta.addEventListener('click', () => {
            radio.checked = true;

            document.querySelectorAll('.personaje').forEach(t => {
                t.classList.remove('seleccionado');
            });

            tarjeta.classList.add('seleccionado');
        });

        contenedorTarjetas.appendChild(tarjeta);
    });
}

function seleccionarPersonaje() {
    const elegido = document.querySelector(
        'input[name="personaje"]:checked'
    );

    if (!elegido) {
        alert('Por favor, elegí un personaje.');
        return;
    }

    const avatarElegido = avatares.find(
        a => a.nombre === elegido.value
    );

    jugador = new Personaje(
        avatarElegido.nombre,
        avatarElegido.imagen
    );

    const opciones = avatares.filter(
        a => a.nombre !== jugador.nombre
    );

    const elegidoEnemigo =
        opciones[numeroAleatorio(0, opciones.length - 1)];

    enemigo = new Personaje(
        elegidoEnemigo.nombre,
        elegidoEnemigo.imagen
    );

    $('personaje-jugador').textContent = jugador.nombre;
    $('personaje-enemigo').textContent = enemigo.nombre;

    $('vidas-jugador').textContent = jugador.corazones();
    $('vidas-enemigo').textContent = enemigo.corazones();

    seccionSeleccionarPersonaje.style.display = 'none';
    seccionVerMapa.style.display = 'block';

    $('estado-mapa').textContent =
        `Encontrá a ${enemigo.nombre}. ¡Cuando se toquen comenzará la pelea!`;

    iniciarMapa();

    seccionVerMapa.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
}

// ==================== INICIAR MAPA ====================
function iniciarMapa() {
    mapa.width = 800;
    mapa.height = 500;

    jugador.x = 35;
    jugador.y = (mapa.height - jugador.alto) / 2;

    enemigo.x = mapa.width - enemigo.ancho - 35;
    enemigo.y = numeroAleatorio(
        35,
        mapa.height - enemigo.alto - 35
    );

    combateEnCurso = false;
    partidaTerminada = false;
    ronda = 0;
    teclas.clear();

    if (intervaloMapa) {
        clearInterval(intervaloMapa);
    }

    intervaloMapa = setInterval(
        actualizarMapa,
        1000 / 30
    );
}

// ==================== MOVIMIENTO DEL JUGADOR ====================
function moverJugador() {
    if (!jugador || combateEnCurso || partidaTerminada) {
        return;
    }

    let dx = 0;
    let dy = 0;

    if (teclas.has('ArrowLeft') || teclas.has('a')) dx--;
    if (teclas.has('ArrowRight') || teclas.has('d')) dx++;
    if (teclas.has('ArrowUp') || teclas.has('w')) dy--;
    if (teclas.has('ArrowDown') || teclas.has('s')) dy++;

    // Evitar que el movimiento diagonal sea más rápido
    if (dx !== 0 && dy !== 0) {
        dx *= Math.SQRT1_2;
        dy *= Math.SQRT1_2;
    }

    jugador.x = Math.max(
        0,
        Math.min(
            mapa.width - jugador.ancho,
            jugador.x + dx * VELOCIDAD_JUGADOR
        )
    );

    jugador.y = Math.max(
        0,
        Math.min(
            mapa.height - jugador.alto,
            jugador.y + dy * VELOCIDAD_JUGADOR
        )
    );
}

// ==================== ENEMIGO QUE PERSIGUE ====================
function moverEnemigo() {
    if (combateEnCurso || partidaTerminada) return;

    const jx = jugador.x + jugador.ancho / 2;
    const jy = jugador.y + jugador.alto / 2;

    const ex = enemigo.x + enemigo.ancho / 2;
    const ey = enemigo.y + enemigo.alto / 2;

    const dx = jx - ex;
    const dy = jy - ey;

    const distancia = Math.hypot(dx, dy);

    if (distancia > 0) {
        enemigo.x +=
            (dx / distancia) * VELOCIDAD_ENEMIGO;

        enemigo.y +=
            (dy / distancia) * VELOCIDAD_ENEMIGO;
    }
}

// ==================== DETECTAR CONTACTO ====================
function personajesSeTocan() {
    return (
        jugador.x < enemigo.x + enemigo.ancho &&
        jugador.x + jugador.ancho > enemigo.x &&
        jugador.y < enemigo.y + enemigo.alto &&
        jugador.y + jugador.alto > enemigo.y
    );
}

// ==================== DIBUJAR ARENA ====================
function dibujarArena() {
    lienzo.clearRect(0, 0, mapa.width, mapa.height);

    if (
        mapaBackground.complete &&
        mapaBackground.naturalWidth > 0
    ) {
        lienzo.drawImage(
            mapaBackground,
            0,
            0,
            mapa.width,
            mapa.height
        );
    } else {
        // Fondo alternativo si no se encuentra la imagen
        lienzo.fillStyle = '#7c8797';
        lienzo.fillRect(0, 0, mapa.width, mapa.height);

        lienzo.fillStyle = '#64748b';
        lienzo.beginPath();
        lienzo.ellipse(
            mapa.width / 2,
            mapa.height / 2,
            230,
            170,
            0,
            0,
            Math.PI * 2
        );
        lienzo.fill();

        lienzo.strokeStyle = '#f59e0b';
        lienzo.lineWidth = 5;
        lienzo.stroke();

        lienzo.fillStyle = 'white';
        lienzo.font = 'bold 22px sans-serif';
        lienzo.textAlign = 'center';
        lienzo.fillText(
            'ARENA DEL AVATAR',
            mapa.width / 2,
            45
        );
    }
}

// ==================== ACTUALIZAR MAPA ====================
function actualizarMapa() {
    if (!jugador || !enemigo) return;

    moverJugador();
    moverEnemigo();

    dibujarArena();

    enemigo.pintarEnMapa();
    jugador.pintarEnMapa();

    // Si se tocan, comienza la pelea automáticamente
    if (
        !combateEnCurso &&
        !partidaTerminada &&
        personajesSeTocan()
    ) {
        iniciarCombateMapa();
    }
}

// ==================== CONTROLES DEL TECLADO ====================
window.addEventListener('keydown', event => {
    const permitidas = [
        'ArrowUp',
        'ArrowDown',
        'ArrowLeft',
        'ArrowRight',
        'w',
        'a',
        's',
        'd'
    ];

    if (permitidas.includes(event.key)) {
        event.preventDefault();

        if (!combateEnCurso && !partidaTerminada) {
            teclas.add(event.key);
        }
    }
});

window.addEventListener('keyup', event => {
    teclas.delete(event.key);
});

window.addEventListener('blur', () => {
    teclas.clear();
});

// ==================== BOTONES DE MOVIMIENTO ====================
function configurarBotonesMovimiento() {
    document.querySelectorAll('.boton-movimiento').forEach(boton => {
        const direccion = boton.dataset.direccion;

        const teclaPorDireccion = {
            arriba: 'ArrowUp',
            abajo: 'ArrowDown',
            izquierda: 'ArrowLeft',
            derecha: 'ArrowRight'
        };

        const presionar = event => {
            event.preventDefault();

            if (!combateEnCurso && !partidaTerminada) {
                teclas.add(teclaPorDireccion[direccion]);
            }
        };

        const soltar = event => {
            event.preventDefault();
            teclas.delete(teclaPorDireccion[direccion]);
        };

        boton.addEventListener('pointerdown', presionar);
        boton.addEventListener('pointerup', soltar);
        boton.addEventListener('pointerleave', soltar);
        boton.addEventListener('pointercancel', soltar);
    });
}

// ==================== COMIENZO DEL COMBATE ====================
function iniciarCombateMapa() {
    if (combateEnCurso || partidaTerminada) return;

    combateEnCurso = true;
    teclas.clear();

    $('estado-mapa').textContent =
        '⚔️ ¡Contacto! El combate ya comenzó.';

    seccionSeleccionarAtaque.style.display = 'block';

    $('banner-resultado').className = '';
    $('banner-resultado').textContent =
        '⚔️ ¡COMIENZA EL DUELO!';

    $('contador-ronda').textContent =
        'Cada segundo se juega una ronda automática.';

    seccionSeleccionarAtaque.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
    });

    intervaloCombate = setInterval(() => {
        if (partidaTerminada) {
            clearInterval(intervaloCombate);
            return;
        }

        ronda++;

        const ataques = Object.keys(EMOJIS_ATAQUE);

        jugador.ataque = ataques[
            numeroAleatorio(0, ataques.length - 1)
        ];

        enemigo.ataque = ataques[
            numeroAleatorio(0, ataques.length - 1)
        ];

        resolverCombate();
    }, 1200);
}

// ==================== RESOLVER ATAQUES ====================
function resolverCombate() {
    const visorJugador = $('ataque-visu-jugador');
    const visorEnemigo = $('ataque-visu-enemigo');
    const banner = $('banner-resultado');

    const tarjetaJugador = $('tarjeta-jugador');
    const tarjetaEnemigo = $('tarjeta-enemigo');

    visorJugador.textContent =
        EMOJIS_ATAQUE[jugador.ataque];

    visorEnemigo.textContent =
        EMOJIS_ATAQUE[enemigo.ataque];

    visorJugador.classList.remove('animar-choque');
    visorEnemigo.classList.remove('animar-choque');

    void visorJugador.offsetWidth;

    visorJugador.classList.add('animar-choque');
    visorEnemigo.classList.add('animar-choque');

    banner.className = '';

    // EMPATE
    if (jugador.ataque === enemigo.ataque) {
        banner.textContent =
            `Ronda ${ronda}: ¡Empate! Nadie pierde una vida.`;

        banner.classList.add('banner-empate');
    }

    // GANA EL JUGADOR
    else if (
        (jugador.ataque === 'punio' &&
            enemigo.ataque === 'barrida') ||

        (jugador.ataque === 'patada' &&
            enemigo.ataque === 'punio') ||

        (jugador.ataque === 'barrida' &&
            enemigo.ataque === 'patada')
    ) {
        enemigo.recibirDano();

        banner.textContent =
            `Ronda ${ronda}: ¡${jugador.nombre} gana y le quita una vida a ${enemigo.nombre}!`;

        banner.classList.add('banner-ganaste');

        tarjetaEnemigo.classList.remove('animar-dano');
        void tarjetaEnemigo.offsetWidth;
        tarjetaEnemigo.classList.add('animar-dano');
    }

    // GANA EL ENEMIGO
    else {
        jugador.recibirDano();

        banner.textContent =
            `Ronda ${ronda}: ¡${enemigo.nombre} gana y te quita una vida!`;

        banner.classList.add('banner-perdiste');

        tarjetaJugador.classList.remove('animar-dano');
        void tarjetaJugador.offsetWidth;
        tarjetaJugador.classList.add('animar-dano');
    }

    // Actualizar vidas
    $('vidas-jugador').textContent = jugador.corazones();
    $('vidas-enemigo').textContent = enemigo.corazones();

    $('contador-ronda').textContent =
        `Ronda ${ronda} · ${jugador.nombre}: ${jugador.vidas} vidas · ${enemigo.nombre}: ${enemigo.vidas} vidas`;

    // Comprobar si hay ganador
    if (
        jugador.estaDerrotado() ||
        enemigo.estaDerrotado()
    ) {
        finalizarCombate();
    }
}

// ==================== FINALIZAR COMBATE ====================
function finalizarCombate() {
    partidaTerminada = true;
    combateEnCurso = true;

    teclas.clear();

    clearInterval(intervaloCombate);
    clearInterval(intervaloMapa);

    const banner = $('banner-resultado');
    banner.className = '';

    if (jugador.estaDerrotado()) {
        banner.textContent =
            `💀 ¡DERROTA! ${enemigo.nombre} ganó el combate.`;

        banner.classList.add('banner-perdiste');
    } else {
        banner.textContent =
            `🏆 ¡VICTORIA! ${jugador.nombre} derrotó a ${enemigo.nombre}.`;

        banner.classList.add('banner-ganaste');
    }

    $('estado-mapa').textContent =
        'Combate finalizado.';

    $('contador-ronda').textContent =
        `Resultado final después de ${ronda} rondas.`;

    seccionReiniciar.style.display = 'block';

    seccionReiniciar.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
    });
}

// ==================== ATAQUES MANUALES ====================
function ataqueManual(tipo) {
    if (!combateEnCurso || partidaTerminada) return;

    clearInterval(intervaloCombate);

    ronda++;

    const ataques = Object.keys(EMOJIS_ATAQUE);

    jugador.ataque = tipo;

    enemigo.ataque = ataques[
        numeroAleatorio(0, ataques.length - 1)
    ];

    resolverCombate();

    // Continuar el combate automático si nadie ganó todavía
    if (!partidaTerminada) {
        intervaloCombate = setInterval(() => {
            if (partidaTerminada) {
                clearInterval(intervaloCombate);
                return;
            }

            ronda++;

            jugador.ataque = ataques[
                numeroAleatorio(0, ataques.length - 1)
            ];

            enemigo.ataque = ataques[
                numeroAleatorio(0, ataques.length - 1)
            ];

            resolverCombate();
        }, 1200);
    }
}

// ==================== INICIAR JUEGO ====================
function iniciarJuego() {
    renderizarTarjetasPersonajes();
    configurarBotonesMovimiento();

    botonPersonaje.addEventListener(
        'click',
        seleccionarPersonaje
    );

    $('boton-punio').addEventListener(
        'click',
        () => ataqueManual('punio')
    );

    $('boton-patada').addEventListener(
        'click',
        () => ataqueManual('patada')
    );

    $('boton-barrida').addEventListener(
        'click',
        () => ataqueManual('barrida')
    );

    botonReiniciar.addEventListener(
        'click',
        () => window.location.reload()
    );
}

iniciarJuego();