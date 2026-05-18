

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


const textureCache = {};

function cargarTextura(nombreArchivo) {
    // Verificamos si ya está en caché
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
