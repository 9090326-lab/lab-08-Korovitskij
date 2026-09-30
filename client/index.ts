// client/index.ts
import { updatePlayerState } from '../shared/game-logic.js';
import { ObjectPool } from '../shared/ObjectPool.js'; // Імпортуємо ваш пул об'єктів

export interface ClientPlayerState {
    x: number;
    y: number;
    vx: number;
    vy: number;
    angle: number;
}

export interface ClientInput {
    seq: number;
    thrust: boolean;
    turnLeft: boolean;
    turnRight: boolean;
}

let localSeq = 0;
let myPlayerId = 1;

let myState: ClientPlayerState = { x: 400, y: 300, vx: 0, vy: 0, angle: 0 };
const pendingInputs: ClientInput[] = [];

// --- ДОДАЄМО ПУЛ ОБ'ЄКТІВ ДЛЯ КУЛЬ / ЧАСТИНОК ---
const bulletPool = new ObjectPool(
    () => ({ x: 0, y: 0, vx: 0, vy: 0, active: false }),
    (bullet, x, y, vx, vy) => {
        bullet.x = x;
        bullet.y = y;
        bullet.vx = vx;
        bullet.vy = vy;
        bullet.active = true;
    },
    100 // Початковий розмір пулу
);

const activeBullets: any[] = [];

// Метрики для netgraph
export const netgraphData = {
    rtt: 0,
    snapshotAge: 0,
    bytesPerSec: 0,
    inputQueueLength: 0,
    correctionMagnitude: 0
};

const keys: Record<string, boolean> = {};

window.addEventListener('keydown', (e: KeyboardEvent) => { keys[e.code] = true; });
window.addEventListener('keyup', (e: KeyboardEvent) => { keys[e.code] = false; });

// Приклад події пострілу (якщо гравець стріляє, наприклад, на клік миші)
window.addEventListener('mousedown', () => {
    const speed = 15;
    const vx = Math.cos(myState.angle) * speed;
    const vy = Math.sin(myState.angle) * speed;

    // БЕРЕМО кулю з пулу замість створення нового об'єкта через 'new'
    const bullet = bulletPool.get(myState.x, myState.y, vx, vy);
    activeBullets.push(bullet);
});

export function clientTick(ws: WebSocket | null | undefined) {
    localSeq++;

    const input: ClientInput = {
        seq: localSeq,
        thrust: !!(keys['ArrowUp'] || keys['KeyW']),
        turnLeft: !!(keys['ArrowLeft'] || keys['KeyA']),
        turnRight: !!(keys['ArrowRight'] || keys['KeyD'])
    };

    pendingInputs.push(input);
    netgraphData.inputQueueLength = pendingInputs.length;

    // 1. Передбачення: одразу рухаємо свій корабель локально
    updatePlayerState(myState, input, 1 / 60);

    // Оновлюємо активні кулі з пулу (без створення нових векторів у пам'яті)
    for (let i = activeBullets.length - 1; i >= 0; i--) {
        const b = activeBullets[i];
        b.x += b.vx;
        b.y += b.vy;

        // Якщо куля вилетіла за межі — повертаємо в пул
        if (b.x < 0 || b.x > 800 || b.y < 0 || b.y > 600) {
            b.active = false;
            activeBullets.splice(i, 1);
            bulletPool.release(b); // Повернення об'єкта в пул
        }
    }
}

function serializeInputBinary(input: ClientInput): ArrayBuffer {
    const buffer = new ArrayBuffer(6); 
    const view = new DataView(buffer);
    view.setUint32(0, input.seq, true);

    let flags = 0;
    if (input.thrust) flags |= 1;
    if (input.turnLeft) flags |= 2;
    if (input.turnRight) flags |= 4;
    view.setUint8(4, flags);

    return buffer;
}

export function handleServerSnapshot(arrayBuffer: ArrayBuffer) {
    const view = new DataView(arrayBuffer);
    let offset = 0;

    const version = view.getUint8(offset); offset += 1;
    const playersCount = view.getUint16(offset, true); offset += 2;

    for (let i = 0; i < playersCount; i++) {
        const id = view.getUint32(offset, true); offset += 4;
        const serverX = view.getFloat32(offset, true); offset += 4;
        const serverY = view.getFloat32(offset, true); offset += 4;
        const serverAngle = view.getInt16(offset, true) / 1000; offset += 2;
        const lastSeq = view.getUint32(offset, true); offset += 4;

        if (id === myPlayerId) {
            const oldX = myState.x;
            const oldY = myState.y;

            myState.x = serverX;
            myState.y = serverY;
            myState.angle = serverAngle;

            while (pendingInputs.length > 0 && pendingInputs[0]!.seq <= lastSeq) {
                pendingInputs.shift();
            }

            for (const input of pendingInputs) {
                updatePlayerState(myState, input, 1 / 60);
            }

            netgraphData.correctionMagnitude = Math.hypot(myState.x - oldX, myState.y - oldY);
        }
    }
}