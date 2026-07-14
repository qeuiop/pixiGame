
// Catálogo de mejoras básicas al subir de nivel, cada entrada tiene un tipo y una fábrica generar()

// rehacer  el catalogo de mejoras para que este en una nueva clase
//antigravity buscar
//menu en una nueva clase
const MEJORAS_CATALOGO = [
    {
        tipo: 'rango',
        tope: 5, // mejoras máximo, luego desaparece del pool
        generar() {
            const porcentaje = aleatorioInt(15, 20);
            return {
                tipo: this.tipo,
                descripcion: `+${porcentaje}% rango de disparo`,
                aplicar(jugador) {
                    jugador.rangoDisparo *= 1 + porcentaje / 100;
                },
            };
        },
    },
    {
        tipo: 'cadencia',
        tope: 5,
        generar() {
            const porcentaje = aleatorioInt(10, 15);
            return {
                tipo: this.tipo,
                descripcion: `+${porcentaje}% velocidad de disparo`,
                aplicar(jugador) {
                    jugador.cooldownMax = Math.max(4, Math.round(jugador.cooldownMax * (1 - porcentaje / 100)));
                },
            };
        },
    },
    {
        tipo: 'velocidad',
        tope: 4, // demasiada velocidad rompe el reto de los bordes del mapa
        generar() {
            const porcentaje = aleatorioInt(8, 10);
            return {
                tipo: this.tipo,
                descripcion: `+${porcentaje}% velocidad de movimiento`,
                aplicar(jugador) {
                    jugador.speed *= 1 + porcentaje / 100;
                },
            };
        },
    },
    {
        tipo: 'radio',
        tope: 5,
        generar() {
            const porcentaje = aleatorioInt(20, 25);
            return {
                tipo: this.tipo,
                descripcion: `+${porcentaje}% radio de recolección`,
                aplicar(jugador) {
                    jugador.radioRecoleccion *= 1 + porcentaje / 100;
                    // El radio de recolección nunca supera el rango de disparo
                    jugador.radioRecoleccion = Math.min(jugador.radioRecoleccion, jugador.rangoDisparo);
                },
            };
        },
    },
    {
        tipo: 'dano',
        tope: 5,
        generar() {
            return {
                tipo: this.tipo,
                descripcion: '+1 daño por disparo',
                aplicar(jugador) {
                    jugador.dano += 1;
                },
            };
        },
    },
];

// Catálogo de mejoras especiales de disparo, se obtienen al matar un élite y recoger su mota
const MEJORAS_ESPECIALES_CATALOGO = [
    {
        tipo: 'dividido',
        descripcion: 'Disparo dividido',
        nivelInicial: () => ({ cada: 4 }), // cada 4 disparos se divide en 2 hacia objetivos cercanos
        mejorar: (estado) => { estado.cada = Math.max(2, estado.cada - 1); },
    },
    {
        tipo: 'perforante',
        descripcion: 'Disparo perforante',
        nivelInicial: () => ({ atraviesa: 1 }), // el proyectil atraviesa  enemigos en línea
        mejorar: (estado) => { estado.atraviesa += 1; },
    },
];

