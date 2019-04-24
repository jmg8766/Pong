var socket;

var radius;
var paddles = [];
var paddleId;
let ball = new Ball(0, 0);

function setup() {
    socket = io.connect('http://localhost:3000');

    socket.on('register', data => {
        console.log("register playerCount: " + data.playerCount);
        // add the other paddles
        while(paddles.length < data.playerCount) { paddles.push(new Paddle(paddles.length, 0)); }
        // add this paddle
        paddleId = paddles.length;
        paddles.push(new Paddle(paddles.length, 0));
        socket.emit('registered');
    });
    // when the server reports that a new player has joined
    socket.on("new_player", newPlayerJoined);
    // when the server reports that another client has disconnected
    socket.on("client_disconnected", data => clientDisconnected(data.id));

    // when the server reports that a paddle has moved, modify the position of the paddle
    socket.on("paddle_moved", data => paddles[data.paddleId].centerPosition = data.newPos);
    socket.on("ball_moved", data => {
        // console.log("ball location recieved x: " + data.xPosition + ", y: " + data.yPosition);
        ball.setLocation(data.xPosition, data.yPosition)
    });
    // when a new radius is set
    socket.on('new_radius', data => radius = data.radius);

    socket.emit('screen_size', { width: windowWidth, height: windowHeight });
    createCanvas(windowWidth, windowHeight);
    smooth();
    strokeWeight(10);
    stroke(50);
    angleMode(DEGREES);
    radius = windowHeight/2;
    frameRate(60);
}

/**
 * Ran every time a client disconnects from the room
 *
 * @param id : id of the paddle associated with a disconnected client
 */
function clientDisconnected(id) {
    // remove the paddle associated with the disconnected client
    paddles.splice(id, 1);
    // decrement the paddleId for all paddles after the removed paddle
    for(let i = id; i < paddles.length; i++) {
        paddles[i].setPaddleId(paddles[i].getPaddleId() - 1);
    }
}

function draw() {
    translate(windowWidth/2, radius);
    background(50);
    fill(250); circle(0, 0, radius);

    // draw all dividing lines
    var goalLength = 360/paddles.length;
    for(var i = 0; i < 360; i += goalLength) {
        const x = radius*sin(i);
        const y = radius*cos(i);
        line(0.95*x, 0.95*y, x, y);
    }
    paddles.forEach(paddle => paddle.display());
    ball.display();
}

function keyPressed() {
    if (keyCode === LEFT_ARROW) {
        paddles[paddleId].move(1);
    } else if (keyCode === RIGHT_ARROW) {
        paddles[paddleId].move(-1);
    }
}

function windowResized() {
    socket.emit('screen_size', { width: windowWidth, height: windowHeight });
    resizeCanvas(windowWidth, windowHeight);
    radius = windowHeight/2;
    background(50, 50, 50);
}

function newPlayerJoined() {
    paddles.push(new Paddle(paddles.length));
    // reset all paddle positions to 0 so a paddle isn't moved outside of collision bounds
    paddles.forEach(paddle => paddle.centerPosition = 0);
    // TODO: reset ball position to center, maybe a countdown before it is released
}
