

class Specter extends Enemy {
    constructor(x, y, game, destinoVector = null, esElite = false) {
        // Specter: lento, presión constante pero evadible
        super(x, y, 'specter.png', 2, game, esElite);

        this.radioBoids = 60;

        // Si se define, el specter ignora al jugador y viaja en línea recta hacia este punto
        this.destinoVector = destinoVector;
        this.eliminado = false;

        // Reemplaza el sprite estático por el spritesheet de movimiento, escalado a 64x64
        this.game.mundoColor.removeChild(this.gfx);
        this.gfx.destroy();
        this.game.mundoGris.removeChild(this.gfxGris);
        this.gfxGris.destroy();

        const FRAME            = 87;
        const CANTIDAD_FRAMES  = 11;
        const TAMANO_EN_JUEGO  = 64;

        const moveSrc = PIXI.Assets.get('sprites/specter_move.png');
        this._framesMove = Array.from({ length: CANTIDAD_FRAMES }, (_, i) =>
            new PIXI.Texture({ source: moveSrc.source, frame: new PIXI.Rectangle(i * FRAME, 0, FRAME, FRAME) })
        );

        this.gfx = new PIXI.AnimatedSprite(this._framesMove);
        this.gfx.anchor.set(0.5);
        this.gfx.animationSpeed = 0.15;
        this.gfx.loop = true;
        this.gfx.play();

        // this.escala solo existe si es élite: se combina con la base para que se vea más grande
        const escalaBase = TAMANO_EN_JUEGO / FRAME;
        this.gfx.scale.set(escalaBase * (this.esGrande ? this.escala : 1));

        this.gfx.x = this.x;
        this.gfx.y = this.y;
        this.game.mundoColor.addChild(this.gfx);

        this.gfxGris = new PIXI.Sprite(this.gfx.texture);
        this.gfxGris.anchor.set(0.5);
        this.gfxGris.x = this.x;
        this.gfxGris.y = this.y;
        this.game.mundoGris.addChild(this.gfxGris);

        this.sincronizarGrafico();
    }

    update() {
        if (this.destinoVector) {
            this.moverHaciaVector();
            return;
        }

        const jugador = this.game.player;
        if (!jugador) return;

        // Dirección hacia el jugador
        const dirJugador = normalizar(
            jugador.x - this.x,
            jugador.y - this.y
        );

        // Fuerzas del comportamiento Boids con los Specters cercanos
        const boids = this.calcularBoids();

        const fx = dirJugador.x * 0.4 + boids.fx * 0.6;
        const fy = dirJugador.y * 0.4 + boids.fy * 0.6;

        this.aplicarFuerza(fx, fy);

        this.x += this.vx;
        this.y += this.vy;

        this.orientarSprite();
        this.sincronizarGrafico();
    }

    moverHaciaVector() {
        const dir = normalizar(
            this.destinoVector.x - this.x,
            this.destinoVector.y - this.y
        );

        this.aplicarFuerza(dir.x, dir.y);

        this.x += this.vx;
        this.y += this.vy;

        this.orientarSprite();
        this.sincronizarGrafico();

        // Llegó al punto opuesto del vector: se elimina
        if (distancia(this.x, this.y, this.destinoVector.x, this.destinoVector.y) < 20) {
            this.eliminado = true;
        }
    }

    calcularBoids() {
        let ax = 0, ay = 0; // Suma de velocidades (alineación)
        let sx = 0, sy = 0; // Fuerza de separación
        let count = 0;

        for (const otro of this.game.enemies) {
            // Solo interactuamos con otros Specters (no con Wraiths)
            if (otro === this || !(otro instanceof Specter)) continue;

            const d = distancia(this.x, this.y, otro.x, otro.y);
            if (d < this.radioBoids && d > 0) {
                // Alineación: acumulamos velocidades de los vecinos
                ax += otro.vx;
                ay += otro.vy;

                // Separación
                sx -= (otro.x - this.x) / d;
                sy -= (otro.y - this.y) / d;

                count++;
            }
        }

        // Si no hay vecinos, no aplicamos fuerzas de boids
        if (count === 0) return { fx: 0, fy: 0 };

        return {
            fx: (ax / count) * 0.3 + sx * 1.2, // Alineación débil + Separación fuerte
            fy: (ay / count) * 0.3 + sy * 1.2
        };
    }
}