// Personaje del jugador. Maneja movimiento, disparo automático, vida, subida de nivel con
// selección de mejoras, recolección de xp y todo el HUD visual pegado a su sprite.
class Player extends GameObject {
    constructor(x, y, game) {
        super(x, y, 'player.png', game);

        this.speed       = 1;  // velocidad de movimiento
        this.cooldown    = 0;  // enfriamiento entre disparos
        this.cooldownMax = 55; // frames entre cada disparo automático
        this.dano        = 1;  // daño por disparo
        this.xp          = 0;  // xp total de la partida

        this.vida          = 5;
        this.vidaMax        = 5;
        this.inmunidadMax   = 60; // 1 segundo a 60fps
        this.inmunidadTimer = 0;
        this.inmortal       = false; // cheat CTRL+1, ver clases/cheats.js

        this.flashTimer    = 0;
        this.duracionFlash = 30; // 0.5s a 60fps, flash blanco al recibir daño
        this.filtroFlash   = crearFiltroFlashBlanco(); // instancia propia, ver comentario en utils.js

        // El jugador solo dispara a objetivos dentro de 3 veces su tamaño
        this.tamano       = this.gfx.width;
        this.rangoDisparo = this.tamano * 3;

        // El sprite tiene margen vacío alrededor, la colisión física es más chica que el visual
        this.radioColision = (this.tamano / 2) * 0.7;

        this.radioRecoleccion = this.tamano * 0.625; // radio de recolección de xp

        this.nivel                = 1;
        this.xpDesdeUltimoNivel   = 0;

        this.nivelesMejora = {}; // veces que se eligió cada mejora básica, para su tope

        this.mejorasEspeciales        = {}; // tipo, estado propio de cada mejora especial activa
        this.topeMejorasEspeciales    = 3;
        this.contadorDisparos         = 0; // usado por mejoras que actúan cada X disparos

        // Reemplaza el sprite estático por una AnimatedSprite, y recrea su espejo gris
        this.game.mundoColor.removeChild(this.gfx);
        this.gfx.destroy();
        this.game.mundoGris.removeChild(this.gfxGris);
        this.gfxGris.destroy();

        const runSrc = PIXI.Assets.get('sprites/chicken_run_left-Sheet.png');
        this._framesRun = Array.from({ length: 4 }, (_, i) =>
            new PIXI.Texture({ source: runSrc.source, frame: new PIXI.Rectangle(i * 16, 0, 16, 16) })
        );

        const eatSrc = PIXI.Assets.get('sprites/chicken_eating_left-Sheet.png');
        this._framesEat = Array.from({ length: 8 }, (_, i) =>
            new PIXI.Texture({ source: eatSrc.source, frame: new PIXI.Rectangle(i * 16, 0, 16, 16) })
        );

        this.gfx = new PIXI.AnimatedSprite(this._framesEat);
        this.gfx.anchor.set(0.5);
        this.gfx.animationSpeed = 0.12;
        this.gfx.x = this.x;
        this.gfx.y = this.y;
        this.game.mundoColor.addChild(this.gfx);

        this.gfxGris = new PIXI.Sprite(this.gfx.texture);
        this.gfxGris.anchor.set(0.5);
        this.gfxGris.x = this.x;
        this.gfxGris.y = this.y;
        this.game.mundoGris.addChild(this.gfxGris);

        this._animState  = 'eat';
        this._eatFlipped = false; // alterna espejeo al terminar cada ciclo idle
        this._iniciarEat();

        // this._gfxDano es una copia en blanco y negro de this.gfx dibujada encima, una
        // máscara la recorta para que tape solo la parte proporcional a la vida perdida
        const filtroGrisVida = new PIXI.ColorMatrixFilter();
        filtroGrisVida.blackAndWhite(true);

        this._gfxDano = new PIXI.Sprite(this.gfx.texture);
        this._gfxDano.anchor.set(0.5);
        this._gfxDano.filters = [filtroGrisVida];
        this.game.mundoColor.addChild(this._gfxDano);

        this._maskVida = new PIXI.Graphics();
        this.game.mundoColor.addChild(this._maskVida);
        this._gfxDano.mask = this._maskVida;

        // Barrita de vida debajo del jugador. A full se ve del color de vida, a medida que
        // baja se pone gris de derecha a izquierda (fondo gris de base, relleno de color
        // encima recortado al ancho proporcional a la vida restante)
        this._barraVidaAncho   = this.tamano * 1.3;
        this._barraVidaAlto    = 3;
        this._barraVidaOffsetY = this.tamano / 2 + 6;

        this._barraVidaFondo = new PIXI.Graphics();
        this.game.mundoColor.addChild(this._barraVidaFondo);

        this._barraVidaRelleno = new PIXI.Graphics();
        this.game.mundoColor.addChild(this._barraVidaRelleno);
    }

