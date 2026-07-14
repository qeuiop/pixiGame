
// Menú principal. Se muestra al abrir el juego y arranca la partida al tocar JUGAR.
class MenuPrincipal {
    constructor(game) {
        this.game = game;

        this.overlay = new PIXI.Container();
        this.overlay.visible = false;
        this.game.app.stage.addChild(this.overlay);

        const texturaFondo = PIXI.Assets.get('sprites/fondo.png');
        const fondo = new PIXI.TilingSprite({ texture: texturaFondo, width: this.game.W, height: this.game.H });
        this.overlay.addChild(fondo);

        this.crearGallinas(20);

        const anchoBoton = 220;
        const altoBoton  = 56;
        const boton = this.crearBoton('JUGAR', () => this.jugar(), anchoBoton, altoBoton);
        boton.x = this.game.W / 2 - anchoBoton / 2;
        boton.y = this.game.H / 2 - altoBoton / 2;
        this.overlay.addChild(boton);
    }

    // Gallinas comiendo desparramadas por la pantalla, mirando para cualquier lado al azar.
    // Cada una, en un ciclo propio de unos 5 segundos, corre y se da vuelta hacia el otro lado
    crearGallinas(cantidad) {
        const eatSrc = PIXI.Assets.get('sprites/chicken_eating_left-Sheet.png');
        const runSrc = PIXI.Assets.get('sprites/chicken_run_left-Sheet.png');
        const FRAMES_EAT = 8;
        const FRAMES_RUN = 4;

        this.framesEatGallina = Array.from({ length: FRAMES_EAT }, (_, i) =>
            new PIXI.Texture({ source: eatSrc.source, frame: new PIXI.Rectangle(i * 16, 0, 16, 16) })
        );
        this.framesRunGallina = Array.from({ length: FRAMES_RUN }, (_, i) =>
            new PIXI.Texture({ source: runSrc.source, frame: new PIXI.Rectangle(i * 16, 0, 16, 16) })
        );

        const DURACION_CICLO = 5 * 60; // 5s a 60fps entre corridas

        this.gallinas = [];

        for (let i = 0; i < cantidad; i++) {
            const gallina = new PIXI.AnimatedSprite(this.framesEatGallina);
            gallina.anchor.set(0.5);
            gallina.animationSpeed = 0.12;
            gallina.loop = true;
            gallina.x = Math.random() * this.game.W;
            gallina.y = Math.random() * this.game.H;
            gallina.gotoAndPlay(Math.min(FRAMES_EAT - 1, Math.floor(Math.random() * FRAMES_EAT)));

            const estado = { gfx: gallina, mirandoIzquierda: Math.random() < 0.5, corriendo: false };
            gallina.scale.x = estado.mirandoIzquierda ? 2 : -2;
            gallina.scale.y = 2;

            // Arranque desincronizado: la primera corrida cae en algún punto dentro de los primeros 5s
            estado.timer = Math.floor(Math.random() * DURACION_CICLO);

            this.overlay.addChild(gallina);
            this.gallinas.push(estado);
        }

        this._duracionCicloGallinas = DURACION_CICLO;
        this._tickerGallinas = () => this.actualizarGallinas();
        this.game.app.ticker.add(this._tickerGallinas);
    }

    actualizarGallinas() {
        for (const g of this.gallinas) {
            if (g.corriendo) continue;

            if (--g.timer <= 0) {
                g.corriendo = true;
                g.mirandoIzquierda = !g.mirandoIzquierda;
                g.gfx.scale.x = g.mirandoIzquierda ? 2 : -2;

                g.gfx.textures = this.framesRunGallina;
                g.gfx.loop = false;
                g.gfx.onComplete = () => {
                    g.corriendo = false;
                    g.gfx.textures = this.framesEatGallina;
                    g.gfx.loop = true;
                    g.gfx.onComplete = null;
                    g.gfx.gotoAndPlay(0);
                    g.timer = this._duracionCicloGallinas;
                };
                g.gfx.gotoAndPlay(0);
            }
        }
    }

