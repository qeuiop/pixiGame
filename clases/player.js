
// Catálogo de mejoras disponibles al subir de nivel.
// Cada entrada es una fábrica: se llama al momento de mostrar las cartas y devuelve
// { descripcion, aplicar(jugador) }. Para agregar una mejora nueva a futuro
// alcanza con sumar otra fábrica a este array, no hay que tocar nada más.
const MEJORAS_DISPONIBLES = [
    () => {
        const porcentaje = Math.round(25 + Math.random() * 25); // entre 25% y 50%
        return {
            descripcion: `+${porcentaje}% velocidad de disparo`,
            aplicar(jugador) {
                jugador.cooldownMax = Math.max(4, Math.round(jugador.cooldownMax * (1 - porcentaje / 100)));
            },
        };
    },
    () => ({
        descripcion: '+10% velocidad de movimiento',
        aplicar(jugador) {
            jugador.speed *= 1.10;
        },
    }),
    () => ({
        descripcion: '+100% rango de disparo',
        aplicar(jugador) {
            jugador.rangoDisparo *= 2;
        },
    }),
];

class Player extends GameObject {
    constructor(x, y, game) {
        super(x, y, 'player.png', game);

        this.speed    = 1;  // Velocidad de movimiento en píxeles por frame
        this.cooldown = 0;    // Contador de enfriamiento entre disparos
        this.cooldownMax = 55; // Frames entre cada disparo automático
        this.xp = 0;

        // Alcance de disparo: el jugador solo dispara a objetivos dentro de 3 veces su tamaño
        this.tamano       = this.gfx.width;
        this.rangoDisparo = this.tamano * 3;

        // Umbrales de mejora: sucesión de Fibonacci empezando en 5 (5, 8, 13, 21, 34...)
        this.umbralesMejora = this.generarFibonacci(5, 8, 20);
        this.siguienteUmbralIndex = 0;
    }

    generarFibonacci(a, b, cantidad) {
        const secuencia = [a, b];
        while (secuencia.length < cantidad) {
            secuencia.push(secuencia[secuencia.length - 1] + secuencia[secuencia.length - 2]);
        }
        return secuencia;
    }

    update(keys) {
        this.mover(keys);
        this.recogerXP();
        this.disparar();
    }

    mover(keys) {

        const dx = (keys['d'] || keys['ArrowRight'] ? 1 : 0)
                 - (keys['a'] || keys['ArrowLeft']  ? 1 : 0);
        const dy = (keys['s'] || keys['ArrowDown']  ? 1 : 0)
                 - (keys['w'] || keys['ArrowUp']    ? 1 : 0);

        const dir = normalizar(dx, dy);

        this.x += dir.x * this.speed;
        this.y += dir.y * this.speed;

        // Mantenemos al jugador dentro de los límites del mapa
        this.x = Math.max(0, Math.min(this.game.anchoMundo, this.x));
        this.y = Math.max(0, Math.min(this.game.altoMundo, this.y));

        this.sincronizarGrafico();
    }

    
    recogerXP() {
        for (let i = this.game.xpItems.length - 1; i >= 0; i--) {
            const xp = this.game.xpItems[i];
            if (distancia(this.x, this.y, xp.x, xp.y) < 18) {
                this.xp += (xp.value || 1);
                const esXPGrande = xp.esGrande;
                xp.destruir();
                this.game.xpItems.splice(i, 1);

                this.revisarMejoraPorXP();

                // El XP grande (soltado por enemigos grandes) tiene además una chance
                // de otorgar una mejora extra, independiente del umbral por Fibonacci
                if (esXPGrande && Math.random() < 0.5) {
                    this.mostrarSeleccionMejora();
                }

                // Si se abrió la selección de mejora, dejamos de recolectar XP este frame
                // para no disparar dos cartas superpuestas si se cruzan varios umbrales a la vez
                if (this.game.pausado) break;
            }
        }
    }

    revisarMejoraPorXP() {
        if (this.siguienteUmbralIndex >= this.umbralesMejora.length) return;

        const umbral = this.umbralesMejora[this.siguienteUmbralIndex];
        if (this.xp >= umbral) {
            this.siguienteUmbralIndex++;
            this.mostrarSeleccionMejora();
        }
    }

    elegirMejorasAleatorias(cantidad) {
        const indices = MEJORAS_DISPONIBLES.map((_, i) => i);
        for (let i = indices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [indices[i], indices[j]] = [indices[j], indices[i]];
        }
        return indices.slice(0, cantidad).map(i => MEJORAS_DISPONIBLES[i]());
    }

    mostrarSeleccionMejora() {
        // Evita superponer dos selecciones de mejora a la vez (p. ej. umbral de XP + XP grande juntos)
        if (this.game.pausado) return;

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
                .fill({ color: 0x222244 })
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

        const [mejoraIzquierda, mejoraDerecha] = this.elegirMejorasAleatorias(2);

        const cartaIzquierda = crearCarta(centerX - cardWidth - gap / 2, mejoraIzquierda);
        const cartaDerecha   = crearCarta(centerX + gap / 2, mejoraDerecha);

        overlay.addChild(cartaIzquierda, cartaDerecha);
    }

    disparar() {
        // Reducimos el cooldown cada frame
        if (this.cooldown > 0) {
            this.cooldown--;
            return;
        }

        // Buscamos el enemigo más cercano
        const objetivo = this.buscarObjetivoCercano();
        if (!objetivo) return;

        // Solo disparamos si el objetivo está dentro del rango de disparo
        if (distancia(this.x, this.y, objetivo.x, objetivo.y) > this.rangoDisparo) return;

        // Calculamos el ángulo objetivo
        const angulo = Math.atan2(
            objetivo.y - this.y,
            objetivo.x - this.x
        );

        // Pedimos al juego que cree una bala con esa dirección
        this.game.agregarBala(
            this.x, this.y,
            Math.cos(angulo) * 6,
            Math.sin(angulo) * 6
        );

        // Reiniciamos el cooldown
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
