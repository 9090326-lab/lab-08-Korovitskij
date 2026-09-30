// shared/game-logic.ts
import { SpatialHash } from './SpatialHash.js';
export function updatePlayerState(state, input, dt) {
    const rotationSpeed = 3.5;
    const thrustPower = 220;
    if (input.turnLeft)
        state.angle -= rotationSpeed * dt;
    if (input.turnRight)
        state.angle += rotationSpeed * dt;
    if (input.thrust) {
        state.vx += Math.cos(state.angle) * thrustPower * dt;
        state.vy += Math.sin(state.angle) * thrustPower * dt;
    }
    state.x += state.vx * dt;
    state.y += state.vy * dt;
    // Демпфування швидкості (тертя в космосі)
    state.vx *= 0.99;
    state.vy *= 0.99;
}
// Просторовий хеш для перевірки колізій
const spatialHash = new SpatialHash(50);
export function updateCollisions(players, bullets) {
    spatialHash.clear();
    for (const player of players) {
        spatialHash.insert(player);
    }
    for (const bullet of bullets) {
        const nearbyPlayers = spatialHash.getNearby(bullet.x, bullet.y);
        for (const player of nearbyPlayers) {
            const distance = Math.hypot(bullet.x - player.x, bullet.y - player.y);
            if (distance < 20) {
                bullet.active = false;
            }
        }
    }
}
