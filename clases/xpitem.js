

class XPItem extends GameObject {
    constructor(x, y, game, value = 1, esGrande = false) {
        super(x, y, 'xp.png', game);

        this.value    = value;
        this.esGrande = esGrande; // Soltado por un enemigo grande: además de XP, puede otorgar una mejora
        this.radius   = esGrande ? 16 : 10;
        this.floatTimer = 0;

        const baseScale  = 0.4;
        const escalaValor = Math.min(3, this.value);
        // Items de mayor valor son más grandes y con tint dorado; los de enemigos grandes, aún más grandes y con otro tint
        this.gfx.scale.set(baseScale * escalaValor * (esGrande ? 1.5 : 1));
        if (esGrande) this.gfx.tint = 0x66FFCC;
        else if (this.value > 1) this.gfx.tint = 0xFFDD66;
    }

    update() {
        this.floatTimer += 0.08;
        this.y += Math.sin(this.floatTimer) * 0.2;
        this.sincronizarGrafico();
    }
}
