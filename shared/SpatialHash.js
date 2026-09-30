// shared/SpatialHash.ts
export class SpatialHash {
    cellSize;
    cells;
    constructor(cellSize) {
        this.cellSize = cellSize;
        this.cells = new Map();
    }
    clear() {
        this.cells.clear();
    }
    _getKey(x, y) {
        const cx = Math.floor(x / this.cellSize);
        const cy = Math.floor(y / this.cellSize);
        return `${cx},${cy}`;
    }
    insert(entity) {
        const key = this._getKey(entity.x, entity.y);
        if (!this.cells.has(key)) {
            this.cells.set(key, []);
        }
        this.cells.get(key).push(entity);
    }
    getNearby(x, y) {
        const key = this._getKey(x, y);
        return this.cells.get(key) || [];
    }
}
