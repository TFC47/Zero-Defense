// --- AUTO-SCALE FOR MOBILE LANDSCAPE ---
function resizeApp() {
    const container = document.getElementById('app-container');
    if(!container) return;
    const scaleX = window.innerWidth / 1000;
    const scaleY = window.innerHeight / 700;
    const scale = Math.min(scaleX, scaleY);
    if (scale < 1) { container.style.transform = `scale(${scale})`; } 
    else { container.style.transform = `scale(1)`; }
}
window.addEventListener('resize', resizeApp);
resizeApp();

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const PALETTE = {
    ELECTRIC_INDIGO: '#6F00FF', CYAN: '#00FFFF', WHITE: '#FFFFFF', NEON_PINK: '#FF6EC7', MAGENTA: '#FF00FF',         
    NEON_ORANGE: '#FF5F00', NEON_YELLOW: '#FFFF00', NEON_BLUE: '#1F51FF', NEON_RED: '#FF3131',
    NEON_GREEN: '#39FF14', LIGHT_BLUE: '#7DF9FF', BLACK: '#050505', BRONZE: '#CD7F32', SILVER: '#C0C0C0', GOLD: '#FFD700'
};

const TOWER_TYPES = {
    smg: { cost: 50, range: 120, damage: 15, fireRate: 12, color: PALETTE.CYAN, pierce: 1 },
    shotgun: { cost: 75, range: 90, damage: 45, fireRate: 50, color: PALETTE.NEON_RED, pierce: 1 },
    sniper: { cost: 100, range: 350, damage: 150, fireRate: 90, color: PALETTE.ELECTRIC_INDIGO, pierce: 3 }
};

const ENEMY_TYPES = {
    scout: { hp: 80, speed: 3.8, radius: 10, color: PALETTE.NEON_BLUE, reward: 20 },
    standard: { hp: 200, speed: 2.2, radius: 15, color: PALETTE.MAGENTA, reward: 30 },
    tank: { hp: 800, speed: 1.2, radius: 22, color: PALETTE.NEON_ORANGE, reward: 60 },
    boss: { hp: 7000, speed: 0.8, radius: 35, color: PALETTE.NEON_RED, reward: 1000 }
};

const MAP_CONFIGS = {
    forest: {
        path: [{ x: 0, y: 350 }, { x: 400, y: 350 }, { x: 400, y: 150 }, { x: 800, y: 150 }, { x: 800, y: 550 }, { x: 1000, y: 550 }],
        obstacles: [
            { x: 225, y: 175, type: 'rock' }, { x: 225, y: 225, type: 'rock' }, { x: 225, y: 275, type: 'rock' },
            { x: 875, y: 275, type: 'rock' }, { x: 925, y: 275, type: 'rock' },
            { x: 125, y: 125, type: 'tree' }, { x: 175, y: 125, type: 'tree' },
            { x: 625, y: 225, type: 'tree' }, { x: 675, y: 225, type: 'tree' }, { x: 625, y: 275, type: 'tree' },
            { x: 125, y: 525, type: 'lake' }, { x: 175, y: 525, type: 'lake' }, { x: 225, y: 525, type: 'lake' },
            { x: 125, y: 575, type: 'lake' }, { x: 175, y: 575, type: 'lake' }, { x: 225, y: 575, type: 'lake' },
            { x: 625, y: 475, type: 'lake' }, { x: 675, y: 475, type: 'lake' }
        ]
    },
    snowy: {
        path: [{ x: 0, y: 150 }, { x: 800, y: 150 }, { x: 800, y: 550 }, { x: 200, y: 550 }, { x: 200, y: 350 }, { x: 1000, y: 350 }],
        obstacles: [
            { x: 425, y: 225, type: 'icy_rock' }, { x: 475, y: 225, type: 'icy_rock' }, { x: 525, y: 225, type: 'icy_rock' },
            { x: 125, y: 625, type: 'icy_rock' }, { x: 175, y: 625, type: 'icy_rock' },
            { x: 325, y: 75, type: 'icy_tree' }, { x: 375, y: 75, type: 'icy_tree' },
            { x: 875, y: 425, type: 'icy_tree' }, { x: 925, y: 425, type: 'icy_tree' },
            { x: 425, y: 425, type: 'frozen_lake' }, { x: 475, y: 425, type: 'frozen_lake' }, { x: 525, y: 425, type: 'frozen_lake' },
            { x: 425, y: 475, type: 'frozen_lake' }, { x: 475, y: 475, type: 'frozen_lake' }, { x: 525, y: 475, type: 'frozen_lake' }
        ]
    },
    japan: {
        path: [{ x: 200, y: 0 }, { x: 200, y: 450 }, { x: 500, y: 450 }, { x: 500, y: 150 }, { x: 800, y: 150 }, { x: 800, y: 700 }],
        obstacles: [
            { x: 75, y: 125, type: 'cherry_tree' }, { x: 125, y: 125, type: 'cherry_tree' }, { x: 125, y: 175, type: 'cherry_tree' },
            { x: 875, y: 325, type: 'cherry_tree' }, { x: 925, y: 325, type: 'cherry_tree' },
            { x: 325, y: 625, type: 'torii' }, { x: 375, y: 625, type: 'torii' }, { x: 625, y: 75, type: 'torii' },
            { x: 325, y: 225, type: 'fuji' }, { x: 375, y: 225, type: 'fuji' }, { x: 325, y: 275, type: 'fuji' }, { x: 375, y: 275, type: 'fuji' }
        ]
    }
};

