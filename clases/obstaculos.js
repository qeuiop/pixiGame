
// Base de los obstáculos fijos con colisión sólida. No se mueven ni tienen lógica propia,
// es Game.resolverColisionesObstaculos() quien frena a jugador y enemigos al chocarlos.
class Obstaculo extends GameObject {
    constructor(x, y, spriteFile, game, radius) {
        super(x, y, spriteFile, game);
        this.radius = radius;
    }
}

const ROCK_SPRITES = ['rock (1).png', 'rock (2).png', 'rock (3).png'];

// Roca. Variante de Obstaculo con sprite al azar y tamaño variable.
class Rock extends Obstaculo {
    constructor(x, y, game) {
        const sprite = ROCK_SPRITES[Math.floor(Math.random() * ROCK_SPRITES.length)];
        const escala = 1 + Math.random() * 0.6; // variedad visual entre rocas
        // La colisión es un poco más chica que el tamaño visual del sprite
        super(x, y, sprite, game, 16 * escala * 0.85);

        this.gfx.scale.set(escala);

        this.sincronizarGrafico();
    }
}
