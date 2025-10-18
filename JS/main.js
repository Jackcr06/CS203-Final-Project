// Pong Game Implementation using Phaser 3

// Game configuration object
const config = {
    type: Phaser.AUTO,           // Let Phaser choose WebGL or Canvas automatically
    width: 800,                  // Game width in pixels
    height: 600,                 // Game height in pixels
    parent: 'gameContainer',     // ID of the DOM element to add the canvas to
    backgroundColor: '#000000',  // Black background
    physics: {
        default: 'arcade',       // Using arcade physics system
        arcade: {
            gravity: { y: 0 },   // No gravity needed for Pong
            debug: false         // Set to true to see physics bodies
        }
    },
    scene: {
        preload: preload,        // Loading assets
        create: create,          // Setting up the game
        update: update          // Game loop
    }
};

// Initialize the game with our configuration
const game = new Phaser.Game(config);

// Game variables
let player;          // Left paddle (player controlled)
let ai;              // Right paddle (AI controlled)
let ball;            // Ball object
let playerScore = 0; // Player's score
let aiScore = 0;     // AI's score
let scoreText;       // Text display for score
let gameStarted = false; // Flag to track if game has started
let cursors;         // Keyboard input
let startText;       // Text to start the game

// Preload function - runs once at the start
function preload() {
    // No assets to preload for basic Pong
}

// Create function - runs once after preload
function create() {
    // Create the player paddle (left side)
    player = this.add.rectangle(50, 300, 20, 100, 0xFFFFFF);
    this.physics.add.existing(player, true); // true makes it static

    // Create the AI paddle (right side)
    ai = this.add.rectangle(750, 300, 20, 100, 0xFFFFFF);
    this.physics.add.existing(ai, true);

    // Create the ball
    ball = this.add.circle(400, 300, 10, 0xFFFFFF);
    this.physics.add.existing(ball);
    ball.body.setCollideWorldBounds(true);
    ball.body.setBounce(1, 1);

    // Set up keyboard input
    cursors = this.input.keyboard.createCursorKeys();

    // Add score text
    scoreText = this.add.text(400, 50, '0 - 0', {
        fontSize: '32px',
        fill: '#FFF'
    }).setOrigin(0.5);

    // Add start text
    startText = this.add.text(400, 300, 'Press SPACE to start', {
        fontSize: '24px',
        fill: '#FFF'
    }).setOrigin(0.5);

    // Add collision between ball and paddles
    this.physics.add.collider(ball, player, hitPaddle, null, this);
    this.physics.add.collider(ball, ai, hitPaddle, null, this);
}

// Update function - runs every frame
function update() {
    // Check for game start
    if (!gameStarted) {
        if (cursors.space.isDown) {
            startGame();
        }
        return;
    }

    // Player paddle movement (keyboard control)
    if (cursors.up.isDown) {
        movePaddle(player, -500);
    } else if (cursors.down.isDown) {
        movePaddle(player, 500);
    } else {
        player.body.setVelocityY(0);
    }

    // AI paddle movement
    const aiSpeed = 400;
    if (ball.y < ai.y) {
        movePaddle(ai, -aiSpeed);
    } else if (ball.y > ai.y) {
        movePaddle(ai, aiSpeed);
    } else {
        ai.body.setVelocityY(0);
    }

    // Check for scoring
    if (ball.x < 0) {
        aiScore++;
        resetBall(true);
    } else if (ball.x > 800) {
        playerScore++;
        resetBall(false);
    }

    // Update score display
    scoreText.setText(`${playerScore} - ${aiScore}`);
}

// Helper function to move paddles
function movePaddle(paddle, speed) {
    paddle.y += speed * (1/60); // Multiply by frame time for smooth movement
    // Keep paddle within bounds
    paddle.y = Phaser.Math.Clamp(paddle.y, 50, 550);
}

// Function to handle paddle hits
function hitPaddle(ball, paddle) {
    // Increase velocity with each hit
    ball.body.velocity.x *= 1.05;
    
    // Calculate new vertical velocity based on where ball hits paddle
    let diff = ball.y - paddle.y;
    ball.body.velocity.y = diff * 5;
}

// Function to start the game
function startGame() {
    gameStarted = true;
    startText.setVisible(false);
    resetBall(Math.random() >= 0.5);
}

// Function to reset the ball
function resetBall(isAiServing) {
    ball.setPosition(400, 300);
    
    // Reset ball velocity
    const velocity = 400;
    ball.body.setVelocity(
        isAiServing ? -velocity : velocity,
        (Math.random() - 0.5) * velocity
    );
}
