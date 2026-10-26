// p5.js 농장 메모장
// 브라우저 localStorage에 메모를 저장합니다.

let notes = [];
let editor, titleInput, bodyInput, addButton;
let gateOpenedAt = 0;
let gateOpen = false;
let pendingNote = null;

const STORE_KEY = "farmEggNotes_v1";
const SLOT_COUNT = 10;
const NOTE_LIFE = 60000;

function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont("sans-serif");

  try {
    notes = JSON.parse(localStorage.getItem(STORE_KEY) || "[]");
  } catch (error) {
    notes = [];
  }

  notes = notes.slice(-SLOT_COUNT);
  buildEditor();
  positionEditor();
}

function draw() {
  background("#8ed8f2");

  drawSky();
  drawField();
  drawFence();
  drawDeskAndTray();
  updateNotes();

  if (gateOpen && millis() - gateOpenedAt > 2000) {
    gateOpen = false;
  }

  drawHint();
}

function drawSky() {
  noStroke();

  fill("#bdeafa");
  ellipse(width * 0.18, height * 0.15, 100, 42);
  ellipse(width * 0.23, height * 0.15, 75, 38);
  ellipse(width * 0.78, height * 0.19, 130, 48);
  ellipse(width * 0.84, height * 0.18, 90, 40);

  fill("#ffd979");
  ellipse(width * 0.86, height * 0.11, 70, 70);
}

function drawField() {
  noStroke();
  fill("#77bd57");
  rect(0, height * 0.43, width, height * 0.57);

  fill("#68aa4d");
  ellipse(width * 0.12, height * 0.53, width * 0.5, height * 0.24);
  ellipse(width * 0.8, height * 0.5, width * 0.6, height * 0.2);

  for (let i = 0; i < 18; i++) {
    const x = (i * 91 + 25) % width;
    const y = height * (0.55 + (i % 5) * 0.08);

    fill(i % 2 ? "#fff2a2" : "#ffd3a0");
    ellipse(x, y, 7, 7);
  }
}

function drawFence() {
  const y = height * 0.43;
  const gateX = width * 0.75;

  stroke("#87532f");
  strokeWeight(max(8, width * 0.012));
  line(0, y, width, y);
  line(0, y + height * 0.12, width, y + height * 0.12);

  for (let x = 0; x < width; x += width * 0.11) {
    line(x, y - height * 0.04, x, y + height * 0.16);
  }

  noStroke();
  fill("#a66b3e");
  rect(gateX, y - height * 0.02, width * 0.24, height * 0.14, 5);

  for (let x = gateX + width * 0.04; x < width * 0.99; x += width * 0.06) {
    rect(x, y - height * 0.02, width * 0.016, height * 0.14, 3);
  }

  if (gateOpen) {
    push();
    translate(gateX, y);
    rotate(-0.75);
    fill("#8b572f");
    rect(width * 0.12, 0, width * 0.24, height * 0.025, 4);
    pop();
  }

  fill("#f7ebcb");
  textAlign(CENTER);
  textSize(14);
  text("문을 눌러 열기", gateX + width * 0.12, y + height * 0.18);
}

function drawDeskAndTray() {
  const x = width * 0.04;
  const y = height * 0.64;
  const w = width * 0.52;

  noStroke();
  fill("#9a6037");
  rect(x, y, w, height * 0.045, 8);

  fill("#77472e");
  rect(x + width * 0.03, y + height * 0.02, width * 0.025, height * 0.27);
  rect(x + w - width * 0.06, y + height * 0.02, width * 0.025, height * 0.27);

  const tx = x + width * 0.025;
  const ty = y - height * 0.105;
  const tw = w * 0.91;
  const th = height * 0.14;

  fill("#b8b9b5");
  rect(tx, ty, tw, th, 12);

  fill("#d1d2ce");
  rect(tx + tw * 0.03, ty + th * 0.11, tw * 0.94, th * 0.72, 10);

  for (let i = 0; i < 10; i++) {
    const col = i % 5;
    const row = floor(i / 5);
    const cx = tx + tw * (0.12 + col * 0.19);
    const cy = ty + th * (row === 0 ? 0.36 : 0.72);

    fill("#b9bab6");
    ellipse(cx, cy, tw * 0.16, th * 0.39);

    if (notes[i]) {
      drawEgg(cx, cy - th * 0.3, tw * 0.14, th * 0.62, notes[i]);
    }
  }

  fill("#64503f");
  textAlign(LEFT);
  textSize(13);
  text("메모 알판 " + notes.length + "/10", tx, ty - th * 0.12);
}

