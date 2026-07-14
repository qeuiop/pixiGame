
// XP ecolectable que suelta un enemigo al morir. Puede dar xp normal, ser una fruta
// de valor grande, o ser una  especial que otorga directamente una mejora.
const XP_GRANDE_SPRITES = ['fruit (1).png', 'fruit (2).png', 'fruit (3).png', 'fruit (4).png', 'fruit (5).png'];

class XPItem extends GameObject {
    constructor(x, y, game, value = 1, esGrande = false, esEspecial = false) {
        // Sprite según el tipo de item, xp normal, fruta de élite, o hueso de mejora especial
        let sprite = 'xp.png';
        if (esEspecial) sprite = 'Bone.png';
        else if (esGrande) sprite = XP_GRANDE_SPRITES[Math.floor(Math.random() * XP_GRANDE_SPRITES.length)];

        super(x, y, sprite, game);

        this.value      = value;
        this.esGrande   = esGrande;   // soltado por un enemigo élite
        this.esEspecial = esEspecial; // no otorga xp, da directamente una mejora especial
        this.radius     = esEspecial ? 14 : (esGrande ? 16 : 10);

        const baseScale   = 0.4;
        const escalaValor = Math.min(3, this.value);
        // La fruta y el hueso ya se distinguen por su dibujo, van al tamaño normal del pickup.
        // Solo la xp común escala con su valor
        this.gfx.scale.set((esEspecial || esGrande) ? baseScale : baseScale * escalaValor);

        this.sincronizarGrafico(); // evita que el espejo gris arranque con otra escala
    }
}
