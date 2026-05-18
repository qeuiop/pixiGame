

class GameObject {
    constructor(x, y, spriteFile, game) {
        this.x = x;
        this.y = y;
        this.game = game;

        // Velocidad 
        this.vx = 0;
        this.vy = 0;

        const textura = PIXI.Assets.get(`sprites/${spriteFile}`) || cargarTextura(spriteFile);
        this.gfx = new PIXI.Sprite(textura);

        
        this.gfx.anchor.set(0.5);

        this.gfx.x = this.x;
        this.gfx.y = this.y;

        // Agregamos el sprite al escenario de PixiJS
        this.game.containerPrincipal.addChild(this.gfx);    
    }

    sincronizarGrafico() {
        this.gfx.x = this.x;
        this.gfx.y = this.y;
    }

    destruir() {
        if (this.game.containerPrincipal && this.game.containerPrincipal.children.includes(this.gfx)) {
            this.game.containerPrincipal.removeChild(this.gfx);
        } else if (this.game.app?.stage?.children.includes(this.gfx)) {
            this.game.app.stage.removeChild(this.gfx);
        }
        this.gfx.destroy();
    }

    update() {
    }
}