let activeMapKey = 'forest'; let path = []; let obstacles = [];
let money = 300; let lives = 3; let frameCount = 0; let gameOver = false; let gameWon = false; let isPaused = false; let animationId = null;
let activeTower = null; let selectedGrid = null; let gameSpeed = 1;
let enemies = []; let towers = []; let projectiles = []; let floatingTexts = []; 
const GRID_SIZE = 50;

let currentWave = 1; const MAX_WAVES = 20; let spawnQueue = []; let isWaveActive = false; let waveTimer = 600; let activeBoss = null;

const appContainer = document.getElementById('app-container');
const homeScreen = document.getElementById('home-screen');
const pauseOverlay = document.getElementById('pause-overlay');
const livesEl = document.getElementById('lives');
const moneyEl = document.getElementById('money');
const waveEl = document.getElementById('wave-display');
const btnCallWave = document.getElementById('call-wave-btn');
const chkAutoStart = document.getElementById('auto-start-chk');
const startBtn = document.getElementById('start-btn');
const mapCards = document.querySelectorAll('.map-card');
const contextMenu = document.getElementById('context-menu');
const buildMenu = document.getElementById('build-menu');
const upgradeMenu = document.getElementById('upgrade-menu');
const btnUpgrade = document.getElementById('btn-upgrade');
const btnSell = document.getElementById('btn-sell');
const speedBtn = document.getElementById('speed-btn');

// --- EVENT LISTENERS ---

mapCards.forEach(card => {
    card.addEventListener('click', () => {
        mapCards.forEach(c => c.classList.remove('active')); card.classList.add('active');
        activeMapKey = card.getAttribute('data-map');
    });
});

// TOGGLE SCREENS
startBtn.addEventListener('click', () => {
    homeScreen.classList.remove('active'); 
    appContainer.classList.remove('hidden'); 
    resetGame();
});

document.getElementById('home-btn').addEventListener('click', () => {
    appContainer.classList.add('hidden'); 
    homeScreen.classList.add('active');
    initHomeParticles(); cancelAnimationFrame(animationId);
});

document.getElementById('restart-btn').addEventListener('click', resetGame);
document.getElementById('pause-btn').addEventListener('click', togglePause);

speedBtn.addEventListener('click', () => {
    if (gameSpeed === 1) { gameSpeed = 2; speedBtn.classList.add('active-speed'); } 
    else { gameSpeed = 1; speedBtn.classList.remove('active-speed'); }
});

window.addEventListener('keydown', (e) => { if(e.key.toLowerCase() === 'p') togglePause(); });
btnCallWave.addEventListener('click', startNextWave);

function positionMenu(x, y) {
    const menuWidth = 150; const menuHeight = 150;
    let left = x + 20; let top = y - 20;
    if (left + menuWidth > canvas.width) left = x - menuWidth - 20;
    if (top + menuHeight > canvas.height) top = canvas.height - menuHeight - 10;
    contextMenu.style.left = left + 'px'; contextMenu.style.top = top + 'px';
    contextMenu.classList.remove('hidden');
}
contextMenu.addEventListener('click', (e) => e.stopPropagation());

document.getElementById('btn-build-smg').addEventListener('click', () => buildTower('smg'));
document.getElementById('btn-build-shotgun').addEventListener('click', () => buildTower('shotgun'));
document.getElementById('btn-build-sniper').addEventListener('click', () => buildTower('sniper'));

