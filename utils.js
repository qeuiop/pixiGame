

function distancia(x1, y1, x2, y2) {
    return Math.hypot(x2 - x1, y2 - y1);
}

function normalizar(dx, dy) {
    const mag = Math.hypot(dx, dy);
    if (mag === 0) return { x: 0, y: 0 };
    return { x: dx / mag, y: dy / mag };
}

function aleatorioInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}


// Filtro de flash blanco para el golpe de jugador y enemigos. Cada sprite necesita su propia instancia, compartir una sola entre
// varios sprites de un contenedor filtrado rompía el render cuando había muchos flasheando a la vez.
function crearFiltroFlashBlanco() {
    const filtro = new PIXI.ColorMatrixFilter();
    filtro.matrix = [
        0, 0, 0, 0, 1,
        0, 0, 0, 0, 1,
        0, 0, 0, 0, 1,
        0, 0, 0, 1, 0,
    ];
    return filtro;
}

const textureCache = {};

function cargarTextura(nombreArchivo) {
    if (textureCache[nombreArchivo]) {
        return textureCache[nombreArchivo];
    }

    const rutaSprite = `sprites/${nombreArchivo}`;
    let textura;

    try {
        textura = PIXI.Texture.from(rutaSprite);
    } catch (e) {
        console.warn(`⚠️ No se pudo cargar: ${rutaSprite}. Usando fallback blanco.`);
        textura = PIXI.Texture.WHITE;
    }

    textureCache[nombreArchivo] = textura;
    return textura;
}
