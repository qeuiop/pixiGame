

class Specter extends Enemy {
    constructor(x, y, game) {
        super(x, y, 'specter.png', 1.0, game);

        this.radioBoids = 60; 
    }

    update() {
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

        this.sincronizarGrafico();
    }

    calcularBoids() {
        let ax = 0, ay = 0; // Suma de velocidades (alineación)
        let sx = 0, sy = 0; // Fuerza de separación
        let count = 0;

        for (const otro of this.game.enemies) {
            // Solo interactuamos con otros Specters (no con Wraits ni con nosotros mismos)
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
