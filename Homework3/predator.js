class Predator {
  constructor(x) {
    this.size = 62;
    this.x = Math.max(this.size, Math.min(width - this.size, x));
    this.y = -this.size * 1.5;

    this.fallSpeed = 3;
    this.huntSpeed = 7.8;
    this.facing = 1;
    this.wanderSpeed = 4.5;

    this.state = "falling";
    this.target = null;
    this.taken = false;
  }

  update(fishes) {
    if (this.state === "falling") {
      this.fallSpeed += 0.25;
      this.y += this.fallSpeed;

      let waterBottomEdge = height * 0.4 + 48 + this.size * 0.7;

      if (this.y >= waterBottomEdge) {
        this.y = waterBottomEdge;
        this.state = "hunting";
      }

      return;
    }

    // 먹이를 모두 먹으면 좌우로 헤엄치는 상태로 전환
    if (this.state === "hunting" && fishes.length === 0) {
      this.target = null;
      this.state = "wandering";
    }

    if (this.state === "wandering") {
      this.x += this.wanderSpeed * this.facing;

      let edge = this.size * 1.4;

      if (this.x > width - edge) {
        this.x = width - edge;
        this.facing = -1;
      } else if (this.x < edge) {
        this.x = edge;
        this.facing = 1;
      }

      return;
    }

    if (this.state === "hunting") {
      if (this.target === null || this.target.death) {
        this.chooseTarget(fishes);
      }

      if (this.target === null) {
        return;
      }

      let dx = this.target.x - this.x;
      let dy = this.target.y - this.y;
      let distance = Math.sqrt(dx * dx + dy * dy);

      // 좌우 방향만 바꾸고 위아래로 기울지는 않음
      this.facing = dx < 0 ? -1 : 1;

      if (distance > 0) {
        this.x += (dx / distance) * this.huntSpeed;
        this.y += (dy / distance) * this.huntSpeed;
      }

      // 물고기에 닿으면 먹음
      if (distance < this.size * 0.75 + this.target.size * 0.7) {
        this.target.death = true;
        this.target.beingChased = false;
        this.target.chasedBy = null;
        this.target = null;
      }
    }
  }

  chooseTarget(fishes) {
    let availableFishes = [];

    for (let f of fishes) {
      if (!f.death && !f.beingChased) {
        availableFishes.push(f);
      }
    }

    if (availableFishes.length === 0) {
      this.target = null;
      this.state = "wandering";
      return;
    }

    let randomIndex = Math.floor(random(availableFishes.length));
    this.target = availableFishes[randomIndex];
    this.target.beingChased = true;
    this.target.chasedBy = this;
  }

  display() {
    push();
    translate(this.x, this.y);
    scale(this.facing, 1);

    // 꼬리지느러미
    fill("#465143");
    triangle(
      -this.size * 0.75,
      0,
      -this.size * 1.4,
      -this.size * 0.65,
      -this.size * 1.35,
      this.size * 0.65,
    );

    // 몸통: 탁한 웜그레이와 카키색
    fill("#5c6053");
    ellipse(0, 0, this.size * 2.2, this.size * 1.25);

    // 입 안
    fill("#282820");
    triangle(
      this.size * 0.62,
      -this.size * 0.22,
      this.size * 1.08,
      0,
      this.size * 0.62,
      this.size * 0.22,
    );

    // 뾰족한 윗니와 아랫니
    fill("#eee9d8");

    for (let i = 0; i < 3; i++) {
      let toothX = this.size * (0.66 + i * 0.1);

      triangle(
        toothX,
        -this.size * 0.19,
        toothX + this.size * 0.12,
        -this.size * 0.19,
        toothX + this.size * 0.06,
        -this.size * 0.03,
      );

      triangle(
        toothX,
        this.size * 0.19,
        toothX + this.size * 0.12,
        this.size * 0.19,
        toothX + this.size * 0.06,
        this.size * 0.03,
      );
    }

    // 눈
    fill("#171914");
    circle(this.size * 0.42, -this.size * 0.25, this.size * 0.12);

    pop();
  }
}
