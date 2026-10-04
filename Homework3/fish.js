class Fish {
  constructor(x, y, size, fishColor, speed) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.fishColor = fishColor;
    this.speed = speed;

    this.taken = false;
    this.beingChased = false;
    this.chasedBy = null;
    this.death = false;

    // 쫓길 때는 평소보다 빠르게 도망가지만 포식자보다는 느림
    this.escapeSpeed = Math.min(Math.max(Math.abs(speed) * 1.5, 4.5), 6.2);
  }

  move() {
    if (this.beingChased && this.chasedBy !== null) {
      let dx = this.x - this.chasedBy.x;
      let dy = this.y - this.chasedBy.y;
      let distance = Math.sqrt(dx * dx + dy * dy);

      if (distance === 0) {
        dx = 1;
        distance = 1;
      }

      let moveX = (dx / distance) * this.escapeSpeed;
      let moveY = (dy / distance) * this.escapeSpeed;

      let leftEdge = this.size * 1.5;
      let rightEdge = width - this.size * 1.5;
      let topEdge = height * 0.4 + 48 + this.size;
      let bottomEdge = height - this.size;

      // 가로 벽에 막히면 벽을 따라 위나 아래로 도망감
      if (this.x + moveX < leftEdge || this.x + moveX > rightEdge) {
        moveX = 0;
        moveY =
          this.y <= this.chasedBy.y ? -this.escapeSpeed : this.escapeSpeed;
      }

      // 위아래 경계에 닿으려 하면 안쪽으로 방향을 바꿈
      if (this.y + moveY < topEdge) {
        moveY = this.escapeSpeed;
      } else if (this.y + moveY > bottomEdge) {
        moveY = -this.escapeSpeed;
      }

      this.x += moveX;
      this.y += moveY;

      if (Math.abs(moveX) > 0.1) {
        this.speed = moveX > 0 ? Math.abs(this.speed) : -Math.abs(this.speed);
      }

      return;
    }

    // 평소에는 좌우로 헤엄침
    this.x += this.speed;

    if (this.x > width - this.size * 1.5 || this.x < this.size * 1.5) {
      this.speed *= -1;
    }
  }

  display() {
    push();
    translate(this.x, this.y);

    if (this.speed < 0) {
      scale(-1, 1);
    }

    fill(this.fishColor);
    ellipse(0, 0, this.size * 2, this.size * 1.3);

    triangle(
      -this.size * 0.7,
      0,
      -this.size * 1.5,
      -this.size * 0.5,
      -this.size * 1.5,
      this.size * 0.5,
    );

    fill(0);
    circle(this.size * 0.45, -this.size * 0.15, this.size * 0.22);

    pop();
  }
}
