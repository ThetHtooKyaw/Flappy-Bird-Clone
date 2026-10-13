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
let spaceKey;

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
let isGameStarted = false;
let hasShownGameOver = false;
let hasLanded = false;
let hasCollided = false;

// Game Speed Variables
const playSpeed = 3;
const flyHeight = -250;
const fallSpeed = 4;
let lastFlapTime = 0;

// Score Variables
let scoreImage = [];
let score = 0;
let digitWidth = 30;

// Pillar Variables
let pillarGroup;
const pillarPairs = [];
const gapSize = 100;
let gapBetweenPillars = 300;

function preload() {
  // UI Assets
  this.load.image("text1", "assets/ui/text1.png");
  this.load.image("text2", "assets/ui/text2.png");
  this.load.image("play_button", "assets/ui/play_btn.png");
  for (let i = 0; i <= 9; i++) {
    this.load.image("num" + i, `assets/ui/num${i}.png`);
  }

  // Sound Assets
  this.load.audio("score", "assets/sounds/score.wav");
  this.load.audio("fly", "assets/sounds/wing.wav");
  this.load.audio("hit", "assets/sounds/hit.wav");
  this.load.audio("die", "assets/sounds/die.wav");

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

  // Input setup
  spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

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
      this.sound.play("hit");
      this.cameras.main.flash(100, 255, 255, 255);
      this.cameras.main.shake(100, 0.001);
      this.sound.play("die");
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
  road.setDepth(1);

  this.physics.add.overlap(bird, road, () => {
    if (!hasLanded) {
      hasLanded = true;
      if (!hasCollided) {
        this.sound.play("hit");
      }
      this.cameras.main.flash(100, 255, 255, 255);
      this.cameras.main.shake(100, 0.001);
    }
  });
  this.physics.add.collider(bird, road);

  // UI setup
  uiStepup(this);

  // Score setup
  updateScoreDisplay(this);
}

function update(time, delta) {
  // Bird Falling Animations
  if (bird.body.velocity.y > 0) {
    if (bird.angle < 90) {
      bird.angle += fallSpeed;
    }
  }

  if (spaceKey.isDown) {
    if (hasLanded || hasCollided) {
      retryGame(this);
      return;
    }

    if (!isGameStarted) {
      // UI Animations
      playBtn.setScale(0.9);
      this.time.delayedCall(100, () => playBtn.setScale(1.0));
      handleGameStart(this);
    } else if (time > lastFlapTime + 200) {
      bird.setVelocityY(flyHeight);
      bird.angle = -25;
      this.sound.play("fly");
      lastFlapTime = time;
    }
  }

  if (!hasLanded && !hasCollided) {
    // Game Object Animations
    background.tilePositionX += playSpeed;
    road.tilePositionX += playSpeed;

    if (isGameStarted) {
      pillarPairs.forEach((pair) => {
        if (pair.topPillar) {
          pair.topPillar.x -= playSpeed;
          pair.topPillar.setDepth(0);

          if (!pair.scored && pair.topPillar.x < bird.x) {
            pair.scored = true;
            score++;
            this.sound.play("score");
            updateScoreDisplay(this);
          }
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
      playBtn.setVisible(true);

      bird.anims.stop();
    }
  }
}

// Action Functions
function handleGameStart(scene) {
  playBtn.setVisible(false);
  playBtn.setDepth(2);
  text1.setVisible(false);
  text1.setDepth(2);
  text2.setVisible(false);
  text2.setDepth(2);

  isGameStarted = true;

  if (idleTween) {
    idleTween.stop();
  }

  bird.body.setAllowGravity(true);
}

function resetState() {
  pillarPairs.length = 0;
  score = 0;
  isGameStarted = false;
  hasShownGameOver = false;
  hasLanded = false;
  hasCollided = false;
}

function retryGame(scene) {
  scene.scene.restart();
}

function updateScoreDisplay(scene) {
  scoreImage.forEach((img) => img.destroy());
  scoreImage = [];

  const scoreStr = score.toString();
  const margin = 20;
  const startX =
    canvasWidth - margin - scoreStr.length * digitWidth + digitWidth / 2;

  for (let i = 0; i < scoreStr.length; i++) {
    let digit = scoreStr[i];

    let digitImage = scene.add.image(
      startX + i * digitWidth,
      40,
      "num" + digit,
    );
    digitImage.setDepth(2);
    scoreImage.push(digitImage);
  }
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

  return { topPillar: topP, bottomPillar: bottomP, scored: false };
}
