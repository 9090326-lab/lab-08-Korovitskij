// shared/ObjectPool.ts
export class ObjectPool {
    pool = [];
    createFn;
    resetFn;
    constructor(createFn, resetFn, initialSize = 50) {
        this.createFn = createFn;
        this.resetFn = resetFn;
        // Заповнюємо пул початковими об'єктами, щоб не створювати їх під час гри
        for (let i = 0; i < initialSize; i++) {
            this.pool.push(this.createFn());
        }
    }
    // Отримати об'єкт із пулу (або створити новий, якщо пул порожній)
    get(...args) {
        const obj = this.pool.length > 0 ? this.pool.pop() : this.createFn();
        this.resetFn(obj, ...args);
        return obj;
    }
    // Повернути об'єкт назад у пул після того, як він більше не потрібен (наприклад, куля зникла)
    release(obj) {
        this.pool.push(obj);
    }
}
