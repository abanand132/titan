class GameTimer {
    constructor(duration, onTick, onComplete) {
        this.duration = duration;
        this.remaining = duration;
        this.onTick = onTick;
        this.onComplete = onComplete;
        this.paused = true;
    }

    start() {
        if (this.paused) {
            this.paused = false;
            this.tick();
        }
    }

    pause() {
        this.paused = true;
        if (this.interval) {
            clearInterval(this.interval);
        }
    }

    reset() {
        this.remaining = this.duration;
        this.pause();
        this.onTick(this.formatTime(this.remaining));
    }

    tick() {
        this.interval = setInterval(() => {
            this.remaining--;
            this.onTick(this.formatTime(this.remaining));

            if (this.remaining <= 0) {
                this.pause();
                this.onComplete();
            }
        }, 1000);
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
} 