function buildTower(type) {
    if (!selectedGrid) return; const config = TOWER_TYPES[type];
    if (money >= config.cost) {
        towers.push(new Tower(selectedGrid.x, selectedGrid.y, type));
        money -= config.cost; updateHUD();
        floatingTexts.push(new FloatingText(selectedGrid.x, selectedGrid.y - 20, `-${config.cost}`, PALETTE.CYAN));
        closeMenu();
    } else { floatingTexts.push(new FloatingText(selectedGrid.x, selectedGrid.y - 20, 'NO CREDITS', PALETTE.NEON_ORANGE)); }
}

btnUpgrade.addEventListener('click', () => {
    if (!activeTower || activeTower.level >= 10) return;
    const upgradeCost = activeTower.level * 40;
    if (money >= upgradeCost) {
        money -= upgradeCost; activeTower.level++; activeTower.totalSpent += upgradeCost;
        activeTower.damage = Math.floor(activeTower.damage * 1.3);
        activeTower.range += 10; activeTower.fireRate = Math.max(5, Math.floor(activeTower.fireRate * 0.9));
        updateHUD();
        let color = activeTower.level >= 10 ? PALETTE.GOLD : (activeTower.level >= 5 ? PALETTE.SILVER : PALETTE.BRONZE);
        floatingTexts.push(new FloatingText(activeTower.x, activeTower.y - 20, `LV ${activeTower.level}!`, color));
        floatingTexts.push(new FloatingText(activeTower.x, activeTower.y - 40, `-${upgradeCost}`, PALETTE.CYAN));
        closeMenu(); 
    } else { floatingTexts.push(new FloatingText(activeTower.x, activeTower.y - 20, `NEED ${upgradeCost}`, PALETTE.NEON_ORANGE)); }
});

btnSell.addEventListener('click', () => {
    if (!activeTower) return;
    const sellValue = Math.floor(activeTower.totalSpent * 0.5); 
    money += sellValue; updateHUD();
    floatingTexts.push(new FloatingText(activeTower.x, activeTower.y - 20, `+${sellValue}`, PALETTE.NEON_YELLOW));
    towers = towers.filter(t => t !== activeTower); closeMenu();
});

function closeMenu() { activeTower = null; selectedGrid = null; contextMenu.classList.add('hidden'); }

canvas.addEventListener('click', (e) => {
    if (gameOver || gameWon || isPaused) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX; 
    const clickY = (e.clientY - rect.top) * scaleY;
    
    const gridX = Math.floor(clickX / GRID_SIZE) * GRID_SIZE + (GRID_SIZE / 2);
    const gridY = Math.floor(clickY / GRID_SIZE) * GRID_SIZE + (GRID_SIZE / 2);

    closeMenu();
    if (isOnPath(gridX, gridY)) return;
    for (let obs of obstacles) { if (obs.x === gridX && obs.y === gridY) return; }

    let clickedTower = null;
    for (let t of towers) { if (t.x === gridX && t.y === gridY) { clickedTower = t; break; } }

    if (clickedTower) {
        activeTower = clickedTower;
        buildMenu.classList.add('hidden'); upgradeMenu.classList.remove('hidden');
        const upgradeCost = activeTower.level * 40;
        if (activeTower.level < 10) {
            btnUpgrade.innerText = `UPGRADE (${upgradeCost})`; btnUpgrade.style.opacity = money >= upgradeCost ? '1' : '0.5';
        } else { btnUpgrade.innerText = 'MAX LEVEL'; btnUpgrade.style.opacity = '0.5'; }
        btnSell.innerText = `SELL (+${Math.floor(activeTower.totalSpent * 0.5)})`; positionMenu(clickX, clickY);
    } else {
        selectedGrid = { x: gridX, y: gridY };
        buildMenu.classList.remove('hidden'); upgradeMenu.classList.add('hidden'); positionMenu(clickX, clickY);
    }
});

// --- CORE FUNCTIONS ---

