let fishes = [];
let predator = null;
let bird = null;
let waterOffset = 0;
let waterFlow = 0.7;

function setup() {
  createCanvas(1000, 800);
  rectMode(CENTER);
  noStroke();

  createFishGroup();
}

function createFishGroup() {
  let fishSettings = [
    { size: 44, speed: 5.4 },
    { size: 29, speed: 2.3 },
    { size: 59, speed: 4.1 },
    { size: 38, speed: 2.6 },
    { size: 50, speed: 2.4 },
    { size: 23, speed: 3.1 },
  ];

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

  for (let setting of fishSettings) {
    let colorIndex = Math.floor(random(fishColors.length));
    let fishColor = fishColors.splice(colorIndex, 1)[0];

    // 물결의 가장 낮은 지점보다 아래에서 생성
    let waterTop = height * 0.4 + 48;
    let x = random(setting.size * 1.5, width - setting.size * 1.5);
    let y = random(waterTop + setting.size, height - setting.size);

    fishes.push(new Fish(x, y, setting.size, fishColor, setting.speed));
  }
}

function draw() {
  background("#d9f3ff");
  drawWater();
  drawSeaweed();

  // 작은 물고기 이동 및 먹힌 물고기 제거
  for (let i = fishes.length - 1; i >= 0; i--) {
    let f = fishes[i];

    if (f.death) {
      fishes.splice(i, 1);
    } else {
      f.move();
      f.display();
    }
  }

  // 포식자 이동 및 그리기
  if (predator !== null) {
    // 새가 아직 쫓는 중이거나 새가 없으면 포식자가 움직임
    if (bird === null || bird.state === "chasing") {
      predator.update(fishes);
      predator.display();
    }

    // 작은 물고기가 모두 사라지면 포식자가 헤엄치고 새가 쫓기 시작함
    if (fishes.length === 0 && bird === null) {
      predator.target = null;
      predator.state = "wandering";
      bird = new Bird(predator);
    }
  }

  // 새가 포식자를 잡아 날아감
  if (bird !== null) {
    bird.update();
    bird.display();

    if (bird.done) {
      bird = null;
      predator = null;
      fishes = [];
      createFishGroup();
    }
  }
}

function mousePressed() {
  // 한 사이클에 포식자는 한 마리만 생성
  if (predator === null && bird === null && fishes.length > 0) {
    predator = new Predator(mouseX);
  }
}

function drawWater() {
  let surfaceY = height * 0.4;
  let waveHeight = 48;
  let waveLength = 320;

  // 물결은 오른쪽으로 자동 이동
  waterOffset += waterFlow;

  if (waterOffset > waveLength) {
    waterOffset -= waveLength;
  }

  noStroke();
  fill("#53b9e8");

  beginShape();
  vertex(0, height);

  for (let x = 0; x <= width; x += 10) {
    let y =
      surfaceY + sin(((x - waterOffset) / waveLength) * TWO_PI) * waveHeight;

    vertex(x, y);
  }

  vertex(width, height);
  endShape(CLOSE);
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

  ellipse(-8, -45, 48, 100);
  ellipse(-18, -115, 52, 120);
  ellipse(-8, -195, 55, 125);
  ellipse(8, -270, 58, 130);
  ellipse(16, -340, 58, 110);
  ellipse(15, -390, 55, 65);

  stroke("#087c43");
  strokeWeight(7);

  line(-8, -5, -8, -80);
  line(-8, -80, -18, -150);
  line(-18, -150, -8, -225);
  line(-8, -225, 8, -300);
  line(8, -300, 15, -375);

  pop();
}
