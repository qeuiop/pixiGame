

// Jefe. Mismo comportamiento que Slime pero 2.5 veces más grande, con vida acorde al daño
// del jugador, y solo aparece desde nivel 10. Al morir deja 2 slimes simples y recompensa
// al jugador subiéndole todos los stats.
class BossSlime extends Slime {
    constructor(x, y, game) {
        super(x, y, game, false);

        this.escalaBoss = 2.5;
        this.gfx.scale.set(this.escalaBoss);
        this.radius *= this.escalaBoss;

        // Vida acorde al daño actual del jugador, para que nunca muera de un solo disparo
        this.hp = 5 + this.game.player.dano;

        this.sincronizarGrafico();
    }

    recibirDano(cantidad = 1) {
        const murioAhora = super.recibirDano(cantidad);

        if (murioAhora) {
            this.game.agregarSlime(this.x - 15, this.y);
            this.game.agregarSlime(this.x + 15, this.y);

            this.game.player.recibirRecompensaBoss();
            this.game.mostrarToast('¡Boss slime derrotado! Todos tus stats subieron x1.5');
        }

        return murioAhora;
    }
}
