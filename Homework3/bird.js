class Bird {
  constructor(fish) {
    this.fish = fish;
    this.x = random(width);
    this.y = -60;
    this.speed = 9;
    this.state = "chasing";
    this.done = false;
    this.wingAngle = 0;
    this.wingDirection = 1;
  }
  update() {
    // 날개를 파닥이게 움직임
    this.wingAngle += 0.12 * this.wingDirection;
    if (this.wingAngle > 0.45 || this.wingAngle < -0.45) {
      this.wingDirection *= -1;
    }
    if (this.state === "chasing") {
      // 움직이는 물고기의 현재 위치를 따라감
      let dx = this.fish.x - this.x;
      let dy = this.fish.y - this.y;
      let distance = sqrt(dx * dx + dy * dy);
      if (distance > 1) {
        this.x += (dx / distance) * this.speed;
        this.y += (dy / distance) * this.speed;
      }
      // 물고기 가까이에 도착하면 잡음
      if (distance < this.fish.size * 0.7) {
        this.state = "flyingAway";
        this.fish.taken = true;
      }
    } else if (this.state === "flyingAway") {
      // 물고기를 잡은 채 함께 위로 날아감
      this.y -= this.speed;
      this.fish.x = this.x;
      this.fish.y = this.y + 55;
      if (this.y < -80) {
        this.done = true;
      }
    }
  }
  display() {
    push();
    translate(this.x, this.y);
    // 갈매기 몸
    fill("#ffffff");
    ellipse(0, 0, 90, 42);
    // 왼쪽 날개
    push();
    rotate(this.wingAngle);
    triangle(-15, -5, -65, -38, -42, 8);
    pop();
    // 오른쪽 날개
    push();
    rotate(-this.wingAngle);
    triangle(15, -5, 65, -38, 42, 8);
    pop();
    // 눈
    fill(0);
    circle(25, -7, 6);
    // 부리
    fill("#f2a900");
    triangle(38, 0, 62, 8, 38, 14);
    pop();
    // 잡힌 물고기를 새 아래에 그림
    if (this.state === "flyingAway") {
      this.fish.display();
    }
  }
}