function initHomeParticles() {
    const container = document.querySelector('.home-particles');
    const colorChoices = [PALETTE.ELECTRIC_INDIGO, PALETTE.NEON_PINK, PALETTE.NEON_BLUE, PALETTE.CYAN];
    container.innerHTML = '';
    
    let style = document.getElementById('particle-style');
    if (!style) {
        style = document.createElement('style'); style.id = 'particle-style';
        style.innerHTML = `@keyframes particle-drift { 0% { transform: translateY(0px) translateX(0px); opacity: 0; } 10% { opacity: 0.5; } 90% { opacity: 0.5; } 100% { transform: translateY(-500px) translateX(150px); opacity: 0; } }`;
        document.head.appendChild(style);
    }

    for(let i = 0; i < 50; i++) {
        const p = document.createElement('div'); p.className = 'p-particle';
        const size = Math.random() * 4 + 2; p.style.width = size + 'px'; p.style.height = size + 'px';
        const color = colorChoices[Math.floor(Math.random() * colorChoices.length)];
        p.style.background = color; p.style.boxShadow = `0 0 10px ${color}`;
        p.style.left = Math.random() * 100 + '%'; p.style.top = Math.random() * 100 + '%';
        p.style.animation = `particle-drift ${Math.random() * 20 + 10}s ${Math.random() * -20}s infinite linear`;
        container.appendChild(p);
    }
}
initHomeParticles();

function generateWaveQueue(waveNum) {
    let queue = []; let numEnemies = 10 + (waveNum * 2);
    if (waveNum % 10 === 0) { queue.push('boss'); numEnemies = 5 + waveNum; }
    for(let i=0; i<numEnemies; i++) {
        let r = Math.random();
        if (waveNum < 3) { queue.push('standard'); } 
        else if (waveNum < 6) { r < 0.3 ? queue.push('scout') : queue.push('standard'); } 
        else {
            if (r < 0.2) queue.push('tank'); else if (r < 0.5) queue.push('scout'); else queue.push('standard');
        }
    }
    return queue;
}

function startNextWave() {
    if (isWaveActive || currentWave > MAX_WAVES) return;
    if (waveTimer > 0 && !chkAutoStart.checked) {
        let bonus = Math.floor(waveTimer / 30); 
        if (bonus > 0) {
            money += bonus; floatingTexts.push(new FloatingText(canvas.width/2, 100, `+${bonus} EARLY BONUS`, PALETTE.NEON_YELLOW));
        }
    }
    isWaveActive = true; waveTimer = 0; spawnQueue = generateWaveQueue(currentWave); updateHUD();
}

function isOnPath(gx, gy) {
    const margin = 45; 
    for(let i = 0; i < path.length - 1; i++) {
        const p1 = path[i]; const p2 = path[i+1];
        const minX = Math.min(p1.x, p2.x) - margin; const maxX = Math.max(p1.x, p2.x) + margin;
        const minY = Math.min(p1.y, p2.y) - margin; const maxY = Math.max(p1.y, p2.y) + margin;
        if (gx >= minX && gx <= maxX && gy >= minY && gy <= maxY) return true;
    }
    return false;
}

function togglePause() {
    if (gameOver || gameWon) return; isPaused = !isPaused;
    if (isPaused) pauseOverlay.classList.remove('hidden'); else { pauseOverlay.classList.add('hidden'); animate(); }
}
function updateHUD() { 
    moneyEl.innerText = money; livesEl.innerText = lives > 0 ? '💖'.repeat(lives) : '💀💀💀'; 
    waveEl.innerText = `${currentWave}/${MAX_WAVES}`;
    if (isWaveActive) { btnCallWave.innerText = 'WAVE ACTIVE'; btnCallWave.style.opacity = '0.3'; } 
    else { btnCallWave.style.opacity = '1'; let sec = Math.ceil(waveTimer / 60); btnCallWave.innerText = `CALL WAVE (${sec}s)`; }
}
function getDistance(x1, y1, x2, y2) { return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)); }

function resetGame() {
    cancelAnimationFrame(animationId);
    money = 300; lives = 3; frameCount = 0; gameOver = false; gameWon = false; isPaused = false;
    currentWave = 1; isWaveActive = false; waveTimer = 600; activeBoss = null; gameSpeed = 1; speedBtn.classList.remove('active-speed');
    enemies = []; towers = []; projectiles = []; floatingTexts = []; closeMenu();
    path = MAP_CONFIGS[activeMapKey].path; obstacles = MAP_CONFIGS[activeMapKey].obstacles;
    pauseOverlay.classList.add('hidden'); updateHUD(); animate();
}

// --- CLASSES ---