function drawEgg(x, y, w, h, note) {
  push();
  translate(x, y);

  if (note.hatching) {
    rotate(sin(millis() * 0.035) * 0.09);
  }

  noStroke();
  fill(note.hatching ? "#fff4d6" : "#fffaf0");
  ellipse(0, 0, w * 0.8, h * 1.15);

  fill("#ffffff");
  ellipse(-w * 0.18, -h * 0.2, w * 0.2, h * 0.32);

  if (note.hatched) {
    fill("#ffd56b");
    ellipse(0, -h * 0.04, w * 0.7, h * 0.42);

    fill("#30271f");
    ellipse(-w * 0.15, -h * 0.07, 3, 3);
    ellipse(w * 0.15, -h * 0.07, 3, 3);

    fill("#f69a38");
    triangle(-3, 0, 3, 0, 0, 4);
  } else {
    fill("#4a392a");
    textAlign(CENTER, CENTER);
    textSize(max(8, w * 0.2));
    text(note.title.slice(0, 8), 0, h * 0.16, w * 0.9, h * 0.3);
  }

  if (note.hatching && !note.hatched) {
    stroke("#7f6650");
    strokeWeight(1.4);
    line(-w * 0.3, -h * 0.05, -w * 0.12, -h * 0.15);
    line(-w * 0.12, -h * 0.15, 0, -h * 0.04);
    line(0, -h * 0.04, w * 0.13, -h * 0.17);
    line(w * 0.13, -h * 0.17, w * 0.3, -h * 0.05);
  }

  pop();
}

function updateNotes() {
  const now = Date.now();

  for (const note of notes) {
    if (!note.hatching && now - note.created >= NOTE_LIFE) {
      note.hatching = true;
      note.hatchAt = now;
    }
  }

  if (notes[0] && notes[0].hatching && now - notes[0].hatchAt > 2600) {
    if (pendingNote) {
      notes[0] = pendingNote;
      pendingNote = null;
    } else {
      notes[0].hatched = true;
      notes[0].hatching = false;
      notes[0].created = now;
    }

    saveNotes();
  }
}

function drawHint() {
  fill("#fff8e8");
  noStroke();
  textAlign(CENTER);
  textSize(15);
  text("아래에서 새 메모를 적어보세요", width * 0.5, height * 0.91);
}

function buildEditor() {
  addButton = createButton("＋ 새 메모 작성");
  addButton.mousePressed(() => openEditor());
  styleButton(addButton, "#68452f", "#fff8e8");

  editor = createDiv("");
  editor.hide();
  editor.style("position", "fixed");
  editor.style("z-index", "20");
  editor.style("box-sizing", "border-box");
  editor.style("background", "#f6bd72");
  editor.style("border", "8px solid #96521f");
  editor.style("outline", "3px solid #f6d293");
  editor.style("border-radius", "12px");
  editor.style("padding", "18px");
  editor.style("box-shadow", "0 12px 40px #33241b88");

  const heading = createDiv("농장 비밀 노트");
  heading.parent(editor);
  heading.style("font-size", "20px");
  heading.style("font-weight", "bold");
  heading.style("color", "#59371f");
  heading.style("margin-bottom", "12px");

  titleInput = createInput("");
  titleInput.attribute("placeholder", "제목");
  titleInput.parent(editor);
  styleInput(titleInput);

  bodyInput = createElement("textarea");
  bodyInput.attribute("placeholder", "여기에 메모를 적어주세요…");
  bodyInput.parent(editor);
  bodyInput.style("display", "block");
  bodyInput.style("box-sizing", "border-box");
  bodyInput.style("width", "100%");
  bodyInput.style("height", "min(42vh,320px)");
  bodyInput.style("margin-top", "12px");
  bodyInput.style("padding", "12px");
  bodyInput.style("resize", "none");
  bodyInput.style("font-size", "18px");
  bodyInput.style("line-height", "1.6");
  bodyInput.style("color", "#38291f");
  bodyInput.style("background", "#ffdda0");
  bodyInput.style("border", "2px solid #bc7a3b");
  bodyInput.style("border-radius", "6px");

  const row = createDiv("");
  row.parent(editor);
  row.style("display", "flex");
  row.style("justify-content", "flex-end");
  row.style("gap", "10px");
  row.style("margin-top", "12px");

  const cancelButton = createButton("취소");
  cancelButton.parent(row);
  cancelButton.mousePressed(closeEditor);
  styleButton(cancelButton, "#c08b55", "#ffffff");

  const doneButton = createButton("완료");
  doneButton.parent(row);
  doneButton.mousePressed(saveEditor);
  styleButton(doneButton, "#744522", "#fff8e8");
}

