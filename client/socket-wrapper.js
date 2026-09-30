// client/socket-wrapper.ts
export class SocketWrapper {
    // 1. Оголошуємо поля класу з їхніми типами
    url;
    queue;
    reconnectAttempt;
    ws;
    // Колбеки для обробки повідомлень
    onMessage;
    onOpen;
    onClose;
    constructor(url) {
        this.url = url;
        this.queue = [];
        this.reconnectAttempt = 0;
        this.ws = null;
        this.connect();
    }
    connect() {
        this.ws = new WebSocket(this.url);
        this.ws.binaryType = 'arraybuffer';
        this.ws.onopen = () => {
            this.reconnectAttempt = 0;
            if (this.onOpen)
                this.onOpen();
            // Відправляємо все, що накопичилося в черзі
            while (this.queue.length > 0) {
                const item = this.queue.shift();
                if (item && this.ws && this.ws.readyState === WebSocket.OPEN) {
                    this.ws.send(item);
                }
            }
        };
        this.ws.onmessage = (event) => {
            if (this.onMessage) {
                this.onMessage(event.data);
            }
        };
        this.ws.onclose = () => {
            if (this.onClose)
                this.onClose();
            // Проста спроба реконекту з наростаючою затримкою
            this.reconnectAttempt++;
            const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempt), 10000);
            setTimeout(() => this.connect(), delay);
        };
        this.ws.onerror = (err) => {
            console.error('Помилка веб-сокета:', err);
        };
    }
    send(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(data);
        }
        else {
            this.queue.push(data);
        }
    }
    close() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }
}
