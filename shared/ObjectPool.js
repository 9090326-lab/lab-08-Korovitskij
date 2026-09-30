// shared/ObjectPool.ts
export class ObjectPool<T> {
    private pool: T[] = [];
    private createFn: () => T;
    private resetFn: (obj: T, ...args: any[]) => void;

    constructor(createFn: () => T, resetFn: (obj: T, ...args: any[]) => void, initialSize = 50) {
        this.createFn = createFn;
        this.resetFn = resetFn;

        // Заповнюємо пул початковими об'єктами, щоб не створювати їх під час гри
        for (let i = 0; i < initialSize; i++) {
            this.pool.push(this.createFn());
        }
    }

    // Отримати об'єкт із пулу (або створити новий, якщо пул порожній)
    public get(...args: any[]): T {
        const obj = this.pool.length > 0 ? this.pool.pop()! : this.createFn();
        this.resetFn(obj, ...args);
        return obj;
    }

    // Повернути об'єкт назад у пул після того, як він більше не потрібен (наприклад, куля зникла)
    public release(obj: T): void {
        this.pool.push(obj);
    }
}