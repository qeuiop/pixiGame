
// Atajos de teclado para debug y testing. Requieren una partida en curso.
class Cheats {
    constructor(game) {
        this.game = game;

        window.addEventListener('keydown', e => {
            if (!e.ctrlKey) return;

            if (e.key === '1')      { e.preventDefault(); this.toggleInmortal(); }
            else if (e.key === '2') { e.preventDefault(); this.subirNivel();     }
            else if (e.key === '3') { e.preventDefault(); this.invocarBossSlime(); }
        });
    }

    // CTRL+1, vuelve al jugador inmortal (y de nuevo mortal si se presiona otra vez)
    toggleInmortal() {
        const jugador = this.game.player;
        if (!jugador) return;

        jugador.inmortal = !jugador.inmortal;
        this.game.mostrarToast(`Cheat: invencibilidad ${jugador.inmortal ? 'ACTIVADA' : 'desactivada'}`);
    }

    // CTRL+2, da la xp que le falte al jugador para subir de nivel
    subirNivel() {
        const jugador = this.game.player;
        if (!jugador) return;

        // Si ya hay una carta de mejora en pantalla no sigue apilando niveles, porque
        // revisarMejoraPorXP() sube el nivel igual aunque la carta esté bloqueada
        if (this.game.pausado) {
            this.game.mostrarToast('Cheat: elegí la mejora en pantalla antes de subir otro nivel');
            return;
        }

        const costo    = jugador.costoNivel(jugador.nivel);
        const faltante = Math.max(0, costo - jugador.xpDesdeUltimoNivel);

        jugador.xp                 += faltante;
        jugador.xpDesdeUltimoNivel += faltante;
        jugador.revisarMejoraPorXP();

        this.game.mostrarToast('Cheat: subiste de nivel');
    }

    // CTRL+3, invoca un boss slime cerca del jugador
    invocarBossSlime() {
        const jugador = this.game.player;
        if (!jugador) return;

        if (this.game.enemies.some(e => e instanceof BossSlime)) {
            this.game.mostrarToast('Cheat: ya hay un boss slime vivo');
            return;
        }

        this.game.agregarBossSlime(jugador.x + 150, jugador.y);
        this.game.mostrarToast('Cheat: boss slime invocado');
    }
}