    // Costo de xp para subir del nivel dado al siguiente
    costoNivel(nivel) {
        return 10 + (nivel - 1) * 10;
    }

    // Recompensa por matar al boss slime, multiplica todos los stats x1.5 de su valor actual
    recibirRecompensaBoss() {
        this.dano             *= 1.5;
        this.rangoDisparo     *= 1.5;
        this.speed             *= 1.5;
        this.radioRecoleccion *= 1.5;
        // El radio de recolección nunca supera el rango de disparo
        this.radioRecoleccion  = Math.min(this.radioRecoleccion, this.rangoDisparo);

        // Cadencia, aumentar el stat significa disparar más rápido, o sea bajar el cooldown
        this.cooldownMax = Math.max(4, Math.round(this.cooldownMax / 1.5));

        // Vida máxima x1.5, curando lo que subió el máximo
        const vidaMaxAnterior = this.vidaMax;
        this.vidaMax *= 1.5;
        this.vida    += (this.vidaMax - vidaMaxAnterior);
    }

    // Arranca la animación de idle, al completarse alterna el espejeo y se repite
    _iniciarEat() {
        this.gfx.textures = this._framesEat;
        this.gfx.scale.x  = this._eatFlipped ? -1 : 1;
        this.gfx.loop      = false;
        this.gfx.onComplete = () => {
            if (this._animState !== 'eat') return; // el jugador se movió antes de que terminara
            this._eatFlipped = !this._eatFlipped;
            this._iniciarEat();
        };
        this.gfx.gotoAndPlay(0);
    }

    update(keys) {
        this.mover(keys);
        this.recogerXP();
        this.disparar();
        this.recibirColisionesEnemigos();
        this.actualizarMascaraVida();
        this.actualizarBarraVida();
        this.actualizarFlash();
    }

    // 1 de daño por colisión con un enemigo, con inmunidad entre golpes
    recibirColisionesEnemigos() {
        if (this.inmortal) return;

        if (this.inmunidadTimer > 0) {
            this.inmunidadTimer--;
            return;
        }

        const colisiona = this.game.enemies.some(enemigo =>
            distancia(this.x, this.y, enemigo.x, enemigo.y) < (this.radioColision + enemigo.radius)
        );

        if (colisiona) {
            this.vida = Math.max(0, this.vida - 1);
            this.inmunidadTimer = this.inmunidadMax;
            this.activarFlash();
        }
    }

    activarFlash() {
        this.flashTimer = this.duracionFlash;
    }

    // Aplica o retira el filtro de flash blanco según flashTimer
    actualizarFlash() {
        if (this.flashTimer > 0) {
            this.flashTimer--;
            this.gfx.filters = [this.filtroFlash];
        } else {
            this.gfx.filters = null;
        }
    }

    // Muestra this._gfxDano desde arriba hacia abajo, cubriendo la parte del sprite
    // proporcional a la vida perdida
    actualizarMascaraVida() {
        const fraccion = this.vida / this.vidaMax;

        const ancho          = this.gfx.width;
        const alto           = this.gfx.height;
        const alturaPerdida  = alto * (1 - fraccion);

        this._gfxDano.texture = this.gfx.texture;
        this._gfxDano.scale.copyFrom(this.gfx.scale);
        this._gfxDano.x = this.x;
        this._gfxDano.y = this.y;

        this._maskVida.clear();
        if (alturaPerdida > 0) {
            this._maskVida.rect(-ancho / 2, -alto / 2, ancho, alturaPerdida).fill(0xffffff);
        }
        this._maskVida.x = this.x;
        this._maskVida.y = this.y;
    }

    // Redibuja y reposiciona la barrita de vida debajo del jugador
    actualizarBarraVida() {
        const fraccion = this.vida / this.vidaMax;
        const ancho    = this._barraVidaAncho;
        const alto     = this._barraVidaAlto;
        const x        = this.x - ancho / 2;
        const y        = this.y + this._barraVidaOffsetY;

        this._barraVidaFondo.clear();
        this._barraVidaFondo.rect(x, y, ancho, alto).fill({ color: 0x888888 });

        this._barraVidaRelleno.clear();
        if (fraccion > 0) {
            this._barraVidaRelleno.rect(x, y, ancho * fraccion, alto).fill({ color: 0xD6601E });
        }
    }

