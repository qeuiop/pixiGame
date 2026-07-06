
// Menú de pausa: se abre/cierra con ESC (ver Game), vive en app.stage para no verse afectado por la cámara
class Menu {
    constructor(game) {
        this.game = game;

        this.overlay = new PIXI.Container();
        this.overlay.visible = false;
        this.game.app.stage.addChild(this.overlay);

        const fondo = new PIXI.Graphics();
        fondo.rect(0, 0, this.game.W, this.game.H).fill({ color: 0x000000, alpha: 0.75 });
        this.overlay.addChild(fondo);

        const titulo = new PIXI.Text('PAUSA', {
            fill: 0xffffff, fontFamily: 'Arial', fontSize: 32, fontWeight: 'bold',
        });
        titulo.anchor.set(0.5, 0);
        titulo.x = this.game.W / 2;
        titulo.y = 70;
        this.overlay.addChild(titulo);

        const botones = [
            { texto: 'REANUDAR', accion: () => this.game.cerrarMenuPausa() },
            { texto: 'REINICIAR', accion: () => window.location.reload() },
            { texto: 'SALIR', accion: () => window.close() },
        ];

        const anchoBoton = 220;
        const altoBoton  = 56;
        const espacio    = 22;
        const totalAlto  = botones.length * altoBoton + (botones.length - 1) * espacio;
        let y = this.game.H / 2 - totalAlto / 2;

        for (const { texto, accion } of botones) {
            const boton = this.crearBoton(texto, accion, anchoBoton, altoBoton);
            boton.x = this.game.W / 2 - anchoBoton / 2;
            boton.y = y;
            this.overlay.addChild(boton);
            y += altoBoton + espacio;
        }
    }

    crearBoton(texto, accion, ancho, alto) {
        const boton = new PIXI.Container();

        const fondo = new PIXI.Graphics()
            .roundRect(0, 0, ancho, alto, 10)
            .fill({ color: 0x222244 })
            .stroke({ width: 2, color: 0xffffff });
        boton.addChild(fondo);

        const label = new PIXI.Text(texto, {
            fill: 0xffffff, fontFamily: 'Arial', fontSize: 18, fontWeight: 'bold',
        });
        label.anchor.set(0.5);
        label.x = ancho / 2;
        label.y = alto / 2;
        boton.addChild(label);

        boton.eventMode = 'static';
        boton.cursor    = 'pointer';
        boton.on('pointerdown', accion);
        boton.on('pointerover', () => { boton.alpha = 0.8; });
        boton.on('pointerout',  () => { boton.alpha = 1;   });

        return boton;
    }

    abrir()  { this.overlay.visible = true;  }
    cerrar() { this.overlay.visible = false; }
}

// Barra de XP: franja arriba de la pantalla que se llena de rojo hacia el próximo nivel
class BarraXP {
    constructor(game) {
        this.game  = game;
        this.ancho = this.game.W;
        this.alto  = 10;

        this.fondo = new PIXI.Graphics();
        this.fondo.rect(0, 0, this.ancho, this.alto).fill({ color: 0x555555 });
        this.game.app.stage.addChild(this.fondo);

        // Se redibuja cada frame en actualizar(), solo hace falta crearlo vacío acá
        this.relleno = new PIXI.Graphics();
        this.game.app.stage.addChild(this.relleno);
    }

    actualizar() {
        const jugador = this.game.player;
        if (!jugador) return;

        const costo    = jugador.costoNivel(jugador.nivel);
        const progreso = Math.max(0, Math.min(1, jugador.xpDesdeUltimoNivel / costo));

        this.relleno.clear();
        if (progreso > 0) {
            this.relleno.rect(0, 0, this.ancho * progreso, this.alto).fill({ color: 0xdd2222 });
        }
    }
}
