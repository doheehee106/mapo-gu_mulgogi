let fishes = [];
let firstX = 0;
let waterOffset = 0;
let waterFlow = 0;

function setup() {
  createCanvas(1000, 800);
  rectMode(CENTER);
  noStroke();

  fishes = [];
  createFishGroup();
}

function createFishGroup(direction = 0) {
  let fishColors = [
    "#e34720",
    "#f9783d",
    "#ff6601",
    "#f4a62a",
    "#e85d75",
    "#ffb347",
    "#8a5bd1",
    "#37a6a0",
    "#ef476f",
    "#ffd166",
    "#06d6a0",
    "#118ab2",
    "#073b4c",
    "#9b5de5",
    "#f15bb5",
    "#00f5d4",
    "#ff70a6",
    "#70d6ff",
    "#e9ff70",
    "#ff9770",
    "#845ec2",
    "#4d96ff",
    "#c34a36",
    "#6bcb77",
    "#f9f871",
  ];

  for (let i = 0; i < 6; i++) {
    let size = random(23, 48);

    // 이번 무리에서 아직 사용하지 않은 색을 선택
    let colorIndex = Math.floor(random(fishColors.length));
    let fishColor = fishColors.splice(colorIndex, 1)[0];

    let speed = random(2, 5);

    // 물결의 가장 낮은 부분보다 아래에서 물고기 생성
    let waterTop = height * 0.4 + 48;
    let x;
    let y = random(waterTop + size, height - size);

    if (direction > 0) {
      // 오른쪽으로 쓸면 왼쪽 화면 밖에서 오른쪽으로 들어옴
      x = -size * 2 - i * 40;
    } else if (direction < 0) {
      // 왼쪽으로 쓸면 오른쪽 화면 밖에서 왼쪽으로 들어옴
      x = width + size * 2 + i * 40;
      speed *= -1;
    } else {
      // 스케치 시작 때는 물속 랜덤 위치에서 시작
      x = random(size * 1.5, width - size * 1.5);
      speed *= random() < 0.5 ? -1 : 1;
    }

    let fish = new Fish(x, y, size, fishColor, speed);
    fish.entering = direction !== 0;
    fishes.push(fish);
  }
}

function draw() {
  background("#d9f3ff");

  // 물결 모양의 물
  drawWater();

  drawSeaweed();

  // 물고기 이동 및 화면 밖으로 나간 물고기 삭제
  for (let i = fishes.length - 1; i >= 0; i--) {
    let f = fishes[i];

    if (!f.taken && !f.death) {
      f.move();
      f.display();
    }

    if (f.death) {
      fishes.splice(i, 1);
    }
  }
}

function drawWater() {
  let surfaceY = height * 0.4;
  let waveHeight = 48;
  let waveLength = 320;

  // 물결이 쓸기 방향으로 움직임
  waterOffset += waterFlow;

  if (waterOffset > waveLength) {
    waterOffset -= waveLength;
  } else if (waterOffset < -waveLength) {
    waterOffset += waveLength;
  }

  noStroke();
  fill("#53b9e8");

  beginShape();
  vertex(0, height);

  // 물의 윗 경계를 물결 모양으로 그림
  for (let x = 0; x <= width; x += 10) {
    let y =
      surfaceY + sin(((x - waterOffset) / waveLength) * TWO_PI) * waveHeight;

    vertex(x, y);
  }

  vertex(width, height);
  endShape(CLOSE);
}

function mousePressed() {
  firstX = mouseX;
}

function mouseReleased() {
  let dx = mouseX - firstX;

  // 짧게 누른 동작은 쓸기로 처리하지 않음
  if (dx > -25 && dx < 25) {
    return;
  }

  let direction = dx > 0 ? 1 : -1;
  let currentSpeed = map(abs(dx), 25, width, 4, 18);

  waterFlow = direction * map(abs(dx), 25, width, 1, 4);

  // 물고기가 모두 사라졌으면 새 무리를 화면 밖에서 들어오게 생성
  if (fishes.length === 0) {
    createFishGroup(direction);
    return;
  }

  // 남아 있는 물고기들을 쓸기 방향으로 보냄
  for (let f of fishes) {
    f.swept = true;
    f.currentSpeed = currentSpeed * direction;
    f.speed = f.currentSpeed;
  }
}

function drawSeaweed() {
  drawOneSeaweed(75, 800, "#078f4a");
  drawOneSeaweed(150, 800, "#2caf72");
}

function drawOneSeaweed(x, bottomY, kelpColor) {
  push();
  translate(x, bottomY);

  noStroke();
  fill(kelpColor);

  // 겹친 타원으로 만든 다시마
  ellipse(-8, -45, 48, 100);
  ellipse(-18, -115, 52, 120);
  ellipse(-8, -195, 55, 125);
  ellipse(8, -270, 58, 130);
  ellipse(16, -340, 58, 110);
  ellipse(15, -390, 55, 65);

  // 가운데 잎맥
  stroke("#087c43");
  strokeWeight(7);

  line(-8, -5, -8, -80);
  line(-8, -80, -18, -150);
  line(-18, -150, -8, -225);
  line(-8, -225, 8, -300);
  line(8, -300, 15, -375);

  pop();
}
