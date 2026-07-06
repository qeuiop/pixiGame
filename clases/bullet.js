

class Bullet extends GameObject {
    constructor(x, y, vx, vy, game, dano = 1, perforaciones = 0) {
        super(x, y, 'bullet.png', game);

        this.vx   = vx;
        this.vy   = vy;
        this.life = 100; // Frames de vida antes de auto-destruirse

        this.dano = dano; // Daño por disparo, mejorable
        this.perforacionesRestantes = perforaciones; // Cantidad de enemigos que la bala puede atravesar
        this.golpeados = new Set();

        this.gfx.scale.set(0.3);
        this.sincronizarGrafico(); // evita que el espejo gris arranque con la escala por defecto
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;

        this.sincronizarGrafico();
    }
}
