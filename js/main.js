import {
  uiSetup,
  birdSetup,
  createRandomPillars,
  roadSetup,
} from "./components/set_up.js";

import {
  updateScoreDisplay,
  displayBestScore,
  displayScoreBoard,
} from "./components/score.js";

const canvasWidth = 500;
const canvasHeight = 600;

let config = {
  renderer: Phaser.AUTO,
  parent: "canvas",
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

new Phaser.Game(config);

// Input Key Variables
let spaceKey;

// UI Object Variables
let text1;
let text2;
let scoreBoard;
let playBtn;
const gameOverAnimDur = 600;

// Score Variables
let scoreImage = [];
let bestScoreImage = [];
let scoreBoardImage = [];
let bestScore = 0;
let score = 0;

// Game Object Variables
let background;
let road;
let bird;
let idleTween;

// Pillar Variables
let pillarGroup;
const pillarPairs = [];
const entranceSize = 100;
let spaceBetweenPillars = 250;

// Game Speed Variables
const playSpeed = 3;
const flyHeight = -250;
const fallSpeed = 4;
let lastFlapTime = 0;

// Game State Variables
let isGameStarted = false;
let isGameOver = false;
let canRestart = false;
let hasLanded = false;
let hasCollided = false;

function preload() {
  // UI Assets
  this.load.image("text1", "assets/ui/text1.png");
  this.load.image("text2", "assets/ui/text2.png");
  this.load.image("score_board", "assets/ui/score_board.png");
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
  this.input.on("pointerdown", () => {
    if (isGameStarted && !hasLanded && !hasCollided) {
      flap(this);
    }
  });

  // Background setup
  background = this.add
    .tileSprite(0, 0, canvasWidth, canvasHeight, "background")
    .setOrigin(0, 0);

  // Bird setup
  let birdObj = birdSetup(this);
  bird = birdObj.bird;
  idleTween = birdObj.idleTween;

  // Pillars setup
  pillarGroup = this.physics.add.group({
    allowGravity: false,
    immovable: true,
  });
  this.physics.add.overlap(bird, pillarGroup, () => {
    if (!hasCollided) {
      hasCollided = true;
      this.sound.play("hit");
      this.sound.play("die");
      this.cameras.main.flash(200, 255, 255, 255);
      this.cameras.main.shake(300, 0.009);
      triggerGameOver(this);
    }
  });

  for (let i = 0; i < 3; i++) {
    const pair = createRandomPillars(this, {
      x: 600 + i * spaceBetweenPillars,
      pillarGroup,
      entranceSize,
    });
    pillarPairs.push(pair);
  }

  // Road setup
  road = roadSetup(this, {
    canvasWidth,
    bird,
    hasLanded: () => hasLanded,
    setLanded: () => {
      hasLanded = true;
    },
    hasCollided: () => hasCollided,
    triggerGameOver: () => triggerGameOver(this),
  });

  // UI setup
  let uiObj = uiSetup(this, {
    failCondition: () => hasLanded || hasCollided,
    handleGameStart: () => handleGameStart(),
    retryGame: () => retryGame(this),
  });
  text1 = uiObj.text1;
  text2 = uiObj.text2;
  scoreBoard = uiObj.scoreBoard;
  playBtn = uiObj.playBtn;

  // Score setup
  updateScoreDisplay(this, { scoreImage, score, canvasWidth });
}

function flap(scene) {
  if (hasLanded || hasCollided) {
    return;
  }

  if (!isGameStarted) {
    handleGameStart();
    return;
  }

  const now = scene.time.now;

  if (now <= lastFlapTime + 200) {
    bird.setVelocityY(flyHeight);
    bird.angle = -25;
    this.sound.play("fly");
    lastFlapTime = time;
  }
}

function update(time) {
  if (spaceKey.isDown) {
    if (hasLanded || hasCollided) {
      if (canRestart) retryGame(this);
      return;
    }

    if (!isGameStarted) {
      // UI Animations
      playBtn.setScale(0.9);
      this.time.delayedCall(100, () => playBtn.setScale(1.0));
      handleGameStart();
    } else if (time > lastFlapTime + 200) {
      // Bird Fly Mechanics
      bird.setVelocityY(flyHeight);
      bird.angle = -25;
      this.sound.play("fly");
      lastFlapTime = time;
    }
  }

  // Bird Falling Animations
  if (bird.body.velocity.y > 0) {
    if (bird.angle < 90) {
      bird.angle += fallSpeed;
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
            updateScoreDisplay(this, { scoreImage, score, canvasWidth });

            if (score > bestScore) {
              bestScore = score;
            }
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

      if (lastX < spaceBetweenPillars + 50) {
        const newpair = createRandomPillars(this, {
          x: lastX + spaceBetweenPillars,
          pillarGroup,
          entranceSize,
        });
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
}

function resetState() {
  pillarPairs.length = 0;
  score = 0;
  isGameStarted = false;
  isGameOver = false;
  canRestart = false;
  hasLanded = false;
  hasCollided = false;
}

function retryGame(scene) {
  scene.scene.restart();
}

function triggerGameOver(scene) {
  if (isGameOver) {
    return;
  }

  isGameOver = true;

  scene.time.delayedCall(400, () => {
    showGameOverUI(scene);
  });
}

function showGameOverUI(scene) {
  text2.setAlpha(0);
  text2.setVisible(true);

  scoreBoard.y = canvasHeight + 60;
  scoreBoard.setVisible(true);

  playBtn.y = canvasHeight + 120;
  playBtn.setVisible(true);
  playBtn.disableInteractive();

  scene.tweens.add({
    targets: text2,
    alpha: 1,
    duration: gameOverAnimDur,
    ease: "Sine.easeInOut",
  });

  scene.tweens.add({
    targets: scoreBoard,
    y: 300,
    duration: gameOverAnimDur,
    ease: "Sine.easeInOut",
  });

  displayBestScore(scene, { bestScoreImage, bestScore });
  displayScoreBoard(scene, { scoreBoardImage, score });

  scene.tweens.add({
    targets: playBtn,
    y: 400,
    duration: gameOverAnimDur,
    ease: "Sine.easeInOut",
    onComplete: () => {
      playBtn.setInteractive();
      canRestart = true;
    },
  });

  bird.anims.stop();
}
