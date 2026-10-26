class Fish {
  constructor(x, y, size, fishColor, speed) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.fishColor = fishColor;
    this.speed = speed;

    this.taken = false;
    this.beingChased = false;

    // 쓸기 물살 관련 값
    this.swept = false;
    this.currentSpeed = 0;
    this.death = false;
    this.entering = false;
  }

  move() {
    if (this.entering) {
      this.x += this.speed;

      let edge = this.size * 1.5;

      if (this.speed > 0 && this.x >= edge) {
        this.entering = false;
      } else if (this.speed < 0 && this.x <= width - edge) {
        this.entering = false;
      }

      return;
    }
    // 쓸린 물고기는 쓸기 방향으로 계속 이동
    if (this.swept) {
      this.x += this.currentSpeed;

      // 화면 밖으로 완전히 나가면 삭제 대상으로 표시
      if (this.x < -this.size * 2 || this.x > width + this.size * 2) {
        this.death = true;
      }

      return;
    }

    // 평소에는 좌우로 헤엄침
    this.x += this.speed;

    // 화면 가장자리에 닿으면 방향을 바꿈
    if (this.x > width - this.size * 1.5 || this.x < this.size * 1.5) {
      this.speed *= -1;
    }
  }

  display() {
    push();
    translate(this.x, this.y);

    // 진행 방향에 맞춰 좌우로 반전
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