    mover(keys) {
        const dx = (keys['d'] || keys['ArrowRight'] ? 1 : 0)
                 - (keys['a'] || keys['ArrowLeft']  ? 1 : 0);
        const dy = (keys['s'] || keys['ArrowDown']  ? 1 : 0)
                 - (keys['w'] || keys['ArrowUp']    ? 1 : 0);

        const dir = normalizar(dx, dy);

        if (dx !== 0 || dy !== 0) {
            // Transición a run solo cuando cambia el estado
            if (this._animState !== 'run') {
                this._animState = 'run';
                this.gfx.textures  = this._framesRun;
                this.gfx.loop      = true;
                this.gfx.onComplete = null;
                this.gfx.gotoAndPlay(0);
            }
            // Espejea según el último eje horizontal presionado
            if (dx !== 0) this.gfx.scale.x = dx > 0 ? -1 : 1;
        } else {
            // Transición a idle, reinicia el ciclo siempre desde izquierda
            if (this._animState !== 'eat') {
                this._animState  = 'eat';
                this._eatFlipped = false;
                this._iniciarEat();
            }
        }

        this.x += dir.x * this.speed;
        this.y += dir.y * this.speed;

        this.x = Math.max(0, Math.min(this.game.anchoMundo, this.x));
        this.y = Math.max(0, Math.min(this.game.altoMundo, this.y));

        this.sincronizarGrafico();
    }


    recogerXP() {
        for (let i = this.game.xpItems.length - 1; i >= 0; i--) {
            const xp = this.game.xpItems[i];
            if (distancia(this.x, this.y, xp.x, xp.y) >= this.radioRecoleccion) continue;

            xp.destruir();
            this.game.xpItems.splice(i, 1);

            if (xp.esEspecial) {
                // La mota especial no otorga xp, pausa el juego y deja elegir la mejora especial
                this.mostrarSeleccionMejoraEspecial();
                if (this.game.pausado) break;
                continue;
            }

            this.xp += (xp.value || 1);
            this.xpDesdeUltimoNivel += (xp.value || 1);
            this.revisarMejoraPorXP();

            // Si se abrió la selección de mejora, no sigue recolectando xp este frame
            if (this.game.pausado) break;
        }
    }

    revisarMejoraPorXP() {
        const costo = this.costoNivel(this.nivel);
        if (this.xpDesdeUltimoNivel >= costo) {
            this.xpDesdeUltimoNivel -= costo;
            this.nivel++;
            this.mostrarSeleccionMejora();
        }
    }

    elegirMejorasAleatorias(cantidad) {
        const disponibles = MEJORAS_CATALOGO.filter(entrada => (this.nivelesMejora[entrada.tipo] || 0) < entrada.tope);

        for (let i = disponibles.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [disponibles[i], disponibles[j]] = [disponibles[j], disponibles[i]];
        }

        return disponibles.slice(0, cantidad).map(entrada => entrada.generar());
    }