    crearBoton(texto, accion, ancho, alto) {
        const boton = new PIXI.Container();

        const fondo = new PIXI.Graphics()
            .roundRect(0, 0, ancho, alto, 10)
            .fill({ color: 0x35354D })
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

    mostrar() { this.overlay.visible = true; }

    jugar() {
        this.game.app.ticker.remove(this._tickerGallinas);
        this.overlay.visible = false;
        this.overlay.destroy({ children: true });
        this.game.iniciarPartida();
    }
}

// Menú de pausa. Se abre y cierra con ESC, vive en app.stage para no verse afectado por la cámara.
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
            .fill({ color: 0x35354D })
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

// Barra de xp. Franja arriba de la pantalla que se llena hacia el próximo nivel y
// muestra el tiempo jugado en la partida.
class BarraXP {
    constructor(game) {
        this.game  = game;
        this.ancho = this.game.W;
        this.alto  = 15;

        this.fondo = new PIXI.Graphics();
        this.fondo.rect(0, 0, this.ancho, this.alto).fill({ color: 0x555555 });
        this.game.app.stage.addChild(this.fondo);

        this.relleno = new PIXI.Graphics();
        this.game.app.stage.addChild(this.relleno);

        // Tiempo jugado en esta partida, en frames, se reinicia con cada BarraXP nueva
        this.framesJugados = 0;
        this.tiempoHUD = new PIXI.Text('00:00', {
            fill: 0xffffff, fontFamily: 'Arial', fontSize: 14, fontWeight: 'bold',
        });
        this.tiempoHUD.anchor.set(0.5, 0);
        this.tiempoHUD.x = this.ancho / 2;
        this.tiempoHUD.y = this.alto + 4;
        this.game.app.stage.addChild(this.tiempoHUD);
    }

    actualizar() {
        const jugador = this.game.player;
        if (!jugador) return;

        const costo    = jugador.costoNivel(jugador.nivel);
        const progreso = Math.max(0, Math.min(1, jugador.xpDesdeUltimoNivel / costo));

        this.relleno.clear();
        if (progreso > 0) {
            this.relleno.rect(0, 0, this.ancho * progreso, this.alto).fill({ color: 0x8dff6e });
        }

        this.framesJugados++;
        const segundosTotales = Math.floor(this.framesJugados / 60);
        const minutos  = Math.floor(segundosTotales / 60);
        const segundos = segundosTotales % 60;
        this.tiempoHUD.text = `${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
    }
}

// Pantalla de derrota. Se muestra una sola vez cuando el jugador llega a 0 de vida,
// con las stats finales de la partida y un botón para reiniciar.
class PantallaDerrota {
    constructor(game) {
        this.game = game;

        this.overlay = new PIXI.Container();
        this.overlay.visible = false;
        this.game.app.stage.addChild(this.overlay);

        const fondo = new PIXI.Graphics();
        fondo.rect(0, 0, this.game.W, this.game.H).fill({ color: 0x000000, alpha: 0.85 });
        this.overlay.addChild(fondo);

        const titulo = new PIXI.Text('FUISTE CAZADO', {
            fill: 0xffffff, fontFamily: 'Arial', fontSize: 32, fontWeight: 'bold',
        });
        titulo.anchor.set(0.5, 0);
        titulo.x = this.game.W / 2;
        titulo.y = 60;
        this.overlay.addChild(titulo);

        // Se completa recién en mostrar(), cuando ya se conocen las stats finales
        this.statsTexto = new PIXI.Text('', {
            fill: 0xffffff, fontFamily: 'Arial', fontSize: 16, align: 'center', lineHeight: 22,
        });
        this.statsTexto.anchor.set(0.5, 0);
        this.statsTexto.x = this.game.W / 2;
        this.statsTexto.y = 130;
        this.overlay.addChild(this.statsTexto);

        const anchoBoton = 220;
        const altoBoton  = 56;
        const boton = this.crearBoton('REINICIAR', () => window.location.reload(), anchoBoton, altoBoton);
        boton.x = this.game.W / 2 - anchoBoton / 2;
        boton.y = this.game.H - altoBoton - 40;
        this.overlay.addChild(boton);
    }

    crearBoton(texto, accion, ancho, alto) {
        const boton = new PIXI.Container();

        const fondo = new PIXI.Graphics()
            .roundRect(0, 0, ancho, alto, 10)
            .fill({ color: 0x35354D })
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

    mostrar() {
        const jugador = this.game.player;
        const tiempo  = this.game.barraXP ? this.game.barraXP.tiempoHUD.text : '00:00';

        this.statsTexto.text =
            `Tiempo sobrevivido: ${tiempo}\n\n` +
            `Nivel alcanzado: ${jugador.nivel}\n` +
            `XP total: ${jugador.xp}\n` +
            `Daño: ${jugador.dano}\n` +
            `Rango de disparo: ${Math.round(jugador.rangoDisparo)}\n` +
            `Velocidad de disparo: ${(60 / jugador.cooldownMax).toFixed(2)}/s\n` +
            `Velocidad de movimiento: ${jugador.speed.toFixed(2)}\n` +
            `Radio de recolección: ${Math.round(jugador.radioRecoleccion)}`;

        this.overlay.visible = true;
    }
}
