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

// Game State Variables
const flySpeed = -170;
const playSpeed = 1.5;
let score = 0;
let instructionMsg;

// Update Function Variables
let isGameStarted = false;
let hasLanded = false;
let hasCollided = false;

// Pillar Function Variables
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
  cursors = this.input.keyboard.createCursorKeys();

  // Background setup
  background = this.add
    .tileSprite(0, 0, canvasWidth, canvasHeight, "background")
    .setOrigin(0, 0);

  // Bird setup
  this.anims.create({
    key: "fly",
    frames: [{ key: "bird_up" }, { key: "bird_mid" }, { key: "bird_down" }],
    frameRate: 10,
    repeat: -1,
  });
  bird = this.physics.add.sprite(250, 280, "bird_mid");
  bird.play("fly");
  bird.setBounce(0.2);
  bird.setCollideWorldBounds(true);
  bird.body.setAllowGravity(false);

  // Pillars setup
  for (let i = 0; i < 3; i++) {
    // TODO: gapBetweenPillars must be dyanmic base on distance progress
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

  // Instructions setup
  uiStepup(this);

  // instructionMsg = this.add.text(0, 0, "Press 'SPACE' to start the game", {
  //   fontFamily: '"Comic Sans MS", Times, serif',
  //   fontSize: "20px",
  //   color: "white",
  //   backgroundColor: "black",
  // });
  // Phaser.Display.Align.In.BottomCenter(instructionMsg, background, 0, 50);
}

function createRandomPillars(scene, x) {
  const gapY = Phaser.Math.Between(80, 550 - gapSize);

  topPillar = scene.physics.add
    .staticImage(x, gapY, "top_pillar")
    .setOrigin(0.5, 1)
    .setScale(1, 1.5);
  bottomPillar = scene.physics.add
    .staticImage(x, gapY + gapSize, "bottom_pillar")
    .setOrigin(0.5, 0)
    .setScale(1, 1.5);

  scene.physics.add.overlap(bird, topPillar, () => (hasCollided = true));
  scene.physics.add.collider(bird, topPillar);
  scene.physics.add.overlap(bird, bottomPillar, () => (hasCollided = true));
  scene.physics.add.collider(bird, bottomPillar);

  return { topPillar, bottomPillar };
}

function uiStepup(scene) {
  text1 = scene.add.image(250, 200, "text1");
  text1.setVisible(true);
  text2 = scene.add.image(250, 200, "text2");
  text2.setVisible(false);

  playBtn = scene.add.image(250, 380, "play_button");
  playBtn.setInteractive();
  playBtn.on("pointerdown", () => {
    playBtn.setScale(0.9);
  });

  playBtn.on("pointerup", () => {
    playBtn.setScale(1.0);
    handleGameStart();
  });
}

function handleGameStart() {
  playBtn.setVisible(false);
  text1.setVisible(false);

  isGameStarted = true;

  bird.body.setAllowGravity(true);
  bird.setVelocityY(flySpeed);
}

function update() {
  if (!hasLanded && !hasCollided) {
    // Game Object Animations
    background.tilePositionX += playSpeed;
    road.tilePositionX += playSpeed;
    road.setDepth(1);

    if (isGameStarted) {
      pillarPairs.forEach((pair) => {
        if (pair.topPillar) {
          pair.topPillar.x -= playSpeed;
          pair.topPillar.refreshBody();
        }

        if (pair.bottomPillar) {
          pair.bottomPillar.x -= playSpeed;
          pair.bottomPillar.refreshBody();
          bottomPillar.setDepth(0);
        }
      });

      // New Pillar Generation
      const lastPair = pillarPairs[pillarPairs.length - 1];
      if (lastPair.topPillar.x < gapBetweenPillars + 50) {
        const newpair = createRandomPillars(
          this,
          lastPair.topPillar.x + gapBetweenPillars,
        );
        pillarPairs.push(newpair);
        pillarPairs.shift();
      }
    }
  } else if (hasLanded || hasCollided) {
    text2.setVisible(true);
    text2.setDepth(2);
  }

  if (cursors.space.isDown && !hasLanded && !hasCollided) {
    // UI Animations
    playBtn.setScale(0.9);
    this.time.delayedCall(100, () => playBtn.setScale(1.0));
    handleGameStart();
  }
}
