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

      if (distance > 0) {
        this.x += (dx / distance) * this.escapeSpeed;
        this.y += (dy / distance) * this.escapeSpeed;
      }

      // 물고기 방향을 좌우로 맞춤
      this.speed = dx >= 0 ? this.escapeSpeed : -this.escapeSpeed;

      // 물고기가 물 영역 밖으로 나가지 않게 제한
      let leftEdge = this.size * 1.5;
      let rightEdge = width - this.size * 1.5;
      let topEdge = height * 0.4 + 48 + this.size;
      let bottomEdge = height - this.size;

      if (this.x < leftEdge) this.x = leftEdge;
      if (this.x > rightEdge) this.x = rightEdge;
      if (this.y < topEdge) this.y = topEdge;
      if (this.y > bottomEdge) this.y = bottomEdge;

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