class FloatingText {
    constructor(x, y, text, color) { this.x = x; this.y = y; this.text = text; this.color = color; this.life = 40; this.opacity = 1; this.vy = -1; }
    update(index) { this.y += this.vy; this.life--; this.opacity = this.life / 40; if (this.life <= 0) floatingTexts.splice(index, 1); }
    draw() { ctx.save(); ctx.globalAlpha = this.opacity; ctx.shadowBlur = 10; ctx.shadowColor = this.color; ctx.fillStyle = this.color; ctx.font = 'bold 18px Orbitron'; ctx.textAlign = 'center'; ctx.fillText(this.text, this.x, this.y); ctx.restore(); }
}

class Enemy {
    constructor(type, waveModifier) {
        const config = ENEMY_TYPES[type]; this.type = type;
        this.x = path[0].x; this.y = path[0].y; this.waypointIndex = 1; this.speed = config.speed;
        this.maxHealth = config.hp * waveModifier; this.health = this.maxHealth;
        this.radius = config.radius; this.color = config.color; this.reward = config.reward;
    }
    draw() {
        ctx.shadowBlur = 15; ctx.shadowColor = this.color; ctx.fillStyle = this.color;
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0; 
        if (this.type !== 'boss') {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.2)'; ctx.fillRect(this.x - 15, this.y - 25, 30, 4);
            ctx.fillStyle = PALETTE.NEON_RED; ctx.fillRect(this.x - 15, this.y - 25, 30 * (this.health / this.maxHealth), 4);
        }
    }
    update() {
        if (this.waypointIndex >= path.length) return;
        const target = path[this.waypointIndex];
        const distance = getDistance(this.x, this.y, target.x, target.y);
        if (distance < this.speed) { this.x = target.x; this.y = target.y; this.waypointIndex++; } 
        else { this.x += ((target.x - this.x) / distance) * this.speed; this.y += ((target.y - this.y) / distance) * this.speed; }
    }
}

class Tower {
    constructor(x, y, type) {
        this.x = x; this.y = y; this.type = type; this.level = 1; const config = TOWER_TYPES[type];
        this.range = config.range; this.damage = config.damage; this.fireRate = config.fireRate; this.color = config.color; this.pierce = config.pierce; this.cooldown = 0; this.totalSpent = config.cost;
    }
    draw() {
        let tierColor = PALETTE.BRONZE; if (this.level >= 5 && this.level <= 9) tierColor = PALETTE.SILVER; if (this.level >= 10) tierColor = PALETTE.GOLD;
        ctx.fillStyle = this.color; ctx.shadowBlur = 15; ctx.shadowColor = this.color; ctx.fillRect(this.x - 20, this.y - 20, 40, 40);
        ctx.strokeStyle = tierColor; ctx.lineWidth = 3; ctx.shadowBlur = 10; ctx.shadowColor = tierColor; ctx.strokeRect(this.x - 20, this.y - 20, 40, 40); ctx.shadowBlur = 0; 
        ctx.fillStyle = PALETTE.BLACK; ctx.fillRect(this.x - 8, this.y - 8, 16, 16); ctx.fillStyle = tierColor; ctx.fillRect(this.x - 6, this.y - 6, 12, 12);
        ctx.fillStyle = PALETTE.WHITE; ctx.shadowColor = PALETTE.BLACK; ctx.shadowBlur = 4; ctx.font = 'bold 10px Orbitron'; ctx.textAlign = 'center'; ctx.fillText(`L${this.level}`, this.x, this.y + 16); ctx.shadowBlur = 0;
        if (activeTower === this) { ctx.beginPath(); ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2); ctx.globalAlpha = 0.3; ctx.strokeStyle = PALETTE.WHITE; ctx.stroke(); ctx.globalAlpha = 1.0; }
    }
    update() {
        if (this.cooldown > 0) this.cooldown--;
        if (this.cooldown === 0) {
            let target = null; let minDistance = this.range;
            for (let enemy of enemies) {
                const dist = getDistance(this.x, this.y, enemy.x, enemy.y);
                if (dist < minDistance) { minDistance = dist; target = enemy; }
            }
            if (target) {
                const angle = Math.atan2(target.y - this.y, target.x - this.x);
                if (this.type === 'shotgun') {
                    projectiles.push(new Projectile(this.x, this.y, angle, this.damage, this.color, this.pierce)); projectiles.push(new Projectile(this.x, this.y, angle - 0.25, this.damage, this.color, this.pierce)); projectiles.push(new Projectile(this.x, this.y, angle + 0.25, this.damage, this.color, this.pierce));
                } else { projectiles.push(new Projectile(this.x, this.y, angle, this.damage, this.color, this.pierce)); }
                this.cooldown = this.fireRate;
            }
        }
    }
}

