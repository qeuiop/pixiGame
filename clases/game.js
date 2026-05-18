class Game {
    constructor() {
        this.W = window.innerWidth;   
        this.H = window.innerHeight;
        this.anchoMundo = 1800;       
        this.altoMundo  = 1800;

        this.app = null;

        this.wave       = 1;
        this.spawnTimer = 0;
        this.waveTimer  = 0;

        this.player  = null;
        this.bullets = [];
        this.enemies = [];
         this.xpItems = [];

        this.containerPrincipal  = null; 
        this.targetCamara        = null;
        this.limiteDerechoCamara = 0;
        this.limiteInferiorCamara= 0;

        this.keys = {};
        window.addEventListener('keydown', e => this.keys[e.key] = true);
        window.addEventListener('keyup',   e => this.keys[e.key] = false);

        this.inicializar();
    }


    async inicializar() {
        try {
            const SPRITE_FILES = ['player.png', 'bullet.png', 'wraith.png', 'specter.png', 'xp.png', 'fondo.png'];
            await PIXI.Assets.load(SPRITE_FILES.map(n => `sprites/${n}`));

            await this.iniciar();

            const texturaFondo = PIXI.Assets.get('sprites/fondo.png');

            this.fondo = new PIXI.TilingSprite({
                texture: texturaFondo,
                width: this.anchoMundo,
                height: this.altoMundo,
            });
            this.containerPrincipal.addChildAt(this.fondo, 0);

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

    this.xpHUD = new PIXI.Text('XP: 0', {
        fill: 0xffffff,
        fontFamily: 'Arial',
        fontSize: 24,
        fontWeight: 'bold',
    });
    this.xpHUD.x = 10;
    this.xpHUD.y = 10;
    this.app.stage.addChild(this.xpHUD);

    // Jugador en el centro del MUNDO
    this.player = new Player(this.anchoMundo / 2, this.altoMundo / 2, this);
    this.targetCamara = this.player;

    // Evita que el primer frame muestre al jugador fuera de centro
    this.containerPrincipal.x = -(this.anchoMundo / 2) + this.W / 2;
    this.containerPrincipal.y = -(this.altoMundo  / 2) + this.H / 2;

    this.app.ticker.add(() => this.update());
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

    agregarWraith(x, y)          { this.enemies.push(new Wraith(x, y, this));         }
    agregarSpecter(x, y)         { this.enemies.push(new Specter(x, y, this));        }
    agregarBala(x, y, vx, vy)    { this.bullets.push(new Bullet(x, y, vx, vy, this)); }
    agregarXP(x, y)              { this.xpItems.push(new XPItem(x, y, this));         }


    update() {
        if (this.player) this.player.update(this.keys);
        this.updateBalas();
        this.enemies.forEach(e => e.update());
        this.xpItems.forEach(xp => xp.update());
        if (this.player) this.xpHUD.text = `XP: ${this.player.xp}`;
        this.spawner();
        this.moverCamara(); 
    }

    // ─────────────────────────────────────────────────────────────
    //  SUBSISTEMAS PRIVADOS  (sin cambios de lógica)
    // ─────────────────────────────────────────────────────────────
    updateBalas() {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];
            b.update();
            let impacto = false;

            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const e = this.enemies[j];
                if (distancia(b.x, b.y, e.x, e.y) < 15) {
                    this.agregarXP(e.x, e.y);
                    e.destruir();
                    this.enemies.splice(j, 1);
                    impacto = true;
                    break;
                }
            }

            if (impacto || b.life <= 0) {
                b.destruir();
                this.bullets.splice(i, 1);
            }
        }
    }

    spawner() {
        const enemigosPorSegundo = 1 + 3.9 * Math.log(this.wave);
        const intervaloFrames    = Math.max(6, Math.round(60 / enemigosPorSegundo));

        if (++this.spawnTimer >= intervaloFrames) {
            this.spawnTimer = 0;

            // Spawn en los 4 bordes del juego
            let sx, sy;
            const margen = 20;
            switch (Math.floor(Math.random() * 4)) {
                case 0: sx = Math.random() * this.anchoMundo; sy = -margen;               break; // Arriba
                case 1: sx = Math.random() * this.anchoMundo; sy = this.altoMundo+margen; break; // Abajo
                case 2: sx = -margen;               sy = Math.random() * this.altoMundo;  break; // Izquierda
                case 3: sx = this.anchoMundo+margen; sy = Math.random() * this.altoMundo; break; // Derecha
            }

            Math.random() > 0.5 ? this.agregarWraith(sx, sy) : this.agregarSpecter(sx, sy);
        }

        if (++this.waveTimer > 1000) {
            this.waveTimer = 0;
            this.wave++;
            const eps = (1 + 3.9 * Math.log(this.wave)).toFixed(2);
            const iF  = Math.max(6, Math.round(60 / parseFloat(eps)));
            console.log(`Oleada ${this.wave} | ${eps} enemigos/seg | cada ${iF} frames`);
        }
    }
}