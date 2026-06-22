//  Clase para todos los enemigos


class Enemy extends GameObject {
    constructor(x, y, spriteFile, speed, game) {
        super(x, y, spriteFile, game);

        this.speed  = speed;
        this.radius = 8; // Radio de colisión en píxeles (usado por Game)
        this.hp     = 1; // Vida en cantidad de disparos para morir

        // 1 de cada 10 enemigos es "grande": el triple de vida, la mitad de velocidad y el doble de tamaño
        this.esGrande = Math.random() < 0.1;
        if (this.esGrande) {
            this.hp    = 3;
            this.speed = this.speed / 2;
            this.radius *= 2;
            this.gfx.scale.set(2);
        }
    }

    // Aplica daño de un disparo. Devuelve true si el enemigo murió.
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
}
