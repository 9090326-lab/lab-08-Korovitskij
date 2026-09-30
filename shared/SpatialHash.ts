// shared/SpatialHash.ts
export class SpatialHash {
    private cellSize: number;
    private cells: Map<string, any[]>;

    constructor(cellSize: number) {
        this.cellSize = cellSize;
        this.cells = new Map<string, any[]>();
    }

    public clear(): void {
        this.cells.clear();
    }

    private _getKey(x: number, y: number): string {
        const cx = Math.floor(x / this.cellSize);
        const cy = Math.floor(y / this.cellSize);
        return `${cx},${cy}`;
    }

    public insert(entity: { x: number; y: number }): void {
        const key = this._getKey(entity.x, entity.y);
        if (!this.cells.has(key)) {
            this.cells.set(key, []);
        }
        this.cells.get(key)!.push(entity);
    }

    public getNearby(x: number, y: number): any[] {
        const key = this._getKey(x, y);
        return this.cells.get(key) || [];
    }
}