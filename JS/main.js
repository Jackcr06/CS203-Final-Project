// Pong Game Implementation using Phaser 3
// A modern implementation of the classic Pong game with enhanced features

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

// Game constants
const PADDLE_SPEED = 500;
const BALL_START_VELOCITY = 400;
const BALL_VELOCITY_INCREMENT = 1.1;
const MAX_SCORE = 5;
const PADDLE_EDGE_DISTANCE = 50;
const WINNING_SCORE = 5;

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
let centerLine;      // Center line for visual division
let gameState = 'waiting'; // waiting, playing, ended
let winText;         // Text to show winner

// Preload function - runs once at the start
function preload() {
    // No assets to preload for basic Pong
}

// Create function - runs once after preload
function create() {
    // Create center line for visual division
    createCenterLine(this);
    
    // Create the player paddle (left side)
    player = this.add.rectangle(PADDLE_EDGE_DISTANCE, 300, 20, 100, 0xFFFFFF);
    this.physics.add.existing(player);
    player.body.setImmovable(true);
    player.body.setCollideWorldBounds(true);

    // Create the AI paddle (right side)
    ai = this.add.rectangle(config.width - PADDLE_EDGE_DISTANCE, 300, 20, 100, 0xFFFFFF);
    this.physics.add.existing(ai);
    ai.body.setImmovable(true);
    ai.body.setCollideWorldBounds(true);

    // Create the ball with a glowing effect
    ball = this.add.circle(400, 300, 10, 0x00ff00);
    this.physics.add.existing(ball);
    ball.body.setCollideWorldBounds(true);
    ball.body.setBounce(1, 1);
    ball.body.setMaxVelocity(1000, 1000);

    // Set up keyboard input
    cursors = this.input.keyboard.createCursorKeys();

    // Add score text with enhanced styling
    scoreText = this.add.text(400, 50, '0 - 0', {
        fontSize: '48px',
        fill: '#FFF',
        fontFamily: 'Arial',
        fontStyle: 'bold'
    }).setOrigin(0.5);

    // Add start text with animation
    startText = this.add.text(400, 300, 'Press SPACE to Start', {
        fontSize: '32px',
        fill: '#0f0',
        fontFamily: 'Arial',
        fontStyle: 'bold'
    }).setOrigin(0.5);

    // Create win text (hidden initially)
    winText = this.add.text(400, 200, '', {
        fontSize: '64px',
        fill: '#0f0',
        fontFamily: 'Arial',
        fontStyle: 'bold'
    }).setOrigin(0.5).setVisible(false);

    // Animate start text
    this.tweens.add({
        targets: startText,
        alpha: 0.5,
        yoyo: true,
        repeat: -1,
        duration: 800
    });

    // Add collision between ball and paddles with sound
    this.physics.add.collider(ball, player, hitPaddle, null, this);
    this.physics.add.collider(ball, ai, hitPaddle, null, this);

    // Initialize game state
    gameState = 'waiting';

    // Add space key handler with proper key up/down detection
    this.input.keyboard.on('keydown-SPACE', function (event) {
        if (gameState === 'waiting' || gameState === 'ended') {
            startGame();
        }
    });
}

// Update function - runs every frame
function update() {
    // Debug game state
    // console.log('Current game state:', gameState);

    if (gameState === 'playing') {
        // Player paddle movement with smooth acceleration
        if (cursors.up.isDown) {
            movePaddle(player, -PADDLE_SPEED);
        } else if (cursors.down.isDown) {
            movePaddle(player, PADDLE_SPEED);
        } else {
            // Add smooth deceleration
            player.body.setVelocityY(player.body.velocity.y * 0.8);
        }

        // Enhanced AI paddle movement with prediction
        const prediction = predictBallPosition();
        const aiSpeed = PADDLE_SPEED * 0.8; // Make AI slightly slower than player
        
        if (prediction < ai.y - 10) {
            movePaddle(ai, -aiSpeed);
        } else if (prediction > ai.y + 10) {
            movePaddle(ai, aiSpeed);
        } else {
            ai.body.setVelocityY(ai.body.velocity.y * 0.8);
        }

        // Check for scoring
        if (ball.x <= 0) {
            aiScore++;
            if (!checkWin()) {
                resetBall(true);
                updateScoreText();
            }
        } else if (ball.x >= config.width) {
            playerScore++;
            if (!checkWin()) {
                resetBall(false);
                updateScoreText();
            }
        }
    }
}

