const $ = (a) => document.querySelector(a);

const $a = (a) => document.querySelectorAll(a);

const c = (a) => console.log(a);

const each = (col, callback) => {
    [].forEach(col, function (el) {
        callback(el);
    });
    return col;
}

const sa = (el, at, val) => {
    el.setAttribute(at, val);
    return el;
}

const fitCanvasToScreen = () => {
    const h = window.innerHeight;
    const w = window.innerWidth;
    sa($("#gamebg"), 'width', w);
    sa($("#gamebg"), 'height', h);
}


window.onload = function () {
    game.init();
    fitCanvasToScreen();
    window.onresize = function () {
        fitCanvasToScreen();
    }
}

const raf = window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    function (callback) {
        setTimeout(callback, 1000 / 60);
    };

const game = {
    player: null,
    points: 0,
    incresaseLife: 0,
    paused: false,
    objects: [],
    ctx: null,
    keys: {},
    canvas: null,
    resources: {},
    frames: 0,
    init: function () {
        if (!localStorage.ranking) {
            const a = [];
            localStorage.ranking = JSON.stringify(a);
        }
        ;
        game.ctx = $("#gamebg").getContext('2d');
        game.canvas = $("#gamebg");
        window.ctx = game.ctx;
        game.populateHandlers();
        game.loadResources();
    },
    populateHandlers: function () {
        document.onkeydown = function (ev) {
            const kc = ev.keyCode;
            if (kc == 80) {
                if (game.paused) {
                    game.paused = false;
                } else {
                    game.paused = true;
                }
            }
            game.keys[kc] = true;
        }
        document.onkeyup = function (ev) {
            const kc = ev.keyCode;
            delete game.keys[kc];
        }
        $("#start").onclick = function (ev) {
            game.start();
            return false;
        }
        $("#save").onclick = function (ev) {
            const nome = $("#nome").value;
            const point = game.points;
            const abc = {
                nome: nome,
                point: point
            };
            const ranking = JSON.parse(localStorage.ranking);
            ranking.push(abc);
            localStorage.ranking = JSON.stringify(ranking);
            return false;
        }
        $("#retry").onclick = function (ev) {
            game.start();
            return false;
        }
    },
    loadResources: function () {
        const resources = [
            'imgs/enemy1.png',
            'imgs/enemy2.png',
            'imgs/enemy3.png',
            'imgs/bullet.png',
            'imgs/player.png',
        ];

        for (let i = 0; i < resources.length; i++) {
            (function (src) {
                const img = new Image();
                img.onload = function (ev) {
                    game.resources[src] = img;
                }
                img.src = src;
            })(resources[i]);
        }
        ;

    },
    endGame: function () {
        game.paused = true;
        sa($("#endform"), 'class', '');
    },
    start: function () {
        game.paused = false;
        game.objects = [];
        sa($("#startform"), 'class', 'hide');
        sa($("#endform"), 'class', 'hide');
        const p = new Player(200, 400);
        game.player = p;
        game.objects.push(p);

        game.update();
    },
    update: function () {
        if (!game.paused) {
            ctx.clearRect(0, 0, game.canvas.width, game.canvas.height);
            for (let i = 0; i < game.objects.length; i++) {
                game.objects[i].update();
            }
            for (let i = 0; i < game.objects.length; i++) {
                game.objects[i].draw();
            }
            for (let i = 0; i < game.objects.length; i++) {
                const el1 = game.objects[i];
                for (let j = i + 1; j < game.objects.length; j++) {
                    const el2 = game.objects[j];
                    el1.verifyCollide(el2);
                }
            }

            if (game.frames % 60 == 0) {
                game.createEnemy();
            }

            game.frames++;
        }
        if (!game.paused)
            raf(game.update);
    },
    createEnemy: function () {
        const x = Math.random() * game.canvas.width;
        const y = Math.random() * game.canvas.height;
        const e = new Enemy(x, y, 1);
        game.objects.push(e);
    },
}

function BaseObject(x, y, img, w, h) {
    this.x = x;
    this.y = y;
    this.angle = 0;
    this.img = img;
    this.width = w;
    this.height = h;
    this.collidable = [];
    this.stepx = 0;
    this.stepy = 0;
    this.frames = 0;
    this.name = 'baseobject';
}

BaseObject.prototype.update = function () {
    this.frames++;
    this.x += (this.stepx / 60);
    this.y += (this.stepy / 60);
    if (this.x > game.canvas.width || this.x + this.width < 0) {
        this.remove();
    }
    ;
    if (this.y > game.canvas.height || this.y + this.height < 0) {
        this.remove();
    }
    ;
};

