const canvasWidth = 500;
const canvasHeight = 600;

let config = {
  renderer: Phaser.AUTO,
  width: canvasWidth,
  height: canvasHeight,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 1000 },
      debug: false,
    },
  },
  scene: {
    preload: preload,
    create: create,
    update: update,
  },
};

let game = new Phaser.Game(config);

// Input Key Variables
let cursors;

// UI Object Variables
let text1;
let text2;
let playBtn;

// Game Object Variables
let background;
let topPillar;
let bottomPillar;
let road;
let bird;
let idleTween;

// Game State Variables
const flySpeed = -200;
const playSpeed = 1.5;
let score = 0;
let instructionMsg;

// Update Function Variables
let isGameStarted = false;
let hasShownGameOver = false;
let hasLanded = false;
let hasCollided = false;

// Pillar Function Variables
let pillarGroup;
const pillarPairs = [];
const gapSize = 100;
let gapBetweenPillars = 300;

function preload() {
  // UI Assets
  this.load.image("text1", "assets/ui/text1.png");
  this.load.image("text2", "assets/ui/text2.png");
  this.load.image("play_button", "assets/ui/play_btn.png");

  // Game Object Assets
  this.load.image("background", "assets/images/bg1.png");
  this.load.image("top_pillar", "assets/images/top_pillar1.png");
  this.load.image("bottom_pillar", "assets/images/bottom_pillar1.png");
  this.load.image("road", "assets/images/road.png");

  // Sprite Assets
  this.load.image("bird_up", "assets/sprites/bird_wu1.png");
  this.load.image("bird_mid", "assets/sprites/bird_wm1.png");
  this.load.image("bird_down", "assets/sprites/bird_wd1.png");
}

function create() {
  resetState();

  cursors = this.input.keyboard.createCursorKeys();

  // Background setup
  background = this.add
    .tileSprite(0, 0, canvasWidth, canvasHeight, "background")
    .setOrigin(0, 0);

  // Bird setup
  birdStepup(this);

  // Pillars setup
  pillarGroup = this.physics.add.group({
    allowGravity: false,
    immovable: true,
  });
  this.physics.add.overlap(bird, pillarGroup, () => {
    if (!hasCollided) {
      hasCollided = true;
      this.cameras.main.flash(100, 255, 255, 255);
      this.cameras.main.shake(100, 0.001);
    }
  });

  for (let i = 0; i < 3; i++) {
    const pair = createRandomPillars(this, 600 + i * gapBetweenPillars);
    pillarPairs.push(pair);
  }

  // Road setup
  road = this.add
    .tileSprite(250, 560, canvasWidth, 100, "road")
    .setOrigin(0.5, 0.5);
  this.physics.add.existing(road, true);

  this.physics.add.overlap(bird, road, () => (hasLanded = true));
  this.physics.add.collider(bird, road);

  // UI setup
  uiStepup(this);

  // Score setup
  // instructionMsg = this.add.text(0, 0, "Press 'SPACE' to start the game", {
  //   fontFamily: '"Comic Sans MS", Times, serif',
  //   fontSize: "20px",
  //   color: "white",
  //   backgroundColor: "black",
  // });
  // Phaser.Display.Align.In.BottomCenter(instructionMsg, background, 0, 50);
}

function update() {
  // Bird Falling Animations
  if (bird.body.velocity.y > 0) {
    if (bird.angle < 90) {
      bird.angle += 4;
    }
  }

  if (cursors.space.isDown) {
    if (hasLanded || hasCollided) {
      retryGame(this);
      return;
    }

    // UI Animations
    playBtn.setScale(0.9);
    this.time.delayedCall(100, () => playBtn.setScale(1.0));
    handleGameStart();
  }

  if (!hasLanded && !hasCollided) {
    // Game Object Animations
    background.tilePositionX += playSpeed;
    road.tilePositionX += playSpeed;
    road.setDepth(1);

    if (isGameStarted) {
      pillarPairs.forEach((pair) => {
        if (pair.topPillar) {
          pair.topPillar.x -= playSpeed;
          pair.topPillar.setDepth(0);
        }

        if (pair.bottomPillar) {
          pair.bottomPillar.x -= playSpeed;
          pair.bottomPillar.setDepth(0);
        }
      });

      // New Pillar Generation
      const lastPair = pillarPairs[pillarPairs.length - 1];
      const lastX = lastPair.topPillar
        ? lastPair.topPillar.x
        : lastPair.bottomPillar.x;

      if (lastX < gapBetweenPillars + 50) {
        const newpair = createRandomPillars(this, lastX + gapBetweenPillars);
        pillarPairs.push(newpair);

        const oldPair = pillarPairs.shift();
        if (oldPair.topPillar) {
          oldPair.topPillar.destroy();
        }
        if (oldPair.bottomPillar) {
          oldPair.bottomPillar.destroy();
        }
      }
    }
  } else if (hasLanded || hasCollided) {
    if (!hasShownGameOver) {
      hasShownGameOver = true;
      text2.setVisible(true);
      text2.setDepth(2);
      playBtn.setVisible(true);

      bird.anims.stop();
    }
  }
}

// Action Functions
function handleGameStart() {
  playBtn.setVisible(false);
  text1.setVisible(false);
  text2.setVisible(false);

  isGameStarted = true;

  if (idleTween) {
    idleTween.stop();
  }

  bird.body.setAllowGravity(true);
  bird.setVelocityY(flySpeed);
  bird.angle = -25;
}

function resetState() {
  pillarPairs.length = 0;
  hasLanded = false;
  hasCollided = false;
  hasShownGameOver = false;
  isGameStarted = false;
}

function retryGame(scene) {
  scene.scene.restart();
}

// Setup Functions
function uiStepup(scene) {
  text1 = scene.add.image(250, 200, "text1");
  text1.setVisible(true);
  text2 = scene.add.image(250, 200, "text2");
  text2.setVisible(false);
  // text2.setAlpha(0);

  playBtn = scene.add.image(250, 380, "play_button");
  playBtn.setInteractive();
  playBtn.on("pointerdown", () => {
    playBtn.setScale(0.9);
  });

  playBtn.on("pointerup", () => {
    playBtn.setScale(1.0);

    if (hasLanded || hasCollided) {
      retryGame(scene);
    } else {
      handleGameStart();
    }
  });
}

function birdStepup(scene) {
  bird = scene.physics.add.sprite(250, 280, "bird_mid");

  // Animation
  scene.anims.create({
    key: "fly",
    frames: [{ key: "bird_up" }, { key: "bird_mid" }, { key: "bird_down" }],
    frameRate: 10,
    repeat: -1,
  });

  idleTween = scene.tweens.add({
    targets: bird,
    y: bird.y + 15,
    duration: 600,
    yoyo: true,
    repeat: -1,
    ease: "Sine.easeInOut",
  });

  bird.play("fly");
  bird.setCollideWorldBounds(true);
  bird.body.setAllowGravity(false);
  bird.setDepth(10);
}

function createRandomPillars(scene, x) {
  const gapY = Phaser.Math.Between(100, 400 - gapSize);

  const topP = scene.physics.add
    .sprite(x, gapY, "top_pillar")
    .setOrigin(0.5, 1)
    .setScale(1, 1.5);

  const bottomP = scene.physics.add
    .sprite(x, gapY + gapSize, "bottom_pillar")
    .setOrigin(0.5, 0)
    .setScale(1, 1.5);

  pillarGroup.add(topP);
  pillarGroup.add(bottomP);

  return { topPillar: topP, bottomPillar: bottomP };
}
