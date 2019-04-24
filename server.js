var express = require('express');
var app = express();
var server = app.listen(3000);
app.use(express.static('public'));
var socket = require('socket.io');
var io = socket(server);

const msPerFrame = 1000 / 60;
const BALL_SIZE = 5;

// socket.id -> { id, degreesFromCenter }
const paddles = new Map();
// TODO: refactor gap to paddleLength
let ball, goalLength, gap, radius = 400;

function onPaddleMove(socket, dir) {
    // console.log('paddle move request from: ' + socket.id);
    const paddle = paddles.get(socket.id);

    //  only move if paddle doesn't collide with goal boundaries
    if(paddle.degreesFromCenter + dir + gap >= 0 && paddle.degreesFromCenter + dir - gap <= 0) {
        paddle.degreesFromCenter += dir;
        io.emit('paddles_update', { paddles: Array.from(paddles.values()) });
    }
}

function onDisconnect(socket) {
    console.log('disconnection: ' + socket.id);
    const deletedId = paddles.get(socket.id).id;

    // remove the disconnected paddle
    paddles.delete(socket.id);
    paddles.forEach(paddle => {
        if(paddle.id > deletedId) { paddle.id--; }
    });

    resetPositions();
}

let timer, timerIsOn = 0;

function startCollisions() {
    if(!timerIsOn && paddles.size > 0) {
        console.log("startCollisions");
        timerIsOn = 1;

        const { x, y, t} = getLocationAndTimeUntilNextImpact();
        ball.x = x; ball.y = y;
        io.emit('ball_update', { x: x, y: y, t: t});

        timer = setTimeout(collisionLoop, t * msPerFrame);
    }
}

function stopCollisions() {
    if(timerIsOn) {
        console.log("stopCollisions");
        clearTimeout(timer);
        timerIsOn = 0;
    }
}

function collisionLoop() {
    const radiansOfBall = ball.y < 0 ? Math.acos(ball.x / 400) : (2 * Math.PI) - Math.acos(ball.x / 400);
    const degreesOfBall = radiansOfBall * 180 / Math.PI;

    let collisionOccurred = [...paddles].some(([k, v]) => {
        const paddleCenter = ((270 + (v.id * goalLength) + (goalLength / 2)) % 360) - v.degreesFromCenter;
        const paddleMinimum = (360 + paddleCenter - (gap / 2)) % 360;
        const paddleMaximum = (360 + paddleCenter + (gap / 2)) % 360;

        console.log(`paddleMinimum: ${paddleMinimum}, paddleMaximum: ${paddleMaximum}, degreesOfBall: ${degreesOfBall}`);
        return degreesOfBall >= paddleMinimum && degreesOfBall <= paddleMaximum;
    });

    if(collisionOccurred) {
        // console.log(`collision occured, degreesOfBall: ${degreesOfBall}`);
        console.log(`collision occured`);
    }
    ball.xdir *= -1; ball.ydir *= -1; // TODO: better collision calculation
    const { x, y, t } = getLocationAndTimeUntilNextImpact();
    ball.x = x; ball.y = y;
    io.emit('ball_update', { x: x, y: y, t: t});

    timer = setTimeout(collisionLoop, t * msPerFrame);
}

function getLocationAndTimeUntilNextImpact() {
    // console.log('=======================================================================================================');
    // console.log(`ball.. x: ${ball.x}, y: ${ball.y}, xdir: ${ball.xdir}, ydir: ${ball.ydir}
    const magnitudeOfDirection = Math.sqrt(ball.xdir ** 2 + ball.ydir ** 2);
    // console.log("magnitudeOfDirection: " + magnitudeOfDirection);
    const normalizedDirection = { x: ball.xdir / magnitudeOfDirection, y: ball.ydir / magnitudeOfDirection };
    // console.log(`normalizedDirection... x: ${normalizedDirection.x}, y: ${normalizedDirection.y}`);
    const pointOfImpact = { x: normalizedDirection.x * radius, y: normalizedDirection.y * radius};
    // console.log(`pointOfImpact... x: ${pointOfImpact.x}, y: ${pointOfImpact.y}`);
    const distanceFromPointOfImpact = Math.sqrt((pointOfImpact.x - ball.x) ** 2 + (pointOfImpact.y - ball.y) ** 2);
    // console.log(`distanceFromPointOfImpact: ${distanceFromPointOfImpact}`);
    const stepsUntilImpact = (distanceFromPointOfImpact - BALL_SIZE) / magnitudeOfDirection;
    // console.log(`stepsUntilImpact: ${stepsUntilImpact}`);

    return { x: pointOfImpact.x, y: pointOfImpact.y, t: stepsUntilImpact};
}

function resetPositions() {
    stopCollisions();
    // reset the position of every paddle
    paddles.forEach(paddle => paddle.degreesFromCenter = 0);
    // recalculate the gap between reset paddle position and goalposts
    gap = 120 / paddles.size;
    goalLength = 360 / paddles.size;
    // reset the position of the ball, set a random direction
    ball = {
        x: getRandomInteger(-20, 20),
        y: getRandomInteger(-20, 20),
        xdir: getRandomInteger(-10, 10),
        ydir: getRandomInteger(-10, 10)
    };
    // notify all clients of paddle positions and ball position
    io.emit('paddles_update', { paddles: Array.from(paddles.values()) });
    io.emit('ball_update', {x: ball.x, y: ball.y, t: 1});
    startCollisions();
}

function getRandomInteger(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

io.on('connect', socket => {
    console.log('new connection: ' + socket.id);

    paddles.set(socket.id, { id: paddles.size, degreesFromCenter: 0 });
    resetPositions();

    socket.on('request_paddle_move', dir => onPaddleMove(socket, dir));
    socket.on('disconnect', () => onDisconnect(socket));
});

console.log("server running");
