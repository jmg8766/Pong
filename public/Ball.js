class Ball {

    constructor(xPosition, yPosition) {
        this.xPosition = xPosition;
        this.yPosition = yPosition;
    }

    setLocation(xPosition, yPosition) {
        // this.xPosition = lerp(this.xPosition, xPosition, 0.5);
        this.xPosition = xPosition;
        // this.yPosition = lerp(this.yPosition, yPosition, 0.5);
        this.yPosition = yPosition;
    }

    display() {
        fill(50); circle(this.xPosition, this.yPosition, 5);
    }
}


