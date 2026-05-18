

class Bullet extends GameObject {
    constructor(x, y, vx, vy, game) {
        super(x, y, 'bullet.png', game);

        this.vx   = vx;
        this.vy   = vy;
        this.life = 100; // Frames de vida antes de auto-destruirse

        this.gfx.scale.set(0.3);
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;

        this.sincronizarGrafico();
    }
}
