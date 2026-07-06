

class GameObject {
    constructor(x, y, spriteFile, game) {
        this.x = x;
        this.y = y;
        this.game = game;

        // Velocidad 
        this.vx = 0;
        this.vy = 0;

        const textura = PIXI.Assets.get(`sprites/${spriteFile}`) || cargarTextura(spriteFile);

        // Sprite real: vive en el mundo a color, la lógica del juego lo manipula directamente
        this.gfx = new PIXI.Sprite(textura);
        this.gfx.anchor.set(0.5);
        this.gfx.x = this.x;
        this.gfx.y = this.y;
        this.game.mundoColor.addChild(this.gfx);

        // Espejo en el mundo blanco y negro: sincronizarGrafico() lo copia del real cada frame
        this.gfxGris = new PIXI.Sprite(textura);
        this.gfxGris.anchor.set(0.5);
        this.gfxGris.x = this.x;
        this.gfxGris.y = this.y;
        this.game.mundoGris.addChild(this.gfxGris);
    }

    sincronizarGrafico() {
        this.gfx.x = this.x;
        this.gfx.y = this.y;

        this.gfxGris.x        = this.x;
        this.gfxGris.y        = this.y;
        this.gfxGris.texture  = this.gfx.texture;
        this.gfxGris.rotation = this.gfx.rotation;
        this.gfxGris.tint     = this.gfx.tint;
        this.gfxGris.alpha    = this.gfx.alpha;
        this.gfxGris.scale.copyFrom(this.gfx.scale);
    }

    destruir() {
        for (const sprite of [this.gfx, this.gfxGris]) {
            if (sprite.parent) sprite.parent.removeChild(sprite);
            sprite.destroy();
        }
    }

    update() {
    }
}
