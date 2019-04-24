class Paddle {

    constructor(id, initialPosition) {
        this.paddleId = id;
        this.centerPosition = initialPosition;
    }

    setPaddleId(id) {
        this.paddleId = id;
        socket.emit('paddleId_update', { newPaddleId: id });
    }

    getPaddleId() {
        return this.paddleId;
    }

    move(dir) {
        socket.emit('paddle_movement_attempt', {});

        const gap = 120/paddles.length;
        if(this.centerPosition+dir+gap >= 0 && this.centerPosition+dir-gap <= 0) {
            this.centerPosition += dir;
        }
        socket.emit('paddle_moved', {player: paddleId, newPos: this.centerPosition });
    }

    display() {
        var goalLength = 360/paddles.length;
        var gap = goalLength / 3;
        var i = this.paddleId * goalLength;
        var arcRadius = 1.9 * radius;
        var start = i + 90 + gap + this.centerPosition;
        var stop = i + 90 + goalLength - gap + this.centerPosition;

        arc(0, 0, arcRadius, arcRadius, start, stop);
    }
}
