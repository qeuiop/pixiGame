

// Enemigo cazador. Persigue rápido cuando está lejos del jugador y se frena mucho al
// entrar en su rango, para que sea fácil escapar de cerca.
class Slime extends Enemy {
    constructor(x, y, game, esElite = false) {
        super(x, y, 'slime_move.png', 1, game, esElite);

        // Reemplaza el sprite estático por la animación de movimiento (6 frames de 38x20)
        this.game.mundoColor.removeChild(this.gfx);
        this.gfx.destroy();
        this.game.mundoGris.removeChild(this.gfxGris);
        this.gfxGris.destroy();

        const FRAME           = 38;
        const ALTO            = 20;
        const CANTIDAD_FRAMES = 6;

        const moveSrc = PIXI.Assets.get('sprites/slime_move.png');
        this._framesMove = Array.from({ length: CANTIDAD_FRAMES }, (_, i) =>
            new PIXI.Texture({ source: moveSrc.source, frame: new PIXI.Rectangle(i * FRAME, 0, FRAME, ALTO) })
        );

        this.gfx = new PIXI.AnimatedSprite(this._framesMove);
        this.gfx.anchor.set(0.5);
        this.gfx.animationSpeed = 0.15;
        this.gfx.loop = true;
        // Arranca en un frame al azar para que varios slimes no animen sincronizados
        this.gfx.gotoAndPlay(Math.min(CANTIDAD_FRAMES - 1, Math.floor(Math.random() * CANTIDAD_FRAMES)));
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

        // Fuera del rango del jugador persigue a 1.5x su velocidad, dentro se frena a la mitad
        const dist = distancia(this.x, this.y, jugador.x, jugador.y);
        this.speed = dist <= jugador.rangoDisparo ? jugador.speed * 0.5 : jugador.speed * 1.5;

        const dir = normalizar(jugador.x - this.x, jugador.y - this.y);
        this.aplicarFuerza(dir.x, dir.y);

        this.x += this.vx;
        this.y += this.vy;

        this.orientarSprite();
        this.sincronizarGrafico();
        this.actualizarFlash();
    }
}