BaseObject.prototype.draw = function () {
    const x = this.x + (this.width / 2);
    const y = this.y + (this.height / 2);
    const radius = this.angle * Math.PI / 180;

    game.ctx.translate(x, y);
    game.ctx.rotate(radius);
    game.ctx.drawImage(
        this.img,
        (this.x - x),
        (this.y - y),
        this.width,
        this.height
    );
    game.ctx.rotate(-radius);
    game.ctx.translate(-x, -y);
};

BaseObject.prototype.remove = function () {
    const index = game.objects.indexOf(this);
    game.objects.splice(index, 1);
};

BaseObject.prototype.verifyCollide = function (other) {

    const data = this.collidable.filter(function (el) {
        return el == other.name;
    });

    if (!data.length)
        return false;

    const a = {
        x1: this.x,
        x2: this.x + this.width,
        y1: this.y,
        y2: this.y + this.height,
    }

    const b = {
        x1: other.x,
        x2: other.x + other.width,
        y1: other.y,
        y2: other.y + other.height,
    }

    if (
        !((a.x1 > b.x2 || a.x2 < b.x1) ||
            (a.y1 > b.y2 || a.y2 < b.y1))
    ) {
        this.collide();
        other.collide();
    }

};

BaseObject.prototype.collide = function () {
    this.remove();
}

function Player(x, y) {
    const img = game.resources['imgs/player.png'];
    BaseObject.call(this, x, y, img, 36, 54);
    this.collidable = ['Enemy'];
    this.life = 4;
    this.name = 'Player';
}

Player.prototype = new BaseObject;


function polar(cx, cy, angle, raio) {
    return {
        x: cx + raio * Math.cos(angle * Math.PI / 180),
        y: cy + raio * Math.sin(angle * Math.PI / 180),
    }
}

Player.prototype.update = function () {
    // Adelante
    const p = polar(0, 0, this.angle - 90, 10);
    if (game.keys[38]) {
        console.log(this.stepy)
        this.stepy += p.y;
        this.stepx += p.x;
    }
    // Atras
    if (game.keys[40]) {
        this.stepy -= p.y;
        this.stepx -= p.x;
    }
    // Derecha
    if (game.keys[39]) {
        this.angle += 3;
    }
    // Izquierda
    if (game.keys[37]) {
        this.angle -= 3;
    }
    // Disparar
    if (game.keys[32]) {
        this.shoot();
    }
    this.frames++;
    this.x += (this.stepx / 60);
    this.y += (this.stepy / 60);


    if (this.x > game.canvas.width) {
        this.x = this.x - game.canvas.width;
    }

    if (this.x + this.width < 0) {
        this.x = game.canvas.width + this.x;
    }

    if (this.y > game.canvas.height) {
        this.y = this.y - game.canvas.height;
    }
    if (this.y + this.height < 0) {
        this.y = game.canvas.height + this.y;
    }
};

Player.prototype.shoot = function () {
    const p = polar(0, 0, this.angle - 90, 100);
    const pos = polar(this.x + ((this.width / 2) - 2), this.y + (this.height / 2) - 1, this.angle - 90, (this.height / 2));
    const b = new Bullet(pos.x, pos.y);
    b.name = 'MyBullet';
    b.stepx = p.x;
    b.stepy = p.y;
    game.objects.push(b);
};

Player.prototype.collide = function () {
    this.life -= 1;
    $("#life").innerHTML = this.life;
    if (this.life <= 0) {
        this.remove();
        game.endGame();
    }
};

function Bullet(x, y) {
    const img = game.resources['imgs/bullet.png'];
    BaseObject.call(this, x, y, img, 2, 2);
    this.collidable = ['Enemy'];
}

Bullet.prototype = new BaseObject;

const enemysize = {
    1: [179, 177],
    2: [99, 98],
    3: [54, 54],
};
const enemypoints = {
    1: 10,
    2: 50,
    3: 100,
};

function Enemy(x, y, level) {
    const img = game.resources['imgs/enemy' + level + '.png'];
    BaseObject.call(this, x, y, img, enemysize[level][0], enemysize[level][1]);
    this.level = level;
    this.name = 'Enemy';
    this.collidable = ['Player', 'MyBullet'];
    this.stepx = Math.random() * 80;
    this.stepy = Math.random() * 80;
}

Enemy.prototype = new BaseObject;

Enemy.prototype.collide = function () {
    game.points += enemypoints[this.level];
    game.incresaseLife += enemypoints[this.level];
    if (game.incresaseLife > 1000) {
        game.incresaseLife -= 1000;
        game.player.life += 1;
        $("#life").innerHTML = game.player.life;
    }
    BaseObject.prototype.collide.call(this);
    $("#point").innerHTML = game.points;
    if (this.level < 3) {
        const e = new Enemy(this.x, this.y, this.level + 1);
        const e2 = new Enemy(this.x, this.y, this.level + 1);
        game.objects.push(e);
        game.objects.push(e2);
    }
};

Enemy.prototype.update = function () {
    BaseObject.prototype.update.call(this);
    this.angle++;
};