# Flappy Bird Clone

A browser-based Flappy Bird clone built with Phaser 3, JavaScript ES modules, and CSS. Guide the bird through randomly generated pillars, avoid collisions, and achieve the highest score possible.

---

## Features

- **Flappy Bird gameplay:** Control the bird as it flies through pillar gaps.
- **Random pillar generation:** New pillar pairs are generated continuously as the bird progresses.
- **Score tracking:** Earn points by passing pillars.
- **Best score tracking:** The highest score from the current session is displayed on the game-over screen.
- **Responsive canvas:** Phaser's `FIT` scale mode adapts the game to desktop and mobile screen sizes.
- **Multiple input methods:** Play with the Space key, mouse clicks, or mobile touch input.
- **Animated game-over screen:** Displays the current score and best score with transitions.
- **Sound effects:** Includes sounds for flapping, scoring, collisions, and game over.
- **Collision effects:** Camera flash and shake effects provide feedback when the bird hits an obstacle.
- **Modular JavaScript:** Game setup, road and pillar creation, UI, and score rendering are separated into components.

---

## Controls

| Action | Desktop | Mobile |
| --- | --- | --- |
| Start the game | Press **Space** or click | Tap |
| Flap the bird | Press **Space** or click | Tap |
| Restart after game over | Press **Space** or click the play button | Tap the play button |

---

## Project Structure

```text
flappy_bird/
├── index.html                 # Main HTML document
├── css/
│   └── main.css               # Responsive page and canvas styles
├── js/
│   ├── main.js                # Phaser game configuration and game loop
│   └── components/
│       ├── score.js            # Score and scoreboard rendering
│       └── set_up.js           # Bird, pillar, road, and UI setup
└── assets/
    ├── images/                # Background, road, and pillar images
    ├── sounds/                # Gameplay sound effects
    ├── sprites/               # Bird animation frames
    └── ui/                    # Buttons, labels, scoreboard, and digits
```

---

## Tech Stack

- **Markup:** HTML5
- **Styling:** CSS3
- **Game engine:** Phaser 3.55.2
- **Scripting:** Vanilla JavaScript with ES modules
- **Physics:** Phaser Arcade Physics
- **Deployment:** Vercel

---

## Getting Started

**Clone the repository:**

    ```sh
    git clone https://github.com/ThetHtooKyaw/Flappy-Bird-Clone.git
    cd Flappy-Bird-Clone
    ```

### Run the game locally

Because the project uses JavaScript modules, open it through a local web server instead of opening `index.html` directly with `file://`.

For example, with the VS Code Live Server extension:

1. Open the project folder in VS Code.
2. Open `index.html`.
3. Select **Open with Live Server**.
4. Open the local URL provided by the extension.

You can also use any other static local server.

---

## Gameplay

The game uses a fixed internal resolution of `500 × 600` pixels. Phaser scales the canvas to fit the available viewport while preserving the game's aspect ratio.

The bird starts in an idle animation. Starting the game enables gravity, and each valid input applies an upward velocity. Pillars move from right to left, and the player earns a point each time the bird passes a pillar pair.

Hitting a pillar or the road ends the run. Collision sounds and camera effects play once, followed by the animated game-over screen with the current score and best score.

---

## License

This project is for personal portfolio and learning purposes.

Feel free to explore and adapt it for your own learning.

---

## About

Built and maintained by Tony Johnson.