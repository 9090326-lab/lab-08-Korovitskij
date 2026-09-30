export function createInput() {
    // Явно вказуємо типи для Map: ключ - рядок (код клавіші), значення - булеве
    const keys = new Map();
    window.addEventListener('keydown', (e) => {
        keys.set(e.code, true);
    });
    window.addEventListener('keyup', (e) => {
        keys.set(e.code, false);
    });
    return {
        // Вказуємо тип аргументу code та тип значення, яке повертає метод
        isPressed(code) {
            return keys.get(code) === true;
        }
    };
}
