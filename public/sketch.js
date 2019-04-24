const socket = io.connect('http://localhost:3000');

// {id, degreesFromCenter}, {id, degreesFromCenter}, ...
let paddles = [];
let ball = { x: 0, y: 0 };
let nextCollision = { x: 0, y: 0 };
let stepSize = { x: 0, y: 0 };
let boardRadius = 400;

function setup() {
    createCanvas(windowWidth, windowHeight);
    frameRate(60);
    stroke(200, 0, 0);
    smooth();
    strokeWeight(10);
    angleMode(DEGREES);

    socket.on('paddles_update', data => paddles = data.paddles);
    socket.on('ball_update', ({ x, y, t }) => {
        ball = nextCollision;
        nextCollision = { x: x, y: y };
        stepSize = { x: (nextCollision.x - ball.x) / t, y: (nextCollision.y - ball.y) / t };
    });
}

function draw() {
    translate(windowWidth / 2, windowHeight / 2);
    background(50);

    // draws the game board
    fill(250);
    circle(0, 0, boardRadius);
    const goalLength = 360 / paddles.length;
    for(let i = 0; i < 360; i += goalLength) {
        const x = boardRadius * sin(i);
        const y = boardRadius * cos(i);
        line(0.95 * x, 0.95 * y, x, y);
    }

    // draws the paddles
    const gap = goalLength / 3;
    const paddleRadius = 1.9 * boardRadius;
    paddles.forEach(paddle => {
        const degreesOfCenter = paddle.id  * goalLength + 90 + paddle.degreesFromCenter;
        arc(0, 0, paddleRadius, paddleRadius, degreesOfCenter + gap, degreesOfCenter + goalLength - gap);
    });

    // draw the ball
    ball = { x: ball.x + stepSize.x, y: ball.y + stepSize.y };
    circle(ball.x, ball.y, 5);
}

function keyPressed() {
    if (keyCode === LEFT_ARROW)       { socket.emit('request_paddle_move', 1); }
    else if (keyCode === RIGHT_ARROW) { socket.emit('request_paddle_move', -1); }
}
