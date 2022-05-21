const canvas = document.getElementById('skin');
const bar = document.getElementById('name');
const uuid = document.getElementById('uuid');
canvas.width = 300;
canvas.height = 300;
const walk = document.getElementById('walk');
const run = document.getElementById('run');
const fly = document.getElementById('fly');
const history = document.getElementById('history');
const head = document.getElementById('head');
const player = document.getElementById('player');
const rank = document.getElementById('rank');

const skinViewer = new skinview3d.SkinViewer({
    canvas,
    width: canvas.width,
    height: canvas.height,
    skin: "https://minotar.net/skin/notch"
});

window.addEventListener("resize", () => {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    skinViewer.setSize(canvas.width, canvas.height);
})

let cape = null;
let skin = null;
let playerName = null;

let control = skinview3d.createOrbitControls(skinViewer);
control.enableRotate = true;
control.enableZoom = true;
control.enablePan = false;

let idle = skinViewer.animations.add(skinview3d.IdleAnimation);
let walkAnimation = null;
let runAnimation = null;
let flyAnimation = null;

function removeAnimations() {
    if (walkAnimation) {
        walkAnimation.resetAndRemove();
        walkAnimation = null;
    }
    if (runAnimation) {
        runAnimation.resetAndRemove();
        runAnimation = null;
    }
    if (flyAnimation) {
        flyAnimation.resetAndRemove();
        flyAnimation = null;
    }
}
walk.addEventListener('click', () => {
    const exists = walkAnimation !== null;
    removeAnimations();
    if (!exists) {
        walkAnimation = skinViewer.animations.add(skinview3d.WalkingAnimation);
    }
});
run.addEventListener('click', () => {
    const exists = runAnimation !== null;
    removeAnimations();
    if (!exists) {
        runAnimation = skinViewer.animations.add(skinview3d.RunningAnimation);
    }
});
fly.addEventListener('click', () => {
    const exists = flyAnimation !== null;
    removeAnimations();
    if (!exists) {
        flyAnimation = skinViewer.animations.add(skinview3d.FlyingAnimation);

        if (!cape) return;
        // animate zoom
        const int = setInterval(() => {
            skinViewer.zoom -= 0.02;
            if (skinViewer.zoom <= 0.5) {
                clearInterval(int);
                if (Math.floor(Math.random() * 3) === 0 && playerName === "sverben") {
                    animFly();
                }
            }
        }, 1000 / 60);

        skinViewer.loadCape(`https://api.sverben.nl/safeImage?url=${cape}`, {backEquipment: "elytra"});
    } else {
        const int = setInterval(() => {
            skinViewer.zoom += 0.02;
            if (skinViewer.zoom >= 0.9) clearInterval(int);
        }, 1000 / 60);
    }
});

bar.addEventListener("change", () => {
    removeAnimations();
    loadPlayer(bar.value);
});

head.addEventListener("click", () => {
    const link = document.createElement('a');
    link.download = "skin.png";
    link.href = `https://api.sverben.nl/safeImage?url=${skin}`;
    link.click();
})

async function rarity() {
    const res = await fetch(`https://api.sverben.nl/freq?word=${playerName}`);
    const data = await res.json();

    if (data.length === 0) return;
    if (data[0].word.toUpperCase() !== playerName.toUpperCase()) return;
    if (parseInt(data[0].tags[0].split(":")[1]) < 2) return;
    if (rank.innerText !== "Player") return;

    rank.innerText = "OG";
    rank.style.color = "gold";

    if (parseInt(data[0].tags[0].split(":")[1]) < 10) return;
    rank.classList.add("legendary");
}

async function loadPlayer(name) {
    const res = await fetch(`https://mc-heads.net/minecraft/profile/${name}`);
    const json = await res.json();

    const textures = json.properties.find(p => p.name === "textures");
    const decoded = atob(textures.value);
    const texture = JSON.parse(decoded);
    head.src = `https://mc-heads.net/avatar/${name}`;

    if (texture.textures.SKIN) {
        skinViewer.loadEars(null);
        skinViewer.loadSkin(`https://api.sverben.nl/safeImage?url=${texture.textures.SKIN.url}`, {
            ears: texture.profileName === "deadmau5"
        });
        skin = texture.textures.SKIN.url;
    }
    if (texture.textures.CAPE) {
        skinViewer.loadCape(`https://api.sverben.nl/safeImage?url=${texture.textures.CAPE.url}`);
        cape = texture.textures.CAPE.url;
    } else {
        skinViewer.loadCape(null);
        cape = null;
    }

    uuid.innerText = json.id;

    history.innerHTML = "";
    for (let i in json.name_history) {
        const data = json.name_history[i];
        const e = document.createElement("div");
        e.classList.add("data");

        const key = document.createElement("b");
        key.innerText = data.name;
        e.appendChild(key);

        if (data.changedToAt) {
            const val = document.createElement("div");
            const date = new Date(data.changedToAt);
            val.innerText = `${date.getDate()}-${date.getMonth()}-${date.getFullYear()}`;
            e.appendChild(val);
        }

        history.prepend(e);
    }

    player.innerText = texture.profileName;
    playerName = texture.profileName;
    if (texture.profileName === "Dinnerbone" || texture.profileName === "Grumm") {
        skinViewer.playerObject.rotation.z = Math.PI;
    } else {
        skinViewer.playerObject.rotation.z = 0;
    }

    rank.innerText = ranks[json.id] !== undefined ? details[ranks[json.id]].name : mojang.includes(playerName) ? details[1].name : "Player";
    rank.style.color = ranks[json.id] !== undefined && details[ranks[json.id]].color ? details[ranks[json.id]].color : mojang.includes(playerName) ? details[1].color : "white";

    const classes = rank.classList.value.split(" ");
    for (let i of classes) {
        rank.classList.remove(i);
    }

    rank.classList.add("value");
    rarity();
    if (ranks[json.id] !== undefined && details[ranks[json.id]].type) {
        rank.classList.add(details[ranks[json.id]].type);
    }
}

function animFly() {
    const x = skinViewer.camera.position.x * -1;
    const y = skinViewer.camera.position.y;
    const z = skinViewer.camera.position.z;
    const mod = 0.3;

    let currX = 0;
    let currY = 0;
    let currZ = 0;
    let i = 0;
    const int = setInterval(() => {
        currX += x * mod;
        currY += y * mod;
        currZ += z * mod + 1;
        if (currZ < 0) {
            currZ = 0;
        }

        canvas.style.transform = `translate(${currX}px, ${currY}px) scale(${currZ * 0.003})`;
        i++;

        if (i > 120) {
            clearInterval(int);
            canvas.style.display = "none";
            canvas.style.filter = "opacity(0)";
            canvas.style.transform = "";
            setInterval(() => {
                canvas.style.display = "";
                setInterval(() => {
                    canvas.style.filter = "opacity(1)";
                }, 250)
            }, 250);
        }
    }, 1000 / 60);
}

loadPlayer("sverben");