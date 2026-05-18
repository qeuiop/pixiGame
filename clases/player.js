

class Player extends GameObject {
    constructor(x, y, game) {
        super(x, y, 'player.png', game);

        this.speed    = 1;  // Velocidad de movimiento en píxeles por frame
        this.cooldown = 0;    // Contador de enfriamiento entre disparos
        this.baseCooldownMax = 55; // Valor base (se reduce con XP)
        this.cooldownMax = this.baseCooldownMax; // Frames entre cada disparo automático
        this.xp = 0;
    }

    update(keys) {
        this.mover(keys);
        this.recogerXP();
        this.disparar();
    }

    mover(keys) {

        const dx = (keys['d'] || keys['ArrowRight'] ? 1 : 0)
                 - (keys['a'] || keys['ArrowLeft']  ? 1 : 0);
        const dy = (keys['s'] || keys['ArrowDown']  ? 1 : 0)
                 - (keys['w'] || keys['ArrowUp']    ? 1 : 0);

        const dir = normalizar(dx, dy);

        this.x += dir.x * this.speed;
        this.y += dir.y * this.speed;

        // Mantenemos al jugador dentro de los límites del mapa
        this.x = Math.max(0, Math.min(this.game.anchoMundo, this.x));
        this.y = Math.max(0, Math.min(this.game.altoMundo, this.y));

        this.sincronizarGrafico();
    }

    
    recogerXP() {
        for (let i = this.game.xpItems.length - 1; i >= 0; i--) {
            const xp = this.game.xpItems[i];
            if (distancia(this.x, this.y, xp.x, xp.y) < 18) {
                this.xp += 1;
                xp.destruir();
                this.game.xpItems.splice(i, 1);
                this.ajustarCooldownPorXP();
            }
        }
    }

    ajustarCooldownPorXP() {
        // cada umbral reduce el cooldown
        const fib = [2, 3, 5, 8, 13, 21, 34];
        let niveles = 0;
        for (const t of fib) if (this.xp >= t) niveles++;

        // reducimos el cooldown por cada nivel alcanzado
        this.cooldownMax = Math.max(8, this.baseCooldownMax - niveles * 8);
    }

    disparar() {
        // Reducimos el cooldown cada frame
        if (this.cooldown > 0) {
            this.cooldown--;
            return;
        }

        // Buscamos el enemigo más cercano
        const objetivo = this.buscarObjetivoCercano();
        if (!objetivo) return;

        // Calculamos el ángulo objetivo
        const angulo = Math.atan2(
            objetivo.y - this.y,
            objetivo.x - this.x
        );

        // Pedimos al juego que cree una bala con esa dirección
        this.game.agregarBala(
            this.x, this.y,
            Math.cos(angulo) * 6,
            Math.sin(angulo) * 6
        );

        // Reiniciamos el cooldown
        this.cooldown = this.cooldownMax;
    }

    buscarObjetivoCercano() {
        let objetivo  = null;
        let minDist   = Infinity;

        for (const enemigo of this.game.enemies) {
            const d = distancia(this.x, this.y, enemigo.x, enemigo.y);
            if (d < minDist) {
                minDist  = d;
                objetivo = enemigo;
            }
        }

        return objetivo;
    }
}
