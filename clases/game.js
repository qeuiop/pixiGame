class Game {
    constructor() {
        this.W = window.innerWidth;   
        this.H = window.innerHeight;
        this.anchoMundo = 1800;       
        this.altoMundo  = 1800;

        this.app = null;

        this.wave       = 1; // refleja el nivel del jugador, solo para HUD/debug
        this.spawnTimer = 0;

        this.player  = null;
        this.bullets = [];
        this.enemies = [];
         this.xpItems = [];
        this.pausado = false;

        // Menú de pausa (ESC): separado de "pausado" (que se usa para las cartas
        // de selección de mejora), así uno no pisa al otro
        this.menu        = null;
        this.enMenuPausa = false;
        this.barraXP     = null;

        // Oleada en vector: cada 15s aparecen specters en un borde que cruzan el mapa en línea recta
        this.eventoVectorTimer     = 0;
        this.eventoVectorIntervalo = 15 * 60;

        this.containerPrincipal  = null;
        this.mundoGris           = null; // capa de fondo: todo el mapa, siempre en blanco y negro
        this.mundoColor          = null; // capa recortada por mascaraPercepcion: solo se ve dentro del rango del jugador
        this.mascaraPercepcion   = null; // círculo que define qué parte de mundoColor se muestra
        this.targetCamara        = null;
        this.limiteDerechoCamara = 0;
        this.limiteInferiorCamara= 0;

        this.keys = {};
        window.addEventListener('keydown', e => {
            this.keys[e.key] = true;
            if (e.key === 'Escape' && this.menu) this.alternarMenuPausa();
        });
        window.addEventListener('keyup', e => this.keys[e.key] = false);

        this.inicializar();
    }


    async inicializar() {
        try {
            const SPRITE_FILES = ['player.png', 'bullet.png', 'wraith.png', 'wraith_move.png', 'specter.png', 'specter_move.png', 'xp.png', 'fondo.png',
                                   'chicken_run_left-Sheet.png', 'chicken_eating_left-Sheet.png'];
            await PIXI.Assets.load(SPRITE_FILES.map(n => `sprites/${n}`));

            await this.iniciar();

            const texturaFondo = PIXI.Assets.get('sprites/fondo.png');

            // Un TilingSprite por mundo (comparten la misma textura, es liviano):
            // el gris siempre visible, el de color solo se ve dentro de la máscara
            this.fondoGris = new PIXI.TilingSprite({ texture: texturaFondo, width: this.anchoMundo, height: this.altoMundo });
            this.fondoColor = new PIXI.TilingSprite({ texture: texturaFondo, width: this.anchoMundo, height: this.altoMundo });
            this.mundoGris.addChildAt(this.fondoGris, 0);
            this.mundoColor.addChildAt(this.fondoColor, 0);

            // Spawn inicial en el mundo lejos del centro
            for (let i = 0; i < 3; i++) this.agregarWraith( Math.random() * this.anchoMundo, Math.random() * this.altoMundo);
            for (let i = 0; i < 5; i++) this.agregarSpecter(Math.random() * this.anchoMundo, Math.random() * this.altoMundo);

        } catch (err) {
            console.error('Error al inicializar el juego:', err);
        }
    }

async iniciar() {
    this.app = new PIXI.Application();
    await this.app.init({
        width:           600,     
        height:          600,
        backgroundColor: 0x000000,
    });

    // Actualizamos W y H para que moverCamara use los valores correctos
    this.W = 600;
    this.H = 600;

        const view = this.app.view || this.app.canvas || (this.app.renderer && this.app.renderer.view);    if (!view) throw new Error('No se pudo obtener el canvas de PixiJS');
    document.body.appendChild(view);

    this.containerPrincipal = new PIXI.Container();
    this.app.stage.addChild(this.containerPrincipal);

    // Efecto de percepción: el mapa vive duplicado en dos capas, mundoGris en blanco y
    // negro y mundoColor recortado con una máscara circular centrada en el jugador
    this.mundoGris  = new PIXI.Container();
    this.mundoColor = new PIXI.Container();
    this.containerPrincipal.addChild(this.mundoGris);
    this.containerPrincipal.addChild(this.mundoColor);

    const filtroGris = new PIXI.ColorMatrixFilter();
    filtroGris.blackAndWhite(true);
    this.mundoGris.filters = [filtroGris];

    // Hija de containerPrincipal para que su transform se actualice junto con la cámara
    this.mascaraPercepcion = new PIXI.Graphics();
    this.containerPrincipal.addChild(this.mascaraPercepcion);
    this.mundoColor.mask = this.mascaraPercepcion;

    // Los stats quedan ocultos y solo se muestran con el menú de pausa abierto
    this.xpHUD = new PIXI.Text('XP: 0', {
        fill: 0xffffff,
        fontFamily: 'Arial',
        fontSize: 24,
        fontWeight: 'bold',
    });
    this.xpHUD.x = 10;
    this.xpHUD.y = 10;
    this.xpHUD.visible = false;
    this.app.stage.addChild(this.xpHUD);

    this.statsHUD = new PIXI.Text('', {
        fill: 0xffffff,
        fontFamily: 'Arial',
        fontSize: 14,
    });
    this.statsHUD.x = 10;
    this.statsHUD.y = 40;
    this.statsHUD.visible = false;
    this.app.stage.addChild(this.statsHUD);

    // Toast para avisar mejoras especiales, no pausa el juego ni compite con la carta de nivel
    this.toastHUD = new PIXI.Text('', {
        fill: 0xCC66FF,
        fontFamily: 'Arial',
        fontSize: 18,
        fontWeight: 'bold',
    });
    this.toastHUD.anchor.set(0.5, 0);
    this.toastHUD.x = this.W / 2;
    this.toastHUD.y = 10;
    this.toastTimer = 0;
    this.app.stage.addChild(this.toastHUD);

    // Jugador en el centro del MUNDO
    this.player = new Player(this.anchoMundo / 2, this.altoMundo / 2, this);
    this.targetCamara = this.player;

    // Evita que el primer frame muestre al jugador fuera de centro
    this.containerPrincipal.x = -(this.anchoMundo / 2) + this.W / 2;
    this.containerPrincipal.y = -(this.altoMundo  / 2) + this.H / 2;

    this.menu    = new Menu(this);
    this.barraXP = new BarraXP(this);

    this.app.ticker.add(() => this.update());
}

    alternarMenuPausa() {
        if (this.enMenuPausa) this.cerrarMenuPausa();
        else this.abrirMenuPausa();
    }

    abrirMenuPausa() {
        // No se abre encima de una selección de mejora ya en pantalla
        if (this.pausado) return;

        this.enMenuPausa = true;
        this.menu.abrir();
        this.xpHUD.visible    = true;
        this.statsHUD.visible = true;
    }

    cerrarMenuPausa() {
        this.enMenuPausa = false;
        this.menu.cerrar();
        this.xpHUD.visible    = false;
        this.statsHUD.visible = false;
    }

    moverCamara() {
    if (!this.targetCamara) return;

    // player.x y player.y deben ser las coordenadas en el juego
    const objX = -this.targetCamara.x + this.W * 0.5;
    const objY = -this.targetCamara.y + this.H * 0.5;

    const lerp = 0.08;
    this.containerPrincipal.x += (objX - this.containerPrincipal.x) * lerp;
    this.containerPrincipal.y += (objY - this.containerPrincipal.y) * lerp;

    // Clamp: que no muestre terreno fuera del mundo
    if (this.containerPrincipal.x > 0) this.containerPrincipal.x = 0;
    if (this.containerPrincipal.y > 0) this.containerPrincipal.y = 0;

    const limDer = -this.anchoMundo + this.W;
    const limInf = -this.altoMundo  + this.H;
    if (this.containerPrincipal.x < limDer) this.containerPrincipal.x = limDer;
    if (this.containerPrincipal.y < limInf) this.containerPrincipal.y = limInf;
    }

    agregarWraith(x, y, esElite = false)          { this.enemies.push(new Wraith(x, y, this, esElite));         }
    agregarSpecter(x, y, destinoVector = null, esElite = false) { this.enemies.push(new Specter(x, y, this, destinoVector, esElite)); }
    agregarBala(x, y, vx, vy, dano = 1, perforaciones = 0) { this.bullets.push(new Bullet(x, y, vx, vy, this, dano, perforaciones)); }
    agregarXP(x, y, value = 1, esGrande = false, esEspecial = false) { this.xpItems.push(new XPItem(x, y, this, value, esGrande, esEspecial)); }

    mostrarToast(mensaje) {
        this.toastHUD.text  = mensaje;
        this.toastTimer = 150; // frames visible (~2.5s a 60fps)
    }


    update() {
        if (this.pausado || this.enMenuPausa) return;

        if (this.player) this.player.update(this.keys);
        this.updateBalas();
        this.enemies.forEach(e => e.update());
        this.resolverColisionesEnemigos();
        this.resolverColisionJugadorEnemigos();
        this.eliminarEnemigosMarcados();
        this.xpItems.forEach(xp => xp.update());
        if (this.player) {
            this.xpHUD.text = `XP: ${this.player.xp} | Nivel: ${this.player.nivel}`;
            this.statsHUD.text =
                `Rango: ${Math.round(this.player.rangoDisparo)}\n` +
                `Vel. disparo: ${(60 / this.player.cooldownMax).toFixed(2)}/s\n` +
                `Vel. movimiento: ${this.player.speed.toFixed(2)}\n` +
                `Radio recolección: ${Math.round(this.player.radioRecoleccion)}\n` +
                `Daño: ${this.player.dano}`;
            this.barraXP.actualizar();
        }
        if (this.toastTimer > 0) {
            this.toastTimer--;
            if (this.toastTimer <= 0) this.toastHUD.text = '';
        }
        this.spawner();
        this.actualizarEventoVector();
        this.moverCamara();
        this.actualizarMascaraPercepcion();
    }

    // Redibuja y reposiciona el círculo de percepción del jugador sobre mundoColor
    actualizarMascaraPercepcion() {
        if (!this.player) return;

        const radio = this.player.rangoDisparo;
        this.mascaraPercepcion.clear();
        this.mascaraPercepcion.circle(0, 0, radio).fill(0xffffff);

        // Coordenadas de mundo: al ser hija de containerPrincipal, la cámara ya la mueve sola
        this.mascaraPercepcion.x = this.player.x;
        this.mascaraPercepcion.y = this.player.y;
    }

    // Empuja a los enemigos entre sí para que no se superpongan
    resolverColisionesEnemigos() {
        const tolerancia = 0.9; // pequeño margen para que no se traben de forma poco natural
        for (let i = 0; i < this.enemies.length; i++) {
            const a = this.enemies[i];
            for (let j = i + 1; j < this.enemies.length; j++) {
                const b = this.enemies[j];
                const dx = b.x - a.x;
                const dy = b.y - a.y;
                const dist = Math.hypot(dx, dy) || 0.0001;
                const minDist = (a.radius + b.radius) * tolerancia;

                if (dist < minDist) {
                    const solapamiento = (minDist - dist) / 2;
                    const nx = dx / dist;
                    const ny = dy / dist;
                    a.x -= nx * solapamiento;
                    a.y -= ny * solapamiento;
                    b.x += nx * solapamiento;
                    b.y += ny * solapamiento;
                }
            }
        }
        this.enemies.forEach(e => e.sincronizarGrafico());
    }

    // Los enemigos son sólidos y empujan al jugador, salvo mientras está inmune: ahí los atraviesa
    resolverColisionJugadorEnemigos() {
        if (!this.player || this.player.inmunidadTimer > 0) return;

        let empujado = false;

        for (const enemigo of this.enemies) {
            const dx = this.player.x - enemigo.x;
            const dy = this.player.y - enemigo.y;
            const dist = Math.hypot(dx, dy) || 0.0001;
            const minDist = (this.player.tamano / 2) + enemigo.radius;

            if (dist < minDist) {
                const solapamiento = minDist - dist;
                this.player.x += (dx / dist) * solapamiento;
                this.player.y += (dy / dist) * solapamiento;
                empujado = true;
            }
        }

        if (!empujado) return;

        this.player.x = Math.max(0, Math.min(this.anchoMundo, this.player.x));
        this.player.y = Math.max(0, Math.min(this.altoMundo, this.player.y));
        this.player.sincronizarGrafico();
    }

    eliminarEnemigosMarcados() {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            if (this.enemies[i].eliminado) {
                this.enemies[i].destruir();
                this.enemies.splice(i, 1);
            }
        }
    }

    updateBalas() {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];
            b.update();
            let destruirBala = false;

            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const e = this.enemies[j];
                if (b.golpeados.has(e)) continue;

                if (distancia(b.x, b.y, e.x, e.y) < 15) {
                    b.golpeados.add(e);

                    if (e.recibirDano(b.dano)) {
                        // Los élites dejan 5 XP y pueden soltar una mota especial
                        const value = e.esGrande ? 5 : 1;
                        this.agregarXP(e.x, e.y, value, e.esGrande);
                        if (e.esGrande && Math.random() < 0.35) {
                            this.agregarXP(e.x + 14, e.y - 14, 0, false, true);
                        }
                        e.destruir();
                        this.enemies.splice(j, 1);
                    }

                    // Disparo perforante: la bala sigue su camino hasta N enemigos antes de desaparecer
                    if (b.perforacionesRestantes > 0) {
                        b.perforacionesRestantes--;
                    } else {
                        destruirBala = true;
                    }
                    break;
                }
            }

            if (destruirBala || b.life <= 0) {
                b.destruir();
                this.bullets.splice(i, 1);
            }
        }
    }

    // Posición de spawn en el borde del mapa, con sesgo opcional hacia las esquinas
    elegirPosicionBorde(sesgoEsquina = false) {
        const margen = 20;
        const esquinas = [
            { x: 0,               y: 0 },
            { x: this.anchoMundo, y: 0 },
            { x: 0,               y: this.altoMundo },
            { x: this.anchoMundo, y: this.altoMundo },
        ];

        if (sesgoEsquina && Math.random() < 0.7) {
            const esquina  = esquinas[Math.floor(Math.random() * esquinas.length)];
            const jitter   = 150;
            return {
                sx: Math.max(-margen, Math.min(this.anchoMundo + margen, esquina.x + (Math.random() - 0.5) * jitter)),
                sy: Math.max(-margen, Math.min(this.altoMundo + margen, esquina.y + (Math.random() - 0.5) * jitter)),
            };
        }

        switch (Math.floor(Math.random() * 4)) {
            case 0: return { sx: Math.random() * this.anchoMundo, sy: -margen };               // Arriba
            case 1: return { sx: Math.random() * this.anchoMundo, sy: this.altoMundo + margen }; // Abajo
            case 2: return { sx: -margen,               sy: Math.random() * this.altoMundo };  // Izquierda
            default: return { sx: this.anchoMundo + margen, sy: Math.random() * this.altoMundo }; // Derecha
        }
    }

    // Probabilidad de élite: aparece desde nivel 3 y crece de a poco con el nivel del jugador
    probabilidadElite() {
        const nivel = this.player ? this.player.nivel : 1;
        if (nivel < 3) return 0;
        return Math.min(0.35, 0.05 + (nivel - 3) * 0.03);
    }

    spawner() {
        const nivel = this.player ? this.player.nivel : 1;
        this.wave = nivel; // solo informativo (HUD/debug)

        // El ritmo de aparición está atado al nivel del jugador, no al tiempo transcurrido
        const enemigosPorSegundo = Math.min(4, 0.4 + 0.25 * (nivel - 1));
        const intervaloFrames    = Math.max(15, Math.round(60 / enemigosPorSegundo));

        if (++this.spawnTimer >= intervaloFrames) {
            this.spawnTimer = 0;

            const esHalcon = Math.random() > 0.5; // Wraith = halcón (rápido), Specter = zorro (lento)
            const { sx, sy } = this.elegirPosicionBorde(esHalcon);
            const esElite = Math.random() < this.probabilidadElite();

            esHalcon ? this.agregarWraith(sx, sy, esElite) : this.agregarSpecter(sx, sy, null, esElite);
        }
    }

    actualizarEventoVector() {
        if (++this.eventoVectorTimer >= this.eventoVectorIntervalo) {
            this.eventoVectorTimer = 0;
            this.iniciarEventoVector();
        }
    }

    // Punto al azar sobre el perímetro del mapa.
    elegirPuntoPerimetro() {
        const perimetro = 2 * (this.anchoMundo + this.altoMundo);
        let d = Math.random() * perimetro;

        if (d < this.anchoMundo) return { x: d, y: 0 };                              // arriba
        d -= this.anchoMundo;
        if (d < this.altoMundo) return { x: this.anchoMundo, y: d };                  // derecha
        d -= this.altoMundo;
        if (d < this.anchoMundo) return { x: this.anchoMundo - d, y: this.altoMundo }; // abajo
        d -= this.anchoMundo;
        return { x: 0, y: this.altoMundo - d };                                       // izquierda
    }

    iniciarEventoVector() {
        const jugador = this.player;
        if (!jugador) return;

        // El jugador no puede estar pegado a un borde para que la dirección quede bien definida
        const margen = 20;
        if (jugador.x <= margen || jugador.x >= this.anchoMundo - margen ||
            jugador.y <= margen || jugador.y >= this.altoMundo - margen) return;

        const origen = this.elegirPuntoPerimetro();

        // Rayo origen -> jugador extendido hasta el borde opuesto del mapa (sin dibujarse en pantalla)
        const dir = { x: jugador.x - origen.x, y: jugador.y - origen.y };

        let tSalida = Infinity;
        if (dir.x > 0)      tSalida = Math.min(tSalida, (this.anchoMundo - origen.x) / dir.x);
        else if (dir.x < 0) tSalida = Math.min(tSalida, (0 - origen.x) / dir.x);
        if (dir.y > 0)      tSalida = Math.min(tSalida, (this.altoMundo - origen.y) / dir.y);
        else if (dir.y < 0) tSalida = Math.min(tSalida, (0 - origen.y) / dir.y);

        const destino = { x: origen.x + dir.x * tSalida, y: origen.y + dir.y * tSalida };

        // Reparte los specters en paralelo a la línea para que no queden todos superpuestos
        const perp = normalizar(-dir.y, dir.x);
        const dispersion = 80;
        const cantidadSpecters = 20;
        for (let i = 0; i < cantidadSpecters; i++) {
            const offset = (Math.random() - 0.5) * dispersion;
            const origenSpecter  = { x: origen.x  + perp.x * offset, y: origen.y  + perp.y * offset };
            const destinoSpecter = { x: destino.x + perp.x * offset, y: destino.y + perp.y * offset };

            this.agregarSpecter(origenSpecter.x, origenSpecter.y, destinoSpecter);
        }
    }
}