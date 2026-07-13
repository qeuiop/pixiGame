

// Proyectil del jugador. Viaja en línea recta, hace daño al primer enemigo que toca y se
// destruye sola al expirar, al pegarle a alguien o al perforar el máximo de enemigos.
class Bullet extends GameObject {
    constructor(x, y, vx, vy, game, dano = 1, perforaciones = 0) {
        super(x, y, 'bullet.png', game);

        this.vx   = vx;
        this.vy   = vy;
        this.life = 100; // frames de vida

        this.dano = dano;
        this.perforacionesRestantes = perforaciones; // enemigos que puede atravesar
        this.golpeados = new Set();

        this.gfx.scale.set(0.3);
        this.sincronizarGrafico(); // evita que el espejo gris arranque con otra escala
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;

        this.sincronizarGrafico();
    }
}
