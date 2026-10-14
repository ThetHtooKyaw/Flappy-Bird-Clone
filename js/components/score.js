export function updateScoreDisplay(scene, { scoreImage, score, canvasWidth }) {
  scoreImage.forEach((img) => img.destroy());
  scoreImage.length = 0;

  const scoreStr = score.toString();
  const margin = 20;
  const digitWidth = 30;
  const startX =
    canvasWidth - margin - scoreStr.length * digitWidth + digitWidth / 2;

  for (let i = 0; i < scoreStr.length; i++) {
    let digitImage = scene.add.image(
      startX + i * digitWidth,
      40,
      "num" + scoreStr[i],
    );
    digitImage.setDepth(2);
    scoreImage.push(digitImage);
  }
}

export function displayBestScore(scene, { bestScoreImage, bestScore }) {
  renderNumbers(scene, bestScore, 328, bestScoreImage);
}

export function displayScoreBoard(scene, { scoreBoardImage, score }) {
  renderNumbers(scene, score, 286, scoreBoardImage);
}

function renderNumbers(scene, value, y, imageArray) {
  imageArray.forEach((img) => img.destroy());
  imageArray.length = 0;

  const scoreStr = value.toString();
  const digitWidth = 15;
  const scoreX = 342;
  const startX = scoreX - (scoreStr.length * digitWidth) / 2;

  for (let i = 0; i < scoreStr.length; i++) {
    const digitImage = scene.add.image(
      startX + i * digitWidth,
      y,
      "num" + scoreStr[i],
    );

    digitImage.setScale(0.5);
    digitImage.setDepth(2);

    digitImage.setAlpha(0);

    scene.tweens.add({
      targets: digitImage,
      alpha: 1,
      duration: 600,
      ease: "Sine.easeInOut",
    });

    imageArray.push(digitImage);
  }
}