class Projectile {
    constructor(x, y, angle, damage, color, pierce) { this.x = x; this.y = y; this.damage = damage; this.color = color; this.pierce = pierce; this.speed = 15; this.vx = Math.cos(angle) * this.speed; this.vy = Math.sin(angle) * this.speed; this.hitList = new Set(); this.traveled = 0; this.maxRange = 600; }
    draw() { ctx.shadowBlur = 15; ctx.shadowColor = this.color; ctx.fillStyle = PALETTE.WHITE; ctx.beginPath(); ctx.arc(this.x, this.y, 4, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0; }
    update(index) {
        this.x += this.vx; this.y += this.vy; this.traveled += this.speed;
        if (this.traveled > this.maxRange) { projectiles.splice(index, 1); return; }
        for (let enemy of enemies) {
            if (!this.hitList.has(enemy)) {
                const dist = getDistance(this.x, this.y, enemy.x, enemy.y);
                if (dist < enemy.radius + 4) { 
                    enemy.health -= this.damage; floatingTexts.push(new FloatingText(enemy.x, enemy.y - 20, `-${Math.floor(this.damage)}`, this.color));
                    this.hitList.add(enemy); this.pierce--; if (this.pierce <= 0) { projectiles.splice(index, 1); return; }
                }
            }
        }
    }
}

// --- GAME LOGIC ENGINE ---

function updateGameLogic() {
    if (isWaveActive) {
        if (spawnQueue.length > 0) {
            if (frameCount % 45 === 0) { 
                let type = spawnQueue.shift();
                let hpMod = 1 + (currentWave * 0.10); 
                let e = new Enemy(type, hpMod);
                enemies.push(e); if (type === 'boss') activeBoss = e;
            }
        } else if (enemies.length === 0) {
            isWaveActive = false; currentWave++; waveTimer = 600; 
            if (currentWave > MAX_WAVES) { gameWon = true; }
        }
    } else {
        waveTimer--; if (waveTimer % 60 === 0) updateHUD();
        if (waveTimer <= 0 || chkAutoStart.checked) startNextWave();
    }

    for (let tower of towers) tower.update(); 
    for (let i = projectiles.length - 1; i >= 0; i--) projectiles[i].update(i); 
    
    for (let i = enemies.length - 1; i >= 0; i--) {
        let enemy = enemies[i]; enemy.update();
        if (enemy.waypointIndex >= path.length) { 
            lives--; if (enemy.type === 'boss') lives -= 2; 
            enemies.splice(i, 1); updateHUD(); 
            if (lives <= 0) gameOver = true; continue; 
        }
        if (enemy.health <= 0) {
            money += enemy.reward; floatingTexts.push(new FloatingText(enemy.x, enemy.y, `+${enemy.reward}`, PALETTE.NEON_YELLOW));
            enemies.splice(i, 1); updateHUD(); continue;
        }
    }
    
    for (let i = floatingTexts.length - 1; i >= 0; i--) floatingTexts[i].update(i);
    frameCount++; 
}

// --- RENDERING PROTOCOL ---

function drawBackgroundGrid() { ctx.strokeStyle = 'rgba(0, 255, 255, 0.04)'; ctx.lineWidth = 1; for (let i = 0; i < canvas.width; i += GRID_SIZE) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke(); } for (let j = 0; j < canvas.height; j += GRID_SIZE) { ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(canvas.width, j); ctx.stroke(); } }
function drawObstacles() { 
    for (let obs of obstacles) {
        if (obs.type === 'rock') { ctx.fillStyle = 'rgba(255, 95, 0, 0.15)'; ctx.fillRect(obs.x - 20, obs.y - 20, 40, 40); ctx.strokeStyle = PALETTE.NEON_ORANGE; ctx.lineWidth = 2; ctx.strokeRect(obs.x - 20, obs.y - 20, 40, 40); ctx.beginPath(); ctx.moveTo(obs.x - 20, obs.y - 20); ctx.lineTo(obs.x + 20, obs.y + 20); ctx.moveTo(obs.x + 20, obs.y - 20); ctx.lineTo(obs.x - 20, obs.y + 20); ctx.stroke(); } 
        else if (obs.type === 'tree') { ctx.fillStyle = 'rgba(57, 255, 20, 0.15)'; ctx.beginPath(); ctx.moveTo(obs.x, obs.y - 20); ctx.lineTo(obs.x + 20, obs.y + 10); ctx.lineTo(obs.x - 20, obs.y + 10); ctx.closePath(); ctx.fill(); ctx.strokeStyle = PALETTE.NEON_GREEN; ctx.lineWidth = 2; ctx.stroke(); ctx.fillStyle = PALETTE.NEON_GREEN; ctx.fillRect(obs.x - 4, obs.y + 10, 8, 10); } 
        else if (obs.type === 'lake') { ctx.fillStyle = 'rgba(125, 249, 255, 0.1)'; ctx.fillRect(obs.x - 20, obs.y - 20, 40, 40); ctx.strokeStyle = PALETTE.LIGHT_BLUE; ctx.lineWidth = 2; ctx.strokeRect(obs.x - 20, obs.y - 20, 40, 40); ctx.strokeRect(obs.x - 12, obs.y - 12, 24, 24); ctx.strokeRect(obs.x - 4, obs.y - 4, 8, 8); } 
        else if (obs.type === 'icy_rock') { ctx.fillStyle = 'rgba(255, 255, 255, 0.15)'; ctx.fillRect(obs.x - 20, obs.y - 20, 40, 40); ctx.strokeStyle = PALETTE.WHITE; ctx.lineWidth = 2; ctx.strokeRect(obs.x - 20, obs.y - 20, 40, 40); ctx.beginPath(); ctx.moveTo(obs.x - 10, obs.y - 10); ctx.lineTo(obs.x + 10, obs.y + 10); ctx.moveTo(obs.x + 10, obs.y - 10); ctx.lineTo(obs.x - 10, obs.y + 10); ctx.stroke(); ctx.beginPath(); ctx.moveTo(obs.x, obs.y - 15); ctx.lineTo(obs.x, obs.y + 15); ctx.moveTo(obs.x - 15, obs.y); ctx.lineTo(obs.x + 15, obs.y); ctx.stroke(); } 
        else if (obs.type === 'icy_tree') { ctx.fillStyle = PALETTE.BRONZE; ctx.fillRect(obs.x - 4, obs.y + 10, 8, 10); ctx.fillStyle = 'rgba(125, 249, 255, 0.15)'; ctx.beginPath(); ctx.moveTo(obs.x, obs.y - 20); ctx.lineTo(obs.x + 15, obs.y + 10); ctx.lineTo(obs.x - 15, obs.y + 10); ctx.closePath(); ctx.fill(); ctx.strokeStyle = PALETTE.LIGHT_BLUE; ctx.lineWidth = 2; ctx.stroke(); } 
        else if (obs.type === 'frozen_lake') { ctx.fillStyle = 'rgba(255, 255, 255, 0.05)'; ctx.fillRect(obs.x - 20, obs.y - 20, 40, 40); ctx.strokeStyle = PALETTE.WHITE; ctx.lineWidth = 2; ctx.strokeRect(obs.x - 20, obs.y - 20, 40, 40); ctx.beginPath(); ctx.moveTo(obs.x - 20, obs.y); ctx.lineTo(obs.x + 20, obs.y - 10); ctx.stroke(); ctx.beginPath(); ctx.moveTo(obs.x, obs.y - 20); ctx.lineTo(obs.x + 10, obs.y + 20); ctx.stroke(); } 
        else if (obs.type === 'cherry_tree') { ctx.fillStyle = 'rgba(255, 110, 199, 0.2)'; ctx.beginPath(); ctx.arc(obs.x - 8, obs.y - 5, 10, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(obs.x + 8, obs.y - 5, 10, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(obs.x, obs.y - 12, 10, 0, Math.PI*2); ctx.fill(); ctx.strokeStyle = PALETTE.NEON_PINK; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(obs.x - 8, obs.y - 5, 10, 0, Math.PI*2); ctx.stroke(); ctx.beginPath(); ctx.arc(obs.x + 8, obs.y - 5, 10, 0, Math.PI*2); ctx.stroke(); ctx.beginPath(); ctx.arc(obs.x, obs.y - 12, 10, 0, Math.PI*2); ctx.stroke(); ctx.fillStyle = PALETTE.NEON_RED; ctx.fillRect(obs.x - 3, obs.y + 5, 6, 10); } 
        else if (obs.type === 'torii') { ctx.fillStyle = 'rgba(255, 49, 49, 0.1)'; ctx.fillRect(obs.x - 20, obs.y - 20, 40, 40); ctx.strokeStyle = PALETTE.NEON_RED; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(obs.x - 10, obs.y - 15); ctx.lineTo(obs.x - 10, obs.y + 15); ctx.stroke(); ctx.beginPath(); ctx.moveTo(obs.x + 10, obs.y - 15); ctx.lineTo(obs.x + 10, obs.y + 15); ctx.stroke(); ctx.beginPath(); ctx.moveTo(obs.x - 15, obs.y - 10); ctx.lineTo(obs.x + 15, obs.y - 10); ctx.stroke(); ctx.beginPath(); ctx.moveTo(obs.x - 18, obs.y - 16); ctx.lineTo(obs.x + 18, obs.y - 16); ctx.stroke(); } 
        else if (obs.type === 'fuji') { ctx.fillStyle = 'rgba(111, 0, 255, 0.2)'; ctx.beginPath(); ctx.moveTo(obs.x, obs.y - 15); ctx.lineTo(obs.x + 18, obs.y + 15); ctx.lineTo(obs.x - 18, obs.y + 15); ctx.closePath(); ctx.fill(); ctx.strokeStyle = PALETTE.ELECTRIC_INDIGO; ctx.lineWidth = 2; ctx.stroke(); ctx.fillStyle = PALETTE.WHITE; ctx.beginPath(); ctx.moveTo(obs.x, obs.y - 15); ctx.lineTo(obs.x + 6, obs.y - 5); ctx.lineTo(obs.x - 6, obs.y - 5); ctx.closePath(); ctx.fill(); }
    }
}

function drawPath() { ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.shadowBlur = 10; ctx.shadowColor = PALETTE.CYAN; ctx.strokeStyle = 'rgba(0, 255, 255, 0.08)'; ctx.lineWidth = 44; ctx.beginPath(); ctx.moveTo(path[0].x, path[0].y); for (let i = 1; i < path.length; i++) { ctx.lineTo(path[i].x, path[i].y); } ctx.stroke(); ctx.shadowBlur = 0; ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)'; ctx.lineWidth = 2; ctx.stroke(); }

function drawBossUI() {
    if (activeBoss && enemies.includes(activeBoss)) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'; ctx.fillRect(canvas.width/2 - 200, 20, 400, 20);
        ctx.strokeStyle = PALETTE.NEON_RED; ctx.lineWidth = 2; ctx.strokeRect(canvas.width/2 - 200, 20, 400, 20);
        let hpPercent = Math.max(0, activeBoss.health / activeBoss.maxHealth);
        ctx.fillStyle = PALETTE.NEON_RED; ctx.shadowBlur = 15; ctx.shadowColor = PALETTE.NEON_RED;
        ctx.fillRect(canvas.width/2 - 200, 20, 400 * hpPercent, 20); ctx.shadowBlur = 0;
        ctx.fillStyle = PALETTE.WHITE; ctx.font = '14px Orbitron'; ctx.textAlign = 'center'; ctx.fillText('QUANTUM ANOMALY DETECTED', canvas.width/2, 35);
    } else { activeBoss = null; }
}

function animate() {
    if (isPaused) return;

    if (gameOver || gameWon) {
        ctx.fillStyle = 'rgba(10, 0, 0, 0.9)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        let titleColor = gameWon ? PALETTE.CYAN : PALETTE.NEON_RED;
        ctx.shadowBlur = 30; ctx.shadowColor = titleColor; ctx.fillStyle = titleColor;
        ctx.font = '90px Orbitron'; ctx.textAlign = 'center'; 
        ctx.fillText(gameWon ? 'SYSTEM PURGED' : 'SYSTEM FAILURE', canvas.width / 2, canvas.height / 2);
        ctx.fillStyle = PALETTE.WHITE; ctx.font = '30px Orbitron';
        ctx.fillText(gameWon ? 'SECTOR SECURED' : 'CORE INTEGRITY LOST', canvas.width / 2, canvas.height / 2 + 60); ctx.shadowBlur = 0; 
        return;
    }

    for(let step = 0; step < gameSpeed; step++) {
        if (!gameOver && !gameWon) updateGameLogic();
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackgroundGrid(); drawObstacles(); drawPath();
    for (let tower of towers) tower.draw(); 
    for (let proj of projectiles) proj.draw(); 
    for (let enemy of enemies) enemy.draw(); 
    for (let text of floatingTexts) text.draw();
    drawBossUI(); 

    animationId = requestAnimationFrame(animate);
}