function styleInput(element) {
  element.style("box-sizing", "border-box");
  element.style("width", "100%");
  element.style("padding", "11px");
  element.style("font-size", "18px");
  element.style("background", "#ffdda0");
  element.style("border", "2px solid #bc7a3b");
  element.style("border-radius", "6px");
}

function styleButton(element, background, color) {
  element.style("padding", "11px 18px");
  element.style("font-size", "16px");
  element.style("border", "0");
  element.style("border-radius", "8px");
  element.style("background", background);
  element.style("color", color);
  element.style("cursor", "pointer");
}

function positionEditor() {
  addButton.position((width - 190) / 2, height * 0.94);
  addButton.size(190, 44);

  editor.position(max(12, width * 0.12), max(18, height * 0.12));
  editor.size(min(width * 0.76, 540), min(height * 0.72, 620));
}

function openEditor(note) {
  editor.show();
  positionEditor();

  titleInput.value(note ? note.title : "");
  bodyInput.value(note ? note.body : "");
  editor.elt.dataset.editId = note ? note.id : "";

  if (!note) {
    titleInput.elt.focus();
  }
}

function closeEditor() {
  editor.hide();
}

function saveEditor() {
  let title = titleInput.value().trim();
  const body = bodyInput.value().trim();

  if (!title) {
    title = "이름 없는 메모";
  }

  const id = editor.elt.dataset.editId;

  if (id) {
    const note = notes.find((item) => item.id === id);

    if (note) {
      note.title = title;
      note.body = body;
    }
  } else {
    const newNote = {
      id: String(Date.now()) + Math.random(),
      title: title,
      body: body,
      created: Date.now(),
      hatched: false,
      hatching: false,
    };

    if (notes.length >= SLOT_COUNT) {
      pendingNote = newNote;
      notes[0].hatching = true;
      notes[0].hatchAt = Date.now();
    } else {
      notes.unshift(newNote);
    }
  }

  saveNotes();
  closeEditor();
}

function saveNotes() {
  localStorage.setItem(STORE_KEY, JSON.stringify(notes));
}

function mousePressed() {
  const gateX = width * 0.75;
  const fenceY = height * 0.43;

  // 울타리 문을 누르면 열기
  if (
    mouseX > gateX &&
    mouseX < width &&
    mouseY > fenceY - height * 0.03 &&
    mouseY < fenceY + height * 0.15
  ) {
    gateOpen = true;
    gateOpenedAt = millis();
    return false;
  }

  const trayX = width * 0.065;
  const trayY = height * 0.535;
  const trayW = width * 0.473;
  const trayH = height * 0.14;

  for (let i = 0; i < notes.length; i++) {
    const col = i % 5;
    const row = floor(i / 5);

    const eggX = trayX + trayW * (0.12 + col * 0.19);
    const cavityY = trayY + trayH * (row === 0 ? 0.36 : 0.72);

    // drawDeskAndTray()에서 알을 그리는 중심 위치와 맞춥니다.
    const eggY = cavityY - trayH * 0.3;

    // drawEgg()에서 사용하는 알의 너비와 높이에 맞춘 클릭 영역입니다.
    const eggHalfWidth = trayW * 0.14 * 0.45;
    const eggHalfHeight = trayH * 0.62 * 0.6;

    if (
      Math.abs(mouseX - eggX) < eggHalfWidth &&
      Math.abs(mouseY - eggY) < eggHalfHeight
    ) {
      openEditor(notes[i]);
      return false;
    }
  }
}
