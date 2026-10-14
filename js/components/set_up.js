export function uiSetup(scene, { failCondition, handleGameStart, retryGame }) {
  const text1 = scene.add.image(250, 200, "text1");
  text1.setVisible(true);
  text1.setDepth(2);

  const text2 = scene.add.image(250, 200, "text2");
  text2.setVisible(false);
  text2.setDepth(2);

  const scoreBoard = scene.add.image(250, 260, "score_board");
  scoreBoard.setVisible(false);
  scoreBoard.setDepth(2);

  const playBtn = scene.add.image(250, 380, "play_button");
  playBtn.setVisible(true);
  playBtn.setInteractive();
  playBtn.setDepth(2);

  // Button Interactions
  playBtn.on("pointerdown", () => {
    playBtn.setScale(0.9);
  });

  playBtn.on("pointerup", () => {
    playBtn.setScale(1.0);

    if (failCondition()) {
      retryGame(scene);
    } else {
      handleGameStart();
    }
  });

  return { text1, text2, scoreBoard, playBtn };
}

export function birdSetup(scene) {
  const bird = scene.physics.add.sprite(250, 280, "bird_mid");

  // Animation
  scene.anims.create({
    key: "fly",
    frames: [{ key: "bird_up" }, { key: "bird_mid" }, { key: "bird_down" }],
    frameRate: 10,
    repeat: -1,
  });

  const idleTween = scene.tweens.add({
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

  return { bird, idleTween };
}

export function createRandomPillars(scene, { x, pillarGroup, entranceSize }) {
  const gapY = Phaser.Math.Between(100, 400 - entranceSize);

  const topP = scene.physics.add
    .sprite(x, gapY, "top_pillar")
    .setOrigin(0.5, 1)
    .setScale(1, 1.5);

  const bottomP = scene.physics.add
    .sprite(x, gapY + entranceSize, "bottom_pillar")
    .setOrigin(0.5, 0)
    .setScale(1, 1.5);

  pillarGroup.add(topP);
  pillarGroup.add(bottomP);

  return { topPillar: topP, bottomPillar: bottomP, scored: false };
}

export function roadSetup(
  scene,
  { canvasWidth, bird, hasLanded, setLanded, hasCollided },
) {
  const road = scene.add
    .tileSprite(250, 560, canvasWidth, 100, "road")
    .setOrigin(0.5, 0.5);
  scene.physics.add.existing(road, true);
  road.setDepth(1);

  scene.physics.add.overlap(bird, road, () => {
    if (!hasLanded()) {
      setLanded();
      if (!hasCollided()) {
        scene.sound.play("hit");
        scene.cameras.main.flash(100, 255, 255, 255);
        scene.cameras.main.shake(100, 0.001);
      }
    }
  });
  scene.physics.add.collider(bird, road);

  return road;
}
