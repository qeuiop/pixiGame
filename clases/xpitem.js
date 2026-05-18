

class XPItem extends GameObject {
    constructor(x, y, game) {
        super(x, y, 'xp.png', game);

        this.radius = 10;
        this.gfx.scale.set(0.4);
        this.floatTimer = 0;
    }

    update() {
        this.floatTimer += 0.08;
        this.y += Math.sin(this.floatTimer) * 0.2;
        this.sincronizarGrafico();
    }
}
