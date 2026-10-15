/* Kitchen Dash — Phaser 3
 * One-screen arcade game built with vector graphics (no image assets needed).
 * Gameplay: move the chef between lanes, collect ingredients, avoid hazards.
 */
(() => {
  "use strict";

  const W = 900;
  const H = 560;
  const COLORS = {
    bg: 0x101a2d, floor: 0x18273d, tile: 0x20334b,
    white: 0xf6f8ff, muted: 0xa8b5cc, lime: 0xb8f36b,
    coral: 0xff7e78, gold: 0xffd166, aqua: 0x63d9c0,
    purple: 0xa995ff, dark: 0x102039
  };

  class KitchenDash extends Phaser.Scene {
    constructor() {
      super("KitchenDash");
      this.score = 0;
      this.best = Number(localStorage.getItem("kitchenDashBest") || 0);
      this.lane = 1;
      this.speed = 230;
      this.elapsed = 0;
      this.spawnTimer = 0;
      this.isOver = false;
      this.items = [];
      this.particles = [];
      this.keys = null;
      this.touchSide = null;
    }

    create() {
      this.isOver = false;
      this.score = 0;
      this.elapsed = 0;
      this.spawnTimer = 0;
      this.speed = 230;
      this.lane = 1;
      this.items = [];
      this.particles = [];
      this.makeBackdrop();
      this.makeHUD();
      this.makeChef();
      this.makeKeyboard();
      this.makeTouchControls();
      this.showIntro();
      this.events.once("shutdown", () => {
        this.input.off("pointerdown", this.handlePointer, this);
      });
    }

    makeBackdrop() {
      this.cameras.main.setBackgroundColor(COLORS.bg);
      const g = this.add.graphics();
      g.fillStyle(COLORS.floor, 1);
      g.fillRoundedRect(30, 24, W - 60, H - 48, 24);
      // Three lanes and a subtle perspective tile pattern.
      const laneW = 220;
      const startX = 230;
      for (let i = 0; i < 3; i++) {
        const x = startX + i * laneW;
        g.fillStyle(i % 2 ? 0x1b2d43 : 0x1d3047, 1);
        g.fillRoundedRect(x, 105, laneW - 8, 390, 16);
        g.lineStyle(1, 0x36506a, 0.35);
        for (let y = 130; y < 490; y += 58) {
          g.beginPath(); g.moveTo(x + 10, y); g.lineTo(x + laneW - 18, y); g.strokePath();
        }
      }
      // Decorative counter top.
      g.fillStyle(0x253b52, 1);
      g.fillRoundedRect(54, 52, W - 108, 42, 14);
      g.fillStyle(COLORS.lime, 1);
      g.fillRoundedRect(68, 65, 5, 16, 2);
      this.add.text(85, 61, "SERVICE RUN  /  SHIFT 01", {
        fontFamily: "Arial, sans-serif", fontSize: "12px", fontStyle: "bold",
        color: "#b8f36b", letterSpacing: 2
      });
      this.add.text(W - 72, 61, "HOT LINE", {
        fontFamily: "Arial, sans-serif", fontSize: "10px", fontStyle: "bold",
        color: "#a8b5cc", letterSpacing: 1
      }).setOrigin(1, 0);
      // Tiny decorative ingredients on the counter.
      this.add.text(95, 124, "🥕", { fontSize: "24px" }).setAlpha(0.4);
      this.add.text(W - 118, 124, "🌿", { fontSize: "24px" }).setAlpha(0.4);
    }

    makeHUD() {
      this.scoreLabel = this.add.text(62, 121, "SCORE", {
        fontFamily: "Arial, sans-serif", fontSize: "10px", fontStyle: "bold",
        color: "#a8b5cc", letterSpacing: 2
      });
      this.scoreText = this.add.text(62, 140, "000", {
        fontFamily: "Arial, sans-serif", fontSize: "31px", fontStyle: "bold",
        color: "#f6f8ff"
      });
      this.bestText = this.add.text(62, 183, `BEST  ${String(this.best).padStart(3, "0")}`, {
        fontFamily: "Arial, sans-serif", fontSize: "11px", fontStyle: "bold",
        color: "#ffd166", letterSpacing: 1
      });
      this.add.text(62, 226, "GOAL", {
        fontFamily: "Arial, sans-serif", fontSize: "10px", fontStyle: "bold",
        color: "#a8b5cc", letterSpacing: 2
      });
      this.add.text(62, 246, "Stay sharp.\nKeep the line moving.", {
        fontFamily: "Arial, sans-serif", fontSize: "13px", color: "#d1d9e8",
        lineSpacing: 7
      });
      this.add.text(62, 438, "FRESH", {
        fontFamily: "Arial, sans-serif", fontSize: "10px", fontStyle: "bold",
        color: "#b8f36b", letterSpacing: 2
      });
      this.add.text(62, 457, "🥬  +10", { fontSize: "14px", color: "#f6f8ff" });
      this.add.text(62, 483, "HAZARD", {
        fontFamily: "Arial, sans-serif", fontSize: "10px", fontStyle: "bold",
        color: "#ff7e78", letterSpacing: 2
      });
      this.add.text(62, 502, "🔥  Shift ends", { fontSize: "13px", color: "#f6f8ff" });
    }

    makeChef() {
      this.chef = this.add.container(this.laneX(this.lane), 432);
      const shadow = this.add.ellipse(0, 27, 70, 18, 0x000000, 0.24);
      const body = this.add.graphics();
      body.fillStyle(0xf6f8ff, 1);
      body.fillRoundedRect(-23, -12, 46, 43, 12);
      body.fillStyle(0xdce4f2, 1);
      body.fillRoundedRect(-17, 5, 34, 22, 8);
      // Head and chef toque, all vector-drawn.
      body.fillStyle(0xf0bd95, 1);
      body.fillCircle(0, -25, 18);
      body.fillStyle(0xf6f8ff, 1);
      body.fillRoundedRect(-21, -47, 42, 17, 8);
      body.fillCircle(-10, -46, 10);
      body.fillCircle(0, -51, 12);
      body.fillCircle(10, -46, 10);
      body.fillStyle(0x26354a, 1);
      body.fillCircle(-6, -25, 2);
      body.fillCircle(6, -25, 2);
      body.lineStyle(2, 0x9c5d55, 1);
      body.beginPath(); body.arc(0, -21, 5, 0.2, Math.PI - 0.2, false); body.strokePath();
      // Apron.
      body.fillStyle(COLORS.aqua, 1);
      body.fillRoundedRect(-15, -4, 30, 28, 5);
      body.lineStyle(2, 0x2c8f8b, 1);
      body.strokeRoundedRect(-15, -4, 30, 28, 5);
      this.chef.add([shadow, body]);
      this.tweens.add({ targets: this.chef, y: 428, duration: 320, yoyo: true, repeat: -1, ease: "Sine.inOut" });
    }

    makeKeyboard() {
      this.keys = this.input.keyboard.addKeys({
        left: Phaser.Input.Keyboard.KeyCodes.LEFT,
        right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
        a: Phaser.Input.Keyboard.KeyCodes.A,
        d: Phaser.Input.Keyboard.KeyCodes.D,
        enter: Phaser.Input.Keyboard.KeyCodes.ENTER,
        space: Phaser.Input.Keyboard.KeyCodes.SPACE
      });
      this.input.keyboard.on("keydown-LEFT", () => this.moveLane(-1));
      this.input.keyboard.on("keydown-A", () => this.moveLane(-1));
      this.input.keyboard.on("keydown-RIGHT", () => this.moveLane(1));
      this.input.keyboard.on("keydown-D", () => this.moveLane(1));
      this.input.keyboard.on("keydown-ENTER", () => { if (this.isOver) this.scene.restart(); });
      this.input.keyboard.on("keydown-SPACE", () => { if (this.introOverlay) this.dismissIntro(); else if (this.isOver) this.scene.restart(); });
    }

    makeTouchControls() {
      this.input.on("pointerdown", this.handlePointer, this);
    }

    handlePointer(pointer) {
      if (this.introOverlay) { this.dismissIntro(); return; }
      if (this.isOver) { this.scene.restart(); return; }
      if (pointer.x < W / 2) this.moveLane(-1);
      else this.moveLane(1);
    }

    laneX(lane) { return 340 + lane * 220; }

    moveLane(direction) {
      if (this.isOver || this.introOverlay) return;
      this.lane = Phaser.Math.Clamp(this.lane + direction, 0, 2);
      this.tweens.add({
        targets: this.chef, x: this.laneX(this.lane), duration: 100,
        ease: "Cubic.Out"
      });
      this.popText(this.chef.x, this.chef.y - 56, direction < 0 ? "←" : "→", COLORS.aqua, 15);
    }

    showIntro() {
      this.introOverlay = true;
      this.overlay = this.add.container(W / 2, H / 2);
      const shade = this.add.rectangle(0, 0, W, H, 0x0b1221, 0.82);
      const card = this.add.rectangle(0, 0, 470, 280, 0x182940, 1).setStrokeStyle(1, 0x405873, 1);
      const tag = this.add.text(0, -96, "ARCADE TRAINING", {
        fontFamily: "Arial, sans-serif", fontSize: "11px", fontStyle: "bold",
        color: "#b8f36b", letterSpacing: 2
      }).setOrigin(0.5);
      const title = this.add.text(0, -55, "Survive the rush.", {
        fontFamily: "Arial, sans-serif", fontSize: "31px", fontStyle: "bold",
        color: "#f6f8ff"
      }).setOrigin(0.5);
      const copy = this.add.text(0, 2,
        "Move between the three lanes.\nCollect fresh ingredients for +10 points.\nAvoid flames and hot pans — one hit ends the shift.",
        { fontFamily: "Arial, sans-serif", fontSize: "15px", color: "#c2cde0", align: "center", lineSpacing: 8 }
      ).setOrigin(0.5);
      const start = this.add.text(0, 95, "PRESS SPACE OR TAP TO START  →", {
        fontFamily: "Arial, sans-serif", fontSize: "12px", fontStyle: "bold",
        color: "#101a2d", backgroundColor: "#b8f36b", padding: { x: 18, y: 13 }
      }).setOrigin(0.5);
      this.overlay.add([shade, card, tag, title, copy, start]);
      this.overlay.setDepth(100);
    }

    dismissIntro() {
      if (!this.introOverlay) return;
      this.introOverlay = false;
      this.overlay.destroy();
      this.overlay = null;
      this.popText(W / 2, 112, "SERVICE!", COLORS.lime, 20);
    }

    spawnObject() {
      const lane = Phaser.Math.Between(0, 2);
      const isHazard = Math.random() < Math.min(0.42, 0.25 + this.elapsed / 150);
      const x = this.laneX(lane);
      const y = 112;
      const container = this.add.container(x, y);
      if (isHazard) {
        const glow = this.add.circle(0, 0, 31, COLORS.coral, 0.12);
        const pan = this.add.graphics();
        pan.fillStyle(0x53657a, 1);
        pan.fillRoundedRect(-25, -13, 50, 31, 8);
        pan.fillStyle(0x8596aa, 1);
        pan.fillRoundedRect(20, -5, 19, 9, 4);
        pan.fillStyle(0xff7e78, 1);
        pan.fillRoundedRect(-19, -9, 38, 20, 5);
        const flame = this.add.text(0, -30, "🔥", { fontSize: "25px" }).setOrigin(0.5);
        container.add([glow, pan, flame]);
        container.setData("kind", "hazard");
      } else {
        const glow = this.add.circle(0, 0, 28, COLORS.lime, 0.1);
        const plate = this.add.ellipse(0, 12, 54, 23, 0xd7e2ee, 0.95);
        const ingredients = ["🥕", "🍅", "🥬", "🧅", "🍄", "🫑"];
        const food = this.add.text(0, -3, Phaser.Utils.Array.GetRandom(ingredients), { fontSize: "31px" }).setOrigin(0.5);
        container.add([glow, plate, food]);
        container.setData("kind", "ingredient");
      }
      container.setData("lane", lane);
      container.setData("collected", false);
      this.items.push(container);
    }

    popText(x, y, text, color, size = 18) {
      const label = this.add.text(x, y, text, {
        fontFamily: "Arial, sans-serif", fontSize: `${size}px`, fontStyle: "bold",
        color: Phaser.Display.Color.IntegerToColor(color).rgba
      }).setOrigin(0.5).setDepth(30);
      this.tweens.add({ targets: label, y: y - 32, alpha: 0, duration: 620, ease: "Cubic.Out", onComplete: () => label.destroy() });
    }

    burst(x, y, color, count = 12) {
      for (let i = 0; i < count; i++) {
        const dot = this.add.circle(x, y, Phaser.Math.Between(2, 5), color, 1).setDepth(25);
        const angle = Math.random() * Math.PI * 2;
        const distance = Phaser.Math.Between(25, 75);
        this.tweens.add({
          targets: dot, x: x + Math.cos(angle) * distance, y: y + Math.sin(angle) * distance,
          alpha: 0, scale: 0.15, duration: Phaser.Math.Between(350, 700), ease: "Cubic.Out",
          onComplete: () => dot.destroy()
        });
      }
    }

    collect(item) {
      item.setData("collected", true);
      this.score += 10;
      this.scoreText.setText(String(this.score).padStart(3, "0"));
      this.burst(item.x, item.y, COLORS.lime, 16);
      this.popText(item.x, item.y - 18, "+10", COLORS.lime, 20);
      this.cameras.main.shake(70, 0.002);
      item.destroy();
      if (this.score > this.best) {
        this.best = this.score;
        localStorage.setItem("kitchenDashBest", String(this.best));
        this.bestText.setText(`BEST  ${String(this.best).padStart(3, "0")}`);
      }
    }

    endGame() {
      if (this.isOver) return;
      this.isOver = true;
      this.cameras.main.shake(250, 0.008);
      this.burst(this.chef.x, this.chef.y, COLORS.coral, 28);
      this.chef.setAlpha(0.35);
      const panel = this.add.container(W / 2, H / 2).setDepth(120);
      const shade = this.add.rectangle(0, 0, W, H, 0x0b1221, 0.82);
      const card = this.add.rectangle(0, 0, 440, 275, 0x182940, 1).setStrokeStyle(1, 0x53657a, 1);
      const eyebrow = this.add.text(0, -88, "SHIFT COMPLETE", {
        fontFamily: "Arial, sans-serif", fontSize: "11px", fontStyle: "bold",
        color: "#ff7e78", letterSpacing: 2
      }).setOrigin(0.5);
      const title = this.add.text(0, -47, "The line got you.", {
        fontFamily: "Arial, sans-serif", fontSize: "28px", fontStyle: "bold", color: "#f6f8ff"
      }).setOrigin(0.5);
      const result = this.add.text(0, 4, `Score  ${this.score}     Best  ${this.best}`, {
        fontFamily: "Arial, sans-serif", fontSize: "18px", fontStyle: "bold", color: "#b8f36b"
      }).setOrigin(0.5);
      const copy = this.add.text(0, 40, "Every run makes a sharper chef.", {
        fontFamily: "Arial, sans-serif", fontSize: "13px", color: "#a8b5cc"
      }).setOrigin(0.5);
      const restart = this.add.text(0, 89, "RESTART RUN  ↻", {
        fontFamily: "Arial, sans-serif", fontSize: "13px", fontStyle: "bold",
        color: "#101a2d", backgroundColor: "#b8f36b", padding: { x: 24, y: 13 }
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      restart.on("pointerdown", () => this.scene.restart());
      panel.add([shade, card, eyebrow, title, result, copy, restart]);
      this.tweens.add({ targets: panel, alpha: { from: 0, to: 1 }, scale: { from: 0.92, to: 1 }, duration: 220, ease: "Back.Out" });
    }

    update(_time, delta) {
      if (this.isOver || this.introOverlay) return;
      const dt = delta / 1000;
      this.elapsed += dt;
      this.speed = Math.min(390, 230 + this.elapsed * 3.2);
      this.spawnTimer += dt;
      const spawnEvery = Math.max(0.48, 1.0 - this.elapsed * 0.006);
      if (this.spawnTimer >= spawnEvery) {
        this.spawnTimer = 0;
        this.spawnObject();
      }
      for (let i = this.items.length - 1; i >= 0; i--) {
        const item = this.items[i];
        if (!item.active) { this.items.splice(i, 1); continue; }
        item.y += this.speed * dt;
        // A collision is registered only when an object reaches the chef's lane and height.
        if (Math.abs(item.y - this.chef.y) < 27 && item.getData("lane") === this.lane) {
          if (item.getData("kind") === "hazard") {
            this.endGame();
            return;
          } else if (!item.getData("collected")) {
            this.collect(item);
            this.items.splice(i, 1);
            continue;
          }
        }
        if (item.y > H + 45) {
          item.destroy();
          this.items.splice(i, 1);
        }
      }
    }
  }

  const config = {
    type: Phaser.AUTO,
    parent: "game",
    width: W,
    height: H,
    backgroundColor: "#101a2d",
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: W,
      height: H
    },
    render: { antialias: true, pixelArt: false, roundPixels: true },
    input: { activePointers: 3 },
    scene: [KitchenDash]
  };

  window.kitchenDashGame = new Phaser.Game(config);
  document.getElementById("restartBtn").addEventListener("click", () => {
    if (window.kitchenDashGame) window.kitchenDashGame.scene.start("KitchenDash");
  });
})();