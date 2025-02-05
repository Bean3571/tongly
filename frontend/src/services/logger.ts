type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    data?: any;
}

class Logger {
    private static instance: Logger;
    private logBuffer: LogEntry[] = [];
    private readonly bufferSize: number = 1000;
    private readonly logToConsole: boolean = process.env.NODE_ENV === 'development';

    private constructor() {
        window.addEventListener('error', this.handleError.bind(this));
        window.addEventListener('unhandledrejection', this.handlePromiseRejection.bind(this));
    }

    public static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    private formatLogEntry(level: LogLevel, message: string, data?: any): LogEntry {
        return {
            timestamp: new Date().toISOString(),
            level,
            message,
            data
        };
    }

    private addToBuffer(entry: LogEntry) {
        this.logBuffer.push(entry);
        if (this.logBuffer.length > this.bufferSize) {
            this.logBuffer.shift();
        }

        if (this.logToConsole) {
            const consoleMethod = {
                debug: console.debug,
                info: console.info,
                warn: console.warn,
                error: console.error
            }[entry.level];

            consoleMethod(
                `[${entry.timestamp}] ${entry.level.toUpperCase()}: ${entry.message}`,
                entry.data || ''
            );
        }
    }

    private handleError(event: ErrorEvent) {
        this.error('Uncaught error', {
            message: event.message,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            stack: event.error?.stack
        });
    }

    private handlePromiseRejection(event: PromiseRejectionEvent) {
        this.error('Unhandled promise rejection', {
            reason: event.reason
        });
    }

    public debug(message: string, data?: any) {
        this.addToBuffer(this.formatLogEntry('debug', message, data));
    }

    public info(message: string, data?: any) {
        this.addToBuffer(this.formatLogEntry('info', message, data));
    }

    public warn(message: string, data?: any) {
        this.addToBuffer(this.formatLogEntry('warn', message, data));
    }

    public error(message: string, data?: any) {
        this.addToBuffer(this.formatLogEntry('error', message, data));
    }

    public getRecentLogs(): LogEntry[] {
        return [...this.logBuffer];
    }

    public clearLogs() {
        this.logBuffer = [];
    }

    public async sendLogsToServer() {
        if (this.logBuffer.length === 0) return;

        try {
            // Implement sending logs to your backend server
            // await api.post('/logs', { logs: this.logBuffer });
            this.clearLogs();
        } catch (error) {
            console.error('Failed to send logs to server:', error);
        }
    }
}

export const logger = Logger.getInstance(); 