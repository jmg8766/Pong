var Victor = require('victor');
const assert = require('assert');

const origin = Victor(0, 0);

module.exports = class Ball {

    constructor(position, velocity) {
        this.position = position;
        this.velocity = velocity;
        this.radius = 9999999;
    }

    move() {
        // console.log("radius: " + this.radius);
        if(this.position.magnitude() + this.velocity.magnitude() > (this.radius * 0.95) - 10) {
        // if(this.position.add(this.velocity).magnitude() > this.radius) {
            this.velocity.invert().rotateDeg(10*(Math.random() - 0.5));
        }
        this.position.add(this.velocity);
    }

    setPosition(position) {
        this.position = position;
    }

    setRadius(radius) {
        // TODO: increase radius when minimum screenHeight increases, consider width
        if(radius < this.radius) {
            this.radius = radius;
            // console.log(`radius set to ${this.radius}`);
        }
    }

    getRadius() {
        return this.radius;
    }
};