    mostrarSeleccionMejora() {
        // Evita superponer dos selecciones de mejora a la vez
        if (this.game.pausado) {
            console.warn('[DEBUG] mostrarSeleccionMejora bloqueado, ya había una mejora en pantalla');
            return;
        }

        const mejoras = this.elegirMejorasAleatorias(2);
        if (mejoras.length === 0) return; // todas las mejoras básicas llegaron a su tope

        this.game.pausado = true;

        const stage      = this.game.app.stage;
        const cardWidth   = 160;
        const cardHeight  = 220;
        const gap         = 30;
        const centerX     = this.game.W / 2;
        const centerY     = this.game.H / 2;

        const overlay = new PIXI.Container();
        stage.addChild(overlay);

        const fondo = new PIXI.Graphics();
        fondo.rect(0, 0, this.game.W, this.game.H).fill({ color: 0x000000, alpha: 0.6 });
        overlay.addChild(fondo);

        const seleccionar = (mejora) => {
            mejora.aplicar(this);
            this.nivelesMejora[mejora.tipo] = (this.nivelesMejora[mejora.tipo] || 0) + 1;
            overlay.destroy({ children: true });
            this.game.pausado = false;
        };

        const crearCarta = (x, mejora) => {
            const carta = new PIXI.Container();
            carta.x = x;
            carta.y = centerY - cardHeight / 2;

            const fondoCarta = new PIXI.Graphics();
            fondoCarta
                .roundRect(0, 0, cardWidth, cardHeight, 12)
                .fill({ color: 0x5550D9 })
                .stroke({ width: 3, color: 0xffffff });
            carta.addChild(fondoCarta);

            const txtDesc = new PIXI.Text(mejora.descripcion, {
                fill: 0xffffff, fontFamily: 'Arial', fontSize: 18, fontWeight: 'bold',
                wordWrap: true, wordWrapWidth: cardWidth - 20, align: 'center',
            });
            txtDesc.anchor.set(0.5, 0.5);
            txtDesc.x = cardWidth / 2;
            txtDesc.y = cardHeight / 2;
            carta.addChild(txtDesc);

            carta.eventMode = 'static';
            carta.cursor    = 'pointer';
            carta.on('pointerdown', () => seleccionar(mejora));

            return carta;
        };

        if (mejoras.length === 1) {
            overlay.addChild(crearCarta(centerX - cardWidth / 2, mejoras[0]));
        } else {
            overlay.addChild(crearCarta(centerX - cardWidth - gap / 2, mejoras[0]));
            overlay.addChild(crearCarta(centerX + gap / 2, mejoras[1]));
        }
    }

    elegirCandidatosEspeciales(cantidad) {
        const activos = Object.keys(this.mejorasEspeciales);
        const nuevasDisponibles = MEJORAS_ESPECIALES_CATALOGO.filter(m => !activos.includes(m.tipo));

        const candidatos = [];
        if (activos.length < this.topeMejorasEspeciales) {
            candidatos.push(...nuevasDisponibles.map(catalogo => ({ catalogo, esNuevo: true })));
        }
        candidatos.push(...activos.map(tipo => ({
            catalogo: MEJORAS_ESPECIALES_CATALOGO.find(m => m.tipo === tipo),
            esNuevo: false,
        })));

        for (let i = candidatos.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [candidatos[i], candidatos[j]] = [candidatos[j], candidatos[i]];
        }

        return candidatos.slice(0, cantidad);
    }

