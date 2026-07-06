

class Wraith extends Enemy {
    constructor(x, y, game, esElite = false) {
        // Wraith: rápido, fuerza al jugador a reaccionar
        super(x, y, 'wraith.png', 1, game, esElite);

        this.radioBoids = 50; // Radio de interacción para el comportamiento de enjambre

        // Reemplaza el sprite estático por la animación de movimiento (8 frames de 70x70)
        this.game.mundoColor.removeChild(this.gfx);
        this.gfx.destroy();
        this.game.mundoGris.removeChild(this.gfxGris);
        this.gfxGris.destroy();

        const FRAME           = 70;
        const CANTIDAD_FRAMES = 8;

        const moveSrc = PIXI.Assets.get('sprites/wraith_move.png');
        this._framesMove = Array.from({ length: CANTIDAD_FRAMES }, (_, i) =>
            new PIXI.Texture({ source: moveSrc.source, frame: new PIXI.Rectangle(i * FRAME, 0, FRAME, FRAME) })
        );

        this.gfx = new PIXI.AnimatedSprite(this._framesMove);
        this.gfx.anchor.set(0.5);
        this.gfx.animationSpeed = 0.15;
        this.gfx.loop = true;
        this.gfx.play();
        if (this.esGrande) this.gfx.scale.set(this.escala);

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
        const jugador = this.game.player;
        if (!jugador) return;

        // Dirección hacia el jugador
        const dirJugador = normalizar(
            jugador.x - this.x,
            jugador.y - this.y
        );

        // Fuerzas del comportamiento Boids con los Wraiths cercanos
        const boids = this.calcularBoids();

        const fx = dirJugador.x * 0.8 + boids.fx * 0.2;
        const fy = dirJugador.y * 0.8 + boids.fy * 0.2;

        this.aplicarFuerza(fx, fy);

        this.x += this.vx;
        this.y += this.vy;

        this.orientarSprite();
        this.sincronizarGrafico();
    }

    calcularBoids() {
        let ax = 0, ay = 0; // Suma de velocidades (alineación)
        let sx = 0, sy = 0; // Fuerza de separación
        let count = 0;

        for (const otro of this.game.enemies) {
            if (otro === this || !(otro instanceof Wraith)) continue;

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

