//  Clase para todos los enemigos


class Enemy extends GameObject {
    constructor(x, y, spriteFile, speed, game) {
        super(x, y, spriteFile, game);

        this.speed  = speed;
        this.radius = 8; // Radio de colisión en píxeles (usado por Game)
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
}
