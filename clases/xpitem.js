

class XPItem extends GameObject {
    constructor(x, y, game, value = 1, esGrande = false, esEspecial = false) {
        super(x, y, 'xp.png', game);

        this.value      = value;
        this.esGrande   = esGrande;   // Soltado por un enemigo élite
        this.esEspecial = esEspecial; // No otorga XP: da directamente una mejora especial al recolectarla
        this.radius     = esEspecial ? 14 : (esGrande ? 16 : 10);
        this.floatTimer = 0;

        const baseScale  = 0.4;
        const escalaValor = Math.min(3, this.value);
        // Items de mayor valor son más grandes y con distinto tint
        this.gfx.scale.set(esEspecial ? baseScale * 1.8 : baseScale * escalaValor * (esGrande ? 1.5 : 1));
        if (esEspecial) this.gfx.tint = 0xCC66FF;
        else if (esGrande) this.gfx.tint = 0x66FFCC;
        else if (this.value > 1) this.gfx.tint = 0xFFDD66;

        this.sincronizarGrafico(); // evita que el espejo gris arranque con la escala/tint por defecto
    }

    update() {
        this.floatTimer += 0.08;
        this.y += Math.sin(this.floatTimer) * 0.2;
        this.sincronizarGrafico();
    }
}
