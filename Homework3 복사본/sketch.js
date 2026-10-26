let cart = [];
let canvas;
let input;
let searchStatus = "";
const foods = [
  { name: "토마토", type: "tomato", x: 82, y: 280, w: 54, h: 54 },
  { name: "당근", type: "carrot", x: 176, y: 280, w: 58, h: 58 },
  { name: "복숭아", type: "peach", x: 270, y: 280, w: 55, h: 55 },
  { name: "식빵", type: "bread", x: 382, y: 280, w: 55, h: 55 },
  { name: "우유", type: "milk", x: 478, y: 280, w: 48, h: 61 },
  { name: "달걀", type: "egg", x: 126, y: 416, w: 43, h: 54 },
  { name: "토마토", type: "tomato", x: 245, y: 416, w: 52, h: 52 },
  { name: "당근", type: "carrot", x: 360, y: 416, w: 56, h: 57 },
  { name: "식빵", type: "bread", x: 475, y: 416, w: 54, h: 54 },
];
function setup() {
  canvas = createCanvas(600, 800);
  rectMode(CENTER);
  input = createInput("");
  const canvasPos = canvas.position();
  input.position(canvasPos.x + 28, canvasPos.y + 80);
  input.size(280, 24);
  input.attribute("placeholder", "음식 이름을 입력하고 Enter");
  input.style("font-size", "14px");
  input.style("padding", "4px 8px");
  input.style("border", "1px solid #c9bda7");
  input.style("border-radius", "7px");
  input.style("background", "#fffaf0");
  input.style("z-index", "20");
  input.changed(addSearchedFood);
  noStroke();
  textFont("sans-serif");
}
function draw() {
  background("#f5eddf");
  drawCabinet();
  drawTablecloth();
  drawBasket();
  drawCartFood();
  drawTitle();
  for (const f of foods) {
    if (dist(mouseX, mouseY, f.x, f.y) < 34) {
      fill("#3d4035");
      textAlign(CENTER, CENTER);
      textSize(12);
      text(f.name + " · 눌러 담기", f.x, f.y - 43);
    }
  }
}
function drawTitle() {
  fill("#354032");
  textAlign(LEFT, CENTER);
  textSize(25);

  fill("#66885c");
  textAlign(RIGHT, CENTER);
  textSize(13);
  text("담은 음식 " + cart.length + "개", 575, 34);
  fill("#746f62");
  textAlign(LEFT, CENTER);
  textSize(12);
  if (searchStatus) {
    fill("#55744c");
    textAlign(LEFT, CENTER);
    textSize(12);
    text(searchStatus, 28, 138);
  }
}
function addSearchedFood() {
  const raw = input.value();
  if (!raw.trim()) return;
  const query = raw.trim().replace(/\s/g, "").toLowerCase();
  const match =
    foods.find((f) => f.name.replace(/\s/g, "").toLowerCase() === query) ||
    foods.find((f) => f.name.replace(/\s/g, "").toLowerCase().includes(query));
  if (match) {
    cart.push({ name: match.name, type: match.type });
    searchStatus = match.name + "을(를) 장바구니에 담았어요!";
  } else {
    searchStatus = "목록에 없는 음식이에요. 진열된 음식 이름을 입력해주세요.";
  }
  input.value("");
}
function drawCabinet() {
  fill("#9c8163");
  rect(300, 263, 570, 440, 8);
  fill("#d7c9b3");
  rect(300, 256, 542, 410);
  fill("#765f49");
  rect(300, 64, 570, 24, 5);
  fill("#b49a78");
  rect(300, 91, 550, 28);
  fill("#eee7da");
  rect(300, 162, 530, 107);
  fill("#eee7da");
  rect(300, 300, 530, 107);
  fill("#eee7da");
  rect(300, 438, 530, 107);
  fill("#80694f");
  rect(300, 218, 550, 16, 3);
  fill("#80694f");
  rect(300, 356, 550, 16, 3);
  fill("#80694f");
  rect(300, 494, 550, 16, 3);
  fill("#ad9270");
  rect(300, 224, 550, 5);
  fill("#ad9270");
  rect(300, 362, 550, 5);
  fill("#ad9270");
  rect(300, 500, 550, 5);
  fill("#765f49");
  rect(63, 508, 26, 25, 4);
  rect(537, 508, 26, 25, 4);
  for (const f of foods) drawFood(f.type, f.x, f.y, f.w, f.h);
}
function drawFood(type, x, y, w, h) {
  push();
  translate(x, y);
  scale(w / 60, h / 60);
  if (type === "tomato") {
    fill("#df674e");
    ellipse(0, 4, 51, 44);
    ellipse(-12, 7, 25, 28);
    ellipse(12, 7, 25, 28);
    fill("#f39876");
    ellipse(-13, 0, 11, 15);
    fill("#638650");
    triangle(-4, -16, -22, -25, -15, -12);
    triangle(0, -15, 7, -28, 9, -12);
    triangle(4, -14, 22, -23, 14, -10);
    fill("#557944");
    rect(0, -17, 5, 13, 3);
  } else if (type === "carrot") {
    fill("#ef982f");
    beginShape();
    vertex(-15, -20);
    vertex(17, -25);
    vertex(13, 0);
    vertex(5, 17);
    vertex(-8, 29);
    vertex(-10, 3);
    endShape(CLOSE);
    stroke("#f8c44e");
    strokeWeight(2);
    line(-9, -7, 3, -5);
    line(-10, 1, 1, 3);
    line(-8, 9, -1, 10);
    noStroke();
    fill("#678c52");
    triangle(-9, -19, -22, -31, -12, -27);
    triangle(-3, -21, 1, -35, 5, -20);
    triangle(2, -21, 18, -31, 10, -19);
  } else if (type === "peach") {
    fill("#f19a86");
    ellipse(0, 2, 48, 47);
    ellipse(-11, 4, 25, 34);
    ellipse(11, 4, 25, 34);
    fill("#ffd0b5");
    ellipse(-12, -5, 13, 18);
    stroke("#cf6f68");
    strokeWeight(1.5);
    noFill();
    arc(1, 4, 12, 37, -1.2, 1.2);
    noStroke();
    fill("#678c52");
    ellipse(8, -23, 16, 8);
    rotate(-0.4);
    ellipse(10, -23, 16, 8);
  } else if (type === "bread") {
    fill("#b8794a");
    rect(0, 2, 48, 47, 11);
    fill("#f0c77d");
    rect(0, 3, 39, 40, 9);
    fill("#fff0cd");
    rect(0, 6, 29, 29, 8);
    fill("#fff7df");
    ellipse(-6, -1, 9, 11);
  } else if (type === "milk") {
    fill("#f6efd8");
    beginShape();
    vertex(-17, -22);
    vertex(-7, -31);
    vertex(11, -31);
    vertex(17, -22);
    vertex(17, 28);
    vertex(-17, 28);
    endShape(CLOSE);
    fill("#719465");
    quad(-7, -31, -2, -38, 10, -38, 11, -31);
    fill("#6f9670");
    rect(0, 8, 34, 17);
    fill("#fff9e9");
    textAlign(CENTER, CENTER);
    textSize(9);
    textStyle(BOLD);
    text("MILK", 0, 9);
    textStyle(NORMAL);
    fill("#e3cf9e");
    rect(0, -12, 14, 8, 2);
  } else if (type === "egg") {
    fill("#f4e4c3");
    ellipse(0, 0, 39, 53);
    fill("#fff7e5");
    ellipse(-8, -9, 10, 17);
  }
  pop();
}
function drawTablecloth() {
  fill("#b64c50");
  rect(300, 666, 600, 268);
  fill("#a94348");
  rect(300, 786, 600, 28);
  stroke("#f4e8df");
  strokeWeight(5);
  for (let x = 20; x < 600; x += 64) line(x, 787, x, 800);
  noStroke();
  fill("#795d48");
  rect(300, 795, 600, 10);
}
function drawBasket() {
  fill("#9c4240");
  ellipse(300, 753, 350, 40);
  fill("#e3b84f");
  beginShape();
  vertex(150, 570);
  vertex(450, 570);
  vertex(486, 768);
  vertex(114, 768);
  endShape(CLOSE);
  fill("#f0cf68");
  beginShape();
  vertex(168, 586);
  vertex(432, 586);
  vertex(462, 748);
  vertex(138, 748);
  endShape(CLOSE);
  fill("#d9ad46");
  beginShape();
  vertex(183, 606);
  vertex(417, 606);
  vertex(438, 735);
  vertex(162, 735);
  endShape(CLOSE);
  noFill();
  stroke("#c88f36");
  strokeWeight(12);
  arc(300, 618, 240, 150, PI, TWO_PI);
  noStroke();
  fill("#d0963d");
  beginShape();
  vertex(120, 746);
  vertex(480, 746);
  vertex(465, 775);
  vertex(135, 775);
  endShape(CLOSE);
  fill("#e8b64f");
  beginShape();
  vertex(135, 748);
  vertex(465, 748);
  vertex(452, 765);
  vertex(148, 765);
  endShape(CLOSE);
  stroke("#f5d878");
  strokeWeight(4);
  for (let x = 178; x <= 422; x += 29)
    line(x, 616, x + (x < 300 ? -11 : 11), 738);
  noStroke();
  if (cart.length === 0) {
    fill("#fff8e8");
    textAlign(CENTER, CENTER);
    textSize(14);
    text("음식을 담아주세요", 300, 687);
  }
}
function drawCartFood() {
  for (let i = 0; i < cart.length; i++) {
    let col = i % 5;
    let row = floor(i / 5);
    let x = 190 + col * 55 + (row % 2) * 16;
    let y = 712 - row * 43 - (col % 2) * 7;
    let item = cart[i];
    drawFood(item.type, x, y, 42, 42);
  }
}
function mousePressed() {
  if (mouseX >= 25 && mouseX <= 325 && mouseY >= 76 && mouseY <= 112) {
    input.elt.focus();
    return false;
  }
  for (const f of foods) {
    if (
      mouseX > f.x - 34 &&
      mouseX < f.x + 34 &&
      mouseY > f.y - 36 &&
      mouseY < f.y + 36
    ) {
      cart.push({ name: f.name, type: f.type });
      searchStatus = f.name + "을(를) 장바구니에 담았어요!";
      return false;
    }
  }
  if (mouseX > 120 && mouseX < 480 && mouseY > 575 && mouseY < 780) {
    cart = [];
    searchStatus = "장바구니를 비웠어요.";
  }
  return false;
}
function touchStarted() {
  mousePressed();
  return false;
}