// Helper function to predict ball position for AI
function predictBallPosition() {
    if (ball.body.velocity.x > 0) {
        // Only predict when ball is moving towards AI
        const timeToIntercept = (config.width - PADDLE_EDGE_DISTANCE - ball.x) / ball.body.velocity.x;
        return ball.y + (ball.body.velocity.y * timeToIntercept);
    }
    return ball.y;
}

// Add debug info display
const debugText = {
    create: function(scene) {
        this.text = scene.add.text(16, 16, '', { fontSize: '18px', fill: '#fff' });
        this.update();
    },
    update: function() {
        this.text.setText([
            'Game State: ' + gameState,
            'Ball velocity X: ' + (ball ? ball.body.velocity.x : 'N/A'),
            'Ball velocity Y: ' + (ball ? ball.body.velocity.y : 'N/A')
        ]);
    }
};
}

// Helper function to move paddles
function movePaddle(paddle, speed) {
    paddle.body.setVelocityY(speed);
    // Keep paddle within bounds
    paddle.y = Phaser.Math.Clamp(paddle.y, 50, 550);
}

// Function to handle paddle hits with improved physics and visual feedback
function hitPaddle(ball, paddle) {
    // Change ball color on hit for visual feedback
    ball.setFillStyle(0x00ffff);
    setTimeout(() => ball.setFillStyle(0x00ff00), 100);
    
    // Increase velocity with each hit
    ball.body.velocity.x *= BALL_VELOCITY_INCREMENT;
    
    // Calculate new vertical velocity based on where ball hits paddle
    let diff = ball.y - paddle.y;
    ball.body.velocity.y = diff * 7; // Increased factor for more dynamic angles
    
    // Add slight spin effect
    const spin = (Math.random() - 0.5) * 100;
    ball.body.velocity.y += spin;
}

// Function to start the game
function startGame() {
    console.log('Game starting...'); // Debug log
    gameState = 'playing';
    startText.setVisible(false);
    
    // Reset scores at start of new game
    playerScore = 0;
    aiScore = 0;
    updateScoreText();
    
    // Make sure paddles are in starting positions
    player.y = config.height / 2;
    ai.y = config.height / 2;
    
    // Reset ball with random direction
    resetBall(Math.random() >= 0.5);
}

// Function to update score display with animation
function updateScoreText() {
    scoreText.setText(`${playerScore} - ${aiScore}`);
    scoreText.setScale(1.2);
    setTimeout(() => scoreText.setScale(1), 200);
}

// Function to create the center line
function createCenterLine(scene) {
    const centerLine = scene.add.graphics();
    centerLine.lineStyle(3, 0xFFFFFF, 0.4);
    
    // Draw dashed line
    for (let y = 0; y < config.height; y += 30) {
        centerLine.moveTo(config.width / 2, y);
        centerLine.lineTo(config.width / 2, y + 15);
    }
}

// Function to check for game win
function checkWin() {
    if (playerScore >= WINNING_SCORE || aiScore >= WINNING_SCORE) {
        gameState = 'ended';
        const winner = playerScore >= WINNING_SCORE ? 'PLAYER WINS!' : 'AI WINS!';
        winText.setText(winner);
        winText.setVisible(true);
        startText.setText('Press SPACE to Play Again');
        startText.setVisible(true);
        return true;
    }
    return false;
}

// Function to reset the game
function resetGame() {
    playerScore = 0;
    aiScore = 0;
    updateScoreText();
    winText.setVisible(false);
    gameState = 'playing';
}

// Function to reset the ball with improved physics
function resetBall(isAiServing) {
    // Reset ball to center with visual feedback
    ball.setPosition(400, 300);
    ball.body.setVelocity(0, 0);
    
    // Add a small delay before launching the ball
    setTimeout(() => {
        if (gameState !== 'playing') return;
        
        // Calculate launch angle
        const velocity = BALL_START_VELOCITY;
        const angleRange = Math.PI / 4; // 45 degrees
        const angle = (Math.random() - 0.5) * angleRange;
        
        // Set ball velocity with direction
        ball.body.setVelocity(
            isAiServing ? -velocity * Math.cos(angle) : velocity * Math.cos(angle),
            velocity * Math.sin(angle)
        );

        // Add visual feedback
        ball.setFillStyle(0x00ff00);
    }, 1000); // 1 second delay
}
