// Base de todos los enemigos. Persigue al jugador, recibe daño y flashea blanco al ser
// golpeado, y maneja el tiempo de muerte antes de destruirse.

class Enemy extends GameObject {
    constructor(x, y, spriteFile, speed, game, esElite = false) {
        super(x, y, spriteFile, game);

        this.speed  = speed;
        this.radius = 8; // radio de colisión con otros enemigos
        this.hp     = 1; // disparos que resiste antes de morir

        this.muriendo     = false; // true tras el golpe letal, mientras dura el flash antes de destruirse
        this.flashTimer   = 0;
        this.duracionFlash = 30;   // 0.5s a 60fps, para golpes que sobrevive

        // Instancia propia del filtro de flash, ver comentario en utils.js
        this.filtroFlashColor = crearFiltroFlashBlanco();
        this.filtroFlashGris  = crearFiltroFlashBlanco();

        // Golpe letal, solo 1 frame de blanco antes de desaparecer. Vale 2 y no 1 porque
        // actualizarCadaveres() ya hace el primer tick en el mismo frame en que muere
        this.duracionMuerte = 2;

        // Variante élite, más vida, más grande y un poco más lenta
        this.esGrande = esElite;
        if (this.esGrande) {
            this.hp     = 3;
            this.speed  = this.speed * 0.9;
            this.escala = 1.4 + Math.random() * 0.2;
            this.radius *= this.escala;
            this.gfx.scale.set(this.escala);
        }

        this.sincronizarGrafico(); // evita que el espejo gris arranque con otra escala
    }

    // Aplica daño y dispara el flash blanco. Devuelve true si este golpe lo mató
    recibirDano(cantidad = 1) {
        this.hp -= cantidad;

        if (this.hp <= 0 && !this.muriendo) {
            this.muriendo   = true;
            this.flashTimer = this.duracionMuerte; // golpe letal, flash corto
            return true;
        }

        this.activarFlash(); // golpe no letal, flash largo normal
        return false;
    }

    activarFlash() {
        this.flashTimer = this.duracionFlash;
    }

    // Aplica o retira el filtro de flash blanco según flashTimer, se llama todos los frames
    actualizarFlash() {
        if (this.flashTimer > 0) {
            this.flashTimer--;
            this.gfx.filters     = [this.filtroFlashColor];
            this.gfxGris.filters = [this.filtroFlashGris];
        } else {
            this.gfx.filters     = null;
            this.gfxGris.filters = null;
        }
    }

    // Cuenta atrás del cadáver mientras muestra el flash. True cuando ya se puede destruir
    actualizarMuerte() {
        this.actualizarFlash();
        return this.flashTimer <= 0;
    }

    update() {
        const jugador = this.game.player;
        if (!jugador) return;

        const dir = normalizar(
            jugador.x - this.x,
            jugador.y - this.y
        );

        this.aplicarFuerza(dir.x, dir.y);

        this.x += this.vx;
        this.y += this.vy;

        this.sincronizarGrafico();
        this.actualizarFlash();
    }

    aplicarFuerza(fx, fy, lerp = 0.1) {
        this.vx += (fx * this.speed - this.vx) * lerp;
        this.vy += (fy * this.speed - this.vy) * lerp;
    }

    // Espejea el sprite según la dirección horizontal de movimiento
    orientarSprite() {
        if (this.vx !== 0) this.gfx.scale.x = Math.abs(this.gfx.scale.x) * Math.sign(this.vx);
    }
}
