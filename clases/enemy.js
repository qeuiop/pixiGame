// Clase base para todos los enemigos

class Enemy extends GameObject {
    constructor(x, y, spriteFile, speed, game, esElite = false) {
        super(x, y, spriteFile, game);

        this.speed  = speed;
        this.radius = 8; // Radio de colisión usado para separar enemigos entre sí
        this.hp     = 1; // Cantidad de disparos que resiste antes de morir

        // Variante élite: más vida, más grande y un poco más lenta
        this.esGrande = esElite;
        if (this.esGrande) {
            this.hp     = 3;
            this.speed  = this.speed * 0.9;
            this.escala = 1.4 + Math.random() * 0.2;
            this.radius *= this.escala;
            this.gfx.scale.set(this.escala);
        }

        this.sincronizarGrafico(); // evita que el espejo gris arranque con la escala por defecto
    }

    // Aplica daño y devuelve true si el enemigo murió
    recibirDano(cantidad = 1) {
        this.hp -= cantidad;
        return this.hp <= 0;
    }

    update() {
        const jugador = this.game.player;
        if (!jugador) return;

        // dirección hacia el jugador
        const dir = normalizar(
            jugador.x - this.x,
            jugador.y - this.y
        );

        // Aplicamos la fuerza
        this.aplicarFuerza(dir.x, dir.y);

        // Movemos la entidad
        this.x += this.vx;
        this.y += this.vy;

        this.sincronizarGrafico();
    }

    aplicarFuerza(fx, fy, lerp = 0.1) {
        this.vx += (fx * this.speed - this.vx) * lerp;
        this.vy += (fy * this.speed - this.vy) * lerp;
    }

    // Las animaciones de movimiento van de izquierda a derecha: se espejea al ir hacia la izquierda
    orientarSprite() {
        if (this.vx !== 0) this.gfx.scale.x = Math.abs(this.gfx.scale.x) * Math.sign(this.vx);
    }
}