    // Pausa el juego y muestra cartas para elegir la mejora especial
    mostrarSeleccionMejoraEspecial() {
        if (this.game.pausado) {
            console.warn('[DEBUG] mostrarSeleccionMejoraEspecial bloqueado, ya había una selección en pantalla');
            return;
        }

        const candidatos = this.elegirCandidatosEspeciales(2);
        if (candidatos.length === 0) return; // tope alcanzado y nada para mejorar

        this.game.pausado = true;

        const stage      = this.game.app.stage;
        const cardWidth   = 160;
        const cardHeight  = 220;
        const gap         = 30;
        const centerX     = this.game.W / 2;
        const centerY     = this.game.H / 2;

        const overlay = new PIXI.Container();
        stage.addChild(overlay);

        const fondo = new PIXI.Graphics();
        fondo.rect(0, 0, this.game.W, this.game.H).fill({ color: 0x000000, alpha: 0.6 });
        overlay.addChild(fondo);

        const titulo = new PIXI.Text('¡Mejora especial!', {
            fill: 0xCC66FF, fontFamily: 'Arial', fontSize: 22, fontWeight: 'bold',
        });
        titulo.anchor.set(0.5, 0);
        titulo.x = centerX;
        titulo.y = centerY - cardHeight / 2 - 36;
        overlay.addChild(titulo);

        const seleccionar = (candidato) => {
            if (candidato.esNuevo) {
                this.mejorasEspeciales[candidato.catalogo.tipo] = candidato.catalogo.nivelInicial();
                this.game.mostrarToast(`¡Nueva mejora especial: ${candidato.catalogo.descripcion}!`);
            } else {
                candidato.catalogo.mejorar(this.mejorasEspeciales[candidato.catalogo.tipo]);
                this.game.mostrarToast(`¡${candidato.catalogo.descripcion} mejorado!`);
            }
            overlay.destroy({ children: true });
            this.game.pausado = false;
        };

        const crearCarta = (x, candidato) => {
            const carta = new PIXI.Container();
            carta.x = x;
            carta.y = centerY - cardHeight / 2;

            const fondoCarta = new PIXI.Graphics();
            fondoCarta
                .roundRect(0, 0, cardWidth, cardHeight, 12)
                .fill({ color: 0xD6601E })
                .stroke({ width: 3, color: 0xCC66FF });
            carta.addChild(fondoCarta);

            const etiqueta = candidato.esNuevo ? 'NUEVA' : 'MEJORAR';
            const txtDesc = new PIXI.Text(`${etiqueta}\n\n${candidato.catalogo.descripcion}`, {
                fill: 0xffffff, fontFamily: 'Arial', fontSize: 18, fontWeight: 'bold',
                wordWrap: true, wordWrapWidth: cardWidth - 20, align: 'center',
            });
            txtDesc.anchor.set(0.5, 0.5);
            txtDesc.x = cardWidth / 2;
            txtDesc.y = cardHeight / 2;
            carta.addChild(txtDesc);

            carta.eventMode = 'static';
            carta.cursor    = 'pointer';
            carta.on('pointerdown', () => seleccionar(candidato));

            return carta;
        };

        if (candidatos.length === 1) {
            overlay.addChild(crearCarta(centerX - cardWidth / 2, candidatos[0]));
        } else {
            overlay.addChild(crearCarta(centerX - cardWidth - gap / 2, candidatos[0]));
            overlay.addChild(crearCarta(centerX + gap / 2, candidatos[1]));
        }
    }

    disparar() {
        if (this.cooldown > 0) {
            this.cooldown--;
            return;
        }

        // Apunta siempre al enemigo más cercano
        const objetivo = this.buscarObjetivoCercano();
        if (!objetivo) return;

        if (distancia(this.x, this.y, objetivo.x, objetivo.y) > this.rangoDisparo) return;

        const angulo = Math.atan2(
            objetivo.y - this.y,
            objetivo.x - this.x
        );

        this.contadorDisparos++;

        const perforante  = this.mejorasEspeciales.perforante;
        const perforacion = perforante ? perforante.atraviesa : 0;
        const dividido    = this.mejorasEspeciales.dividido;

        if (dividido && this.contadorDisparos % dividido.cada === 0) {
            // Disparo dividido, sale en V hacia el objetivo
            const desviacion = 0.35; // radianes
            this.game.agregarBala(this.x, this.y, Math.cos(angulo - desviacion) * 6, Math.sin(angulo - desviacion) * 6, this.dano, perforacion);
            this.game.agregarBala(this.x, this.y, Math.cos(angulo + desviacion) * 6, Math.sin(angulo + desviacion) * 6, this.dano, perforacion);
        } else {
            this.game.agregarBala(this.x, this.y, Math.cos(angulo) * 6, Math.sin(angulo) * 6, this.dano, perforacion);
        }

        this.cooldown = this.cooldownMax;
    }

    buscarObjetivoCercano() {
        let objetivo  = null;
        let minDist   = Infinity;

        for (const enemigo of this.game.enemies) {
            const d = distancia(this.x, this.y, enemigo.x, enemigo.y);
            if (d < minDist) {
                minDist  = d;
                objetivo = enemigo;
            }
        }

        return objetivo;
    }
}
