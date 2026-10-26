// p5.js 농장 메모장
// 메모와 병아리 정보는 이 브라우저의 localStorage에 저장됩니다.
//화면 배율때매 밑에 두

let notes = [];
let chicks = [];
let nextEggNumber = 1;

let editor;
let shade;
let titleInput;
let bodyInput;
let favoriteButton;
let currentMemoFavorite = false;
let addButton;
let clearChicksButton;
let editButton;
let deleteButton;
let resetFarmButton;

let editorIsOpen = false;
let gateOpen = false;
let gateExitMode = false;
let gateOpenedAt = 0;
let massReleaseActive = false;
let massReleaseQueue = [];
let massReleaseNextAt = 0;
let pendingNote = null;
let pendingTargetId = null;
let refillAt = 0;
let timeOfDay = 0; // 0 = 낮, 0.5 = 해질녘, 1 = 밤
let timeSliderDragging = false;
let skyTimeDragging = false;
let skyDragStartY = 0;
let skyDragStartTime = 0;
let lastSimulationSaveAt = 0;
let titleScreenActive = true;
let titleTransitionStartedAt = null;
let chickImage;
let middleChickenImage;
let adultChickenImage;
let farmClouds = [];
let roosterAudioContext = null;
let roosterAudioBuffer = null;
let roosterAudioLoading = false;
let roosterAudioUnlocked = false;
let roosterSourceNode = null;
let backgroundMusic = null;
let backgroundMusicStarted = false;
let backgroundMusicStarting = false;
let roosterCallTimerStarted = false;
let lastRoosterCallAt = 0;

const STORE_KEY = "farmEggNotes_v1";
const CHICK_STORE_KEY = "farmEggChicks_v1";
const CHICK_ZONE_MOVE_MIGRATION_KEY = "farmEggChickZoneMovedDown_v1";
const EGG_NUMBER_KEY = "farmEggNextNumber_v1";
const TIME_OF_DAY_KEY = "farmTimeOfDay_v1";
const SLOT_COUNT = 10;
const BASE_HEIGHT = 576;
const EXTRA_BOTTOM = 120; // 아래 초록색을 늘릴 픽셀 수
const NOTE_LIFE = 100 * 1000;
//잠깐 멈춰두려고 밑에거 추가하고 위에꺼 꺼둠
//const NOTE_LIFE = Infinity;
const HATCH_TIME = 2400;
const TITLE_TRANSITION_MS = 1500;

function loadFarmAssets() {
  // 이 프로젝트는 p5.js 2.x를 사용하므로 preload() 대신 setup()에서 비동기로 읽습니다.
  chickImage = loadImage(
    "./chick-sprite.png",
    (img) => {
      chickImage = img;
      console.log("사용자 병아리 이미지 로드 완료", img.width, img.height);
    },
    (error) =>
      console.error(
        "사용자 병아리 이미지 로드 실패: ./chick-sprite.png",
        error,
      ),
  );
  middleChickenImage = loadImage(
    "./middle-chicken-sprite.png",
    (img) => {
      middleChickenImage = img;
      console.log("사용자 중닭 이미지 로드 완료", img.width, img.height);
    },
    (error) =>
      console.error(
        "사용자 중닭 이미지 로드 실패: ./middle-chicken-sprite.png",
        error,
      ),
  );
  adultChickenImage = loadImage(
    "./adult-chicken-sprite.png",
    (img) => {
      adultChickenImage = img;
      console.log("사용자 성체 닭 이미지 로드 완료", img.width, img.height);
    },
    (error) =>
      console.error(
        "사용자 성체 닭 이미지 로드 실패: ./adult-chicken-sprite.png",
        error,
      ),
  );

  const farmTitleFace = new FontFace(
    "FarmTitleFont",
    'url("./title-font.ttf")',
  );
  document.fonts.add(farmTitleFace);
  farmTitleFace
    .load()
    .then(() => {
      console.log("뚝딱감자체 타이틀 폰트를 불러왔습니다.");
    })
    .catch((error) => console.error("타이틀 폰트 로드 실패:", error));

  const memoFont = new FontFace("MemoFont", 'url("./memo-font.ttf")');
  document.fonts.add(memoFont);
  memoFont
    .load()
    .then(() => {
      console.log("이서윤체 메모 폰트를 불러왔습니다.");
    })
    .catch((error) => console.error("이서윤체 메모 폰트 로드 실패:", error));

  const farmUIFont = new FontFace("FarmUIFont", 'url("./ui-font.ttf")');
  document.fonts.add(farmUIFont);
  farmUIFont
    .load()
    .then(() => {
      console.log("조선굴림체 안내 폰트를 불러왔습니다.");
    })
    .catch((error) => console.error("조선굴림체 폰트 로드 실패:", error));
}

function setup() {
  // Retina 화면에서도 축소·이동 중 선명하도록 논리 픽셀의 3배 해상도로 렌더링합니다.
  pixelDensity(3);
  createCanvas(1024, BASE_HEIGHT + EXTRA_BOTTOM);
  drawingContext.imageSmoothingEnabled = true;
  drawingContext.imageSmoothingQuality = "high";
  loadFarmAssets();
  initializeFarmClouds();
  rectMode(CORNER);
  ellipseMode(CENTER);
  textFont("FarmUIFont");

  timeOfDay = constrain(
    Number(localStorage.getItem(TIME_OF_DAY_KEY)) || 0,
    0,
    1,
  );
  // 첫 터치/클릭 안에서 AudioContext를 시작해야 iPad Safari에서도 재생됩니다.
  document.addEventListener("pointerdown", unlockFarmAudio, { once: true });
  document.addEventListener("touchstart", unlockFarmAudio, {
    once: true,
    passive: true,
  });
  loadNotes();
  loadChicks();
  initializeEggNumbers();
  buildUI();
  positionUI();
  setFarmUIVisible(false);
}

function draw() {
  const rawDt = min(deltaTime, 40) / 1000;
  updateFarmClouds(rawDt);
  const waitingAtTitle = titleScreenActive && titleTransitionStartedAt === null;
  let transitionProgress = 0;

  if (titleTransitionStartedAt !== null) {
    transitionProgress = constrain(
      (millis() - titleTransitionStartedAt) / TITLE_TRANSITION_MS,
      0,
      1,
    );
    if (transitionProgress >= 1) {
      titleScreenActive = false;
      titleTransitionStartedAt = null;
      setFarmUIVisible(true);
    }
  }

  const easedProgress =
    transitionProgress < 0.5
      ? 4 * transitionProgress * transitionProgress * transitionProgress
      : 1 - Math.pow(-2 * transitionProgress + 2, 3) / 2;
  const dt = waitingAtTitle ? 0 : rawDt;

  // 농장 장면은 제자리에 두고, 타이틀만 위로 빠지며 농장을 드러냅니다.
  push();
  drawSky();
  drawField();
  drawFence();
  drawChicks(dt);
  drawDeskAndCarton();
  drawChicksInFrontOfLegBottoms();

  if (!waitingAtTitle) {
    updateNotes(dt);
    updateRoosterCalls();
  }

  updateMassRelease();

  const chickIsLeaving = chicks.some((chick) => chick.leaving);

  // 문을 연 뒤 1.7초 동안 병아리를 고르지 않으면 자동으로 닫습니다.
  if (
    !waitingAtTitle &&
    gateOpen &&
    gateExitMode &&
    !massReleaseActive &&
    !chickIsLeaving &&
    millis() - gateOpenedAt >= 1700
  ) {
    gateOpen = false;
    gateExitMode = false;
  }

  if (
    !waitingAtTitle &&
    gateOpen &&
    !gateExitMode &&
    !chickIsLeaving &&
    millis() - gateOpenedAt >= 300
  ) {
    gateOpen = false;
  }

  drawTimeOfDayTint();
  drawGatePrompt();
  // 밤 효과가 달을 어둡게 덮지 않도록, 달과 후광은 그 위에 다시 그립니다.
  drawMoon();
  drawTimeOfDaySlider();
  pop();

  if (titleScreenActive) {
    drawTitleScreen(easedProgress);
  }

  if (!waitingAtTitle && millis() - lastSimulationSaveAt >= 1000) {
    saveNotes();
    saveChicks();
    lastSimulationSaveAt = millis();
  }
}

function setFarmUIVisible(visible) {
  const display = visible ? "block" : "none";
  if (addButton) addButton.elt.style.display = display;
  if (clearChicksButton) clearChicksButton.elt.style.display = display;
  if (resetFarmButton) resetFarmButton.elt.style.display = display;
}

function titleStartButtonBounds() {
  return {
    x: width / 2 - 130,
    y: height * 0.72 - 34,
    w: 260,
    h: 68,
  };
}

function drawTitleScreen(progress) {
  push();
  if (progress > 0) translate(0, -height * progress);
  drawingContext.globalAlpha = 1 - progress;

  // 저장된 시간대에 맞춰 타이틀 하늘도 낮, 노을, 밤 색으로 바뀝니다.
  const ctx = drawingContext;
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  const dayPalette = [color("#58b8e8"), color("#9bdcf2"), color("#e2f4f6")];
  const sunsetPalette = [color("#cf796b"), color("#efa47a"), color("#f6d5a3")];
  const nightPalette = [color("#142238"), color("#354b69"), color("#8292a7")];
  const titlePalette = dayPalette.map((dayColor, index) => {
    if (timeOfDay <= 0.5) {
      return lerpColor(dayColor, sunsetPalette[index], timeOfDay * 2);
    }
    return lerpColor(
      sunsetPalette[index],
      nightPalette[index],
      (timeOfDay - 0.5) * 2,
    );
  });
  sky.addColorStop(0, titlePalette[0].toString());
  sky.addColorStop(0.55, titlePalette[1].toString());
  sky.addColorStop(1, titlePalette[2].toString());
  noStroke();
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  // 농장과 같은 구름과 해·달을 같은 시간대에 맞춰 보여줍니다.
  const titleCloudTint = lerpColor(
    color("#f8fdff"),
    color("#78839a"),
    timeOfDay,
  );
  drawFarmClouds(165 - timeOfDay * 75, titleCloudTint);
  drawSunAndMoon(getSkyColorForTime(timeOfDay), true);

  // 나무 판과 나뭇결
  const boardX = width * 0.16;
  const boardY = height * 0.32;
  const boardW = width * 0.68;
  const boardH = height * 0.27;
  drawingContext.shadowColor = "rgba(47, 52, 54, 0.32)";
  drawingContext.shadowBlur = 18;
  drawingContext.shadowOffsetY = 10;
  fill("#70442f");
  rect(boardX, boardY, boardW, boardH, 22);
  drawingContext.shadowColor = "transparent";
  drawingContext.shadowBlur = 0;
  drawingContext.shadowOffsetY = 0;
  fill("#9a6139");
  rect(boardX + 10, boardY + 10, boardW - 20, boardH - 20, 16);
  fill("#ad7446");
  rect(boardX + 18, boardY + 18, boardW - 36, boardH - 36, 12);
  stroke("#c48a57");
  strokeWeight(2);
  line(
    boardX + 34,
    boardY + boardH * 0.28,
    boardX + boardW - 34,
    boardY + boardH * 0.28,
  );
  line(
    boardX + 34,
    boardY + boardH * 0.73,
    boardX + boardW - 34,
    boardY + boardH * 0.73,
  );
  noStroke();

  drawTitleText(
    "농장 비밀 노트",
    width / 2,
    boardY + boardH / 2,
    48,
    "#fff0cf",
  );

  const button = titleStartButtonBounds();
  fill("rgba(52, 83, 91, 0.18)");
  rect(button.x, button.y + 7, button.w, button.h, 18);
  fill("#805137");
  rect(button.x, button.y, button.w, button.h, 18);
  stroke("#f3d39b");
  strokeWeight(3);
  noFill();
  rect(button.x + 3, button.y + 3, button.w - 6, button.h - 6, 15);
  noStroke();
  drawTitleText("시작하기", width / 2, button.y + button.h / 2, 25, "#fff5dc");
  pop();
}

function drawTitleText(label, x, y, size, colorValue) {
  const ctx = drawingContext;
  ctx.save();
  ctx.font = `${size}px "FarmTitleFont", sans-serif`;
  ctx.fillStyle = colorValue;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x, y);
  ctx.restore();
}

function loadNotes() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY) || "[]");

    if (Array.isArray(saved)) {
      notes = saved
        .filter((note) => note && typeof note === "object")
        .map((note) => ({
          id: String(note.id || Date.now() + Math.random()),
          title: String(note.title || "이름 없는 메모"),
          favorite: Boolean(note.favorite),
          number: Number(note.number) || 0,
          body: String(note.body || ""),
          created: Number(note.created) || Date.now(),
          lifeElapsed: Number.isFinite(Number(note.lifeElapsed))
            ? Number(note.lifeElapsed)
            : max(0, Date.now() - (Number(note.created) || Date.now())),
          hatching: Boolean(note.hatching),
          hatchAt: Number(note.hatchAt) || 0,
          hatchElapsed: Number.isFinite(Number(note.hatchElapsed))
            ? Number(note.hatchElapsed)
            : note.hatching
              ? max(0, Date.now() - (Number(note.hatchAt) || Date.now()))
              : 0,
        }))
        .slice(0, SLOT_COUNT);
    }
  } catch (error) {
    notes = [];
  }
}
function initializeEggNumbers() {
  const savedNextNumber = Number(localStorage.getItem(EGG_NUMBER_KEY)) || 1;

  // 오래된 알부터 배열 앞에 놓아야 FIFO 순서가 유지됩니다.
  notes.sort((a, b) => a.created - b.created);

  let highestNumber = 0;

  for (const note of notes) {
    note.number = Number(note.number) || 0;
    highestNumber = max(highestNumber, note.number);
  }

  // 번호가 없던 기존 메모에는 작성 순서대로 번호를 붙입니다.
  if (highestNumber === 0) {
    for (let i = 0; i < notes.length; i++) {
      notes[i].number = i + 1;
    }
    highestNumber = notes.length;
  } else {
    for (const note of notes) {
      if (note.number === 0) {
        highestNumber++;
        note.number = highestNumber;
      }
    }
  }

  nextEggNumber = max(savedNextNumber, highestNumber + 1);
  localStorage.setItem(EGG_NUMBER_KEY, String(nextEggNumber));
  saveNotes();
}
function loadChicks() {
  try {
    const saved = JSON.parse(localStorage.getItem(CHICK_STORE_KEY) || "[]");

    if (Array.isArray(saved)) {
      chicks = saved
        .filter((chick) => chick && chick.memo)
        .map((chick, index) => ({
          id: String(chick.id || "chick-" + index),
          bornAt: Number(chick.bornAt) || Date.now(),
          ageElapsed: Number.isFinite(Number(chick.ageElapsed))
            ? Number(chick.ageElapsed)
            : max(0, Date.now() - (Number(chick.bornAt) || Date.now())),
          number: Number(chick.number) || index + 1,
          memo: {
            id: String(chick.memo.id || ""),
            title: String(chick.memo.title || "이름 없는 메모"),
            body: String(chick.memo.body || ""),
          },
          x: Number(chick.xRatio || 0.2) * width,
          y: Number(chick.yRatio || 0.75) * BASE_HEIGHT,
          direction: Number(chick.direction) || 1,
          speed: Number(chick.speed) || 55,
          verticalDirection:
            Number(chick.verticalDirection) || (random() < 0.5 ? -1 : 1),
          verticalSpeed: Number(chick.verticalSpeed) || random(8, 18),
          // 이전 저장 데이터에는 배수가 없으므로 한 번만 뽑아 아래에서 저장합니다.
          sizeMultiplier: constrain(
            Number(chick.sizeMultiplier) || random(1, 1.25),
            1,
            1.25,
          ),
          size: min(width * 0.0625, BASE_HEIGHT * 0.10125) * 0.97,
          phase: Number(chick.phase) || random(TWO_PI),
        }));

      // 저장된 닭도 새 크기 배수를 반영해, 기존 위치 범위 계산 전에 크기를 갱신합니다.
      for (const chick of chicks) chick.size = getChickSize(chick);
    }
  } catch (error) {
    chicks = [];
  }

  // 기존 병아리의 위치를 한 번만 아래로 이동합니다.
  if (localStorage.getItem(CHICK_ZONE_MOVE_MIGRATION_KEY) !== "done") {
    for (const chick of chicks) {
      chick.y += BASE_HEIGHT * 0.1;
    }
    localStorage.setItem(CHICK_ZONE_MOVE_MIGRATION_KEY, "done");
  }

  keepChicksInsideFence();

  saveChicks();
}

function unlockFarmAudio() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    console.error("이 브라우저는 Web Audio를 지원하지 않습니다.");
    return;
  }

  if (!roosterAudioContext) {
    roosterAudioContext = new AudioContextClass();
  }

  // resume()은 반드시 사용자 터치/클릭 이벤트 안에서 호출합니다.
  roosterAudioContext
    .resume()
    .then(() => {
      roosterAudioUnlocked = roosterAudioContext.state === "running";
    })
    .catch((error) => {
      console.error("오디오 시작 실패:", error);
    });

  // 배경음은 수탉 수와 관계없이 첫 사용자 입력에서 별도로 시작합니다.
  startFarmBackgroundMusic();

  if (!roosterAudioLoading && !roosterAudioBuffer) {
    roosterAudioLoading = true;
    fetch("./rooster.mp3")
      .then((response) => {
        if (!response.ok)
          throw new Error(`rooster.mp3 로드 실패: ${response.status}`);
        return response.arrayBuffer();
      })
      .then((audioData) => roosterAudioContext.decodeAudioData(audioData))
      .then((decodedAudio) => {
        roosterAudioBuffer = decodedAudio;
      })
      .catch((error) => {
        console.error("수탉 울음소리를 불러오지 못했습니다:", error);
      })
      .finally(() => {
        roosterAudioLoading = false;
      });
  }
}

function startFarmBackgroundMusic() {
  if (backgroundMusicStarted || backgroundMusicStarting) return;

  if (!backgroundMusic) {
    backgroundMusic = new Audio(
      "../%E1%84%8C%E1%85%B5%E1%84%82%E1%85%B3%E1%86%BC%E1%84%8B%E1%85%B5%20%E1%84%84%E1%85%A5%E1%86%AF%E1%84%8B%E1%85%A5%E1%84%8C%E1%85%B5%E1%84%82%E1%85%B3%E1%86%AB%20%E1%84%87%E1%85%B3%E1%84%80%E1%85%B3%E1%86%B7.mp3",
    );
    backgroundMusic.loop = true;
    backgroundMusic.preload = "auto";
    backgroundMusic.volume = 0.35;
  }

  // 단일 Audio 요소만 사용해 중복 재생이나 겹치는 루프를 방지합니다.
  backgroundMusicStarting = true;
  backgroundMusic
    .play()
    .then(() => {
      backgroundMusicStarted = true;
      backgroundMusicStarting = false;
    })
    .catch((error) => {
      backgroundMusicStarting = false;
      console.error("배경음악 재생 실패:", error);
    });
}

function playRoosterIfReady() {
  if (
    !roosterAudioUnlocked ||
    !roosterAudioBuffer ||
    !roosterAudioContext ||
    roosterAudioContext.state !== "running" ||
    roosterSourceNode
  ) {
    return false;
  }

  roosterSourceNode = roosterAudioContext.createBufferSource();
  roosterSourceNode.buffer = roosterAudioBuffer;
  roosterSourceNode.connect(roosterAudioContext.destination);
  roosterSourceNode.onended = () => {
    roosterSourceNode = null;
  };
  roosterSourceNode.start();
  lastRoosterCallAt = millis();
  return true;
}

function updateRoosterCalls() {
  const adultRoosters = chicks.filter(
    (chick) => !chick.leaving && (chick.ageElapsed || 0) >= 150 * 1000,
  ).length;
  const manyRoosters = adultRoosters >= 10;
  const isNight = getIsNight();

  // 10마리 미만은 밤에 쉬고, 진행 중이던 울음도 멈춥니다.
  if (isNight && !manyRoosters) {
    roosterCallTimerStarted = false;
    if (roosterSourceNode) roosterSourceNode.stop();
    return;
  }

  if (adultRoosters < 2) {
    roosterCallTimerStarted = false;
    return;
  }

  // 10마리 이상: 낮 10초, 해질녘 20초, 밤 40초.
  // 10마리 미만: 낮 15초, 해질녘 30초, 밤에는 울지 않습니다.
  const callInterval = isNight
    ? 40000
    : timeOfDay >= 0.5
      ? manyRoosters
        ? 20000
        : 30000
      : manyRoosters
        ? 10000
        : 15000;

  if (!roosterCallTimerStarted) {
    roosterCallTimerStarted = true;
    // 조건을 처음 만족하면 바로 한 번 울고, 이후 시간대별 간격으로 반복합니다.
    lastRoosterCallAt = millis() - callInterval;
  }

  if (millis() - lastRoosterCallAt >= callInterval) {
    playRoosterIfReady();
  }
}

function getMovementRate() {
  if (timeOfDay <= 0.5) return lerp(1, 0.45, timeOfDay * 2);
  return lerp(0.45, 0.15, (timeOfDay - 0.5) * 2);
}

function getGrowthRate() {
  if (timeOfDay >= 0.7) return 0;
  if (timeOfDay <= 0.5) return lerp(1, 0.3, timeOfDay * 2);
  return lerp(0.3, 0, (timeOfDay - 0.5) / 0.2);
}

function getEggLifeRate() {
  if (timeOfDay >= 0.7) return 0;
  if (timeOfDay <= 0.5) return lerp(1, 0.3, timeOfDay * 2);
  return lerp(0.3, 0, (timeOfDay - 0.5) / 0.2);
}

function getHatchRate() {
  if (timeOfDay >= 0.7) return 0.5;
  if (timeOfDay <= 0.5) return lerp(1, 0.5, timeOfDay * 2);
  return lerp(0.5, 0, (timeOfDay - 0.5) / 0.2);
}

function getIsNight() {
  return timeOfDay >= 0.7;
}

function timeSliderBounds() {
  // 입력 버튼(48px 높이)의 세로 중앙과 나란히 둡니다.
  return {
    left: width * 0.57,
    right: width * 0.94,
    y: BASE_HEIGHT * 0.91 + 70 + 24,
  };
}

function drawTimeOfDayTint() {
  if (timeOfDay < 0.52) return;
  const darkness = map(timeOfDay, 0.52, 1, 0, 105, true);
  noStroke();
  fill(20, 31, 58, darkness);
  rect(0, 0, width, height);
}

function drawTimeOfDaySlider() {
  const bounds = timeSliderBounds();
  const mid = (bounds.left + bounds.right) / 2;
  const handleX = lerp(bounds.left, bounds.right, timeOfDay);

  push();
  noStroke();
  fill(255, 255, 255, 82);
  rect(
    bounds.left - 30,
    bounds.y - 27,
    bounds.right - bounds.left + 60,
    54,
    18,
  );

  stroke("#f7ebcb");
  strokeWeight(4);
  line(bounds.left, bounds.y, bounds.right, bounds.y);
  noStroke();
  fill("#f7ebcb");
  circle(bounds.left, bounds.y, 7);
  circle(mid, bounds.y, 7);
  circle(bounds.right, bounds.y, 7);

  // 낮: 해 / 해질녘: 지는 해 / 밤: 초승달
  const iconY = bounds.y - 13;
  noStroke();
  fill("#ffd979");
  circle(bounds.left, iconY, 17);

  fill("#f4b273");
  arc(mid, iconY + 3, 19, 19, PI, TWO_PI, CHORD);
  stroke("#f4b273");
  strokeWeight(2);
  line(mid - 11, iconY + 4, mid + 11, iconY + 4);

  noStroke();
  fill("#ffef94");
  circle(bounds.right, iconY, 18);

  fill("#fff8e8");
  stroke("#70462f");
  strokeWeight(2);
  circle(handleX, bounds.y, 18);

  noStroke();
  fill("#fff8e8");
  textAlign(CENTER, CENTER);
  textSize(13);
  text("낮", bounds.left, bounds.y + 17);
  text("해질녘", mid, bounds.y + 17);
  text("밤", bounds.right, bounds.y + 17);
  pop();
}

function timeSliderHit(mx, my) {
  const bounds = timeSliderBounds();
  return (
    mx >= bounds.left - 28 &&
    mx <= bounds.right + 28 &&
    my >= bounds.y - 26 &&
    my <= bounds.y + 26
  );
}

function skyTimeDragHit(mx, my) {
  // 슬라이더를 아래로 옮겨도 하늘 드래그 구역은 하늘 안에 유지합니다.
  const topOfSkyDrag = 55;
  const bottomOfSkyDrag = BASE_HEIGHT * 0.43;
  return my >= topOfSkyDrag && my <= bottomOfSkyDrag;
}

function setTimeOfDayFromPointer() {
  const bounds = timeSliderBounds();
  timeOfDay = constrain(map(mouseX, bounds.left, bounds.right, 0, 1), 0, 1);
}

function setTimeOfDayFromSkyPointer() {
  // 누른 위치가 아니라, 누른 뒤 움직인 거리만큼 시간대를 바꿉니다.
  // 아래로 끌면 밤 쪽으로, 위로 끌면 낮 쪽으로 천천히 이동합니다.
  const verticalTravelForFullDay = BASE_HEIGHT * 0.47;
  const timeChange = (mouseY - skyDragStartY) / verticalTravelForFullDay;
  timeOfDay = constrain(skyDragStartTime + timeChange, 0, 1);
}

function createFarmCloud(x) {
  const puffCount = floor(random(4, 8));
  const puffs = [];

  for (let i = 0; i < puffCount; i++) {
    const spread = puffCount <= 1 ? 0 : map(i, 0, puffCount - 1, -0.36, 0.36);
    puffs.push({
      x: spread + random(-0.09, 0.09),
      y: random(-0.18, 0.08),
      w: random(0.25, 0.43),
      h: random(0.38, 0.72),
    });
  }

  return {
    x,
    y: random(92, BASE_HEIGHT * 0.37),
    w: random(95, 205),
    h: random(32, 66),
    speed: random(12, 27) * 1.25,
    floatAmplitude: random(2, 8),
    floatSpeed: random(0.55, 1.2),
    phase: random(TWO_PI),
    puffs,
  };
}

function initializeFarmClouds() {
  farmClouds = [];
  const cloudCount = 5;
  for (let i = 0; i < cloudCount; i++) {
    farmClouds.push(createFarmCloud(random(-width * 0.12, width * 1.05)));
  }
}

function updateFarmClouds(dt) {
  for (let i = 0; i < farmClouds.length; i++) {
    const cloud = farmClouds[i];
    cloud.x -= cloud.speed * dt;

    // 구름이 왼쪽 끝을 완전히 지나면 오른쪽에서 새 모양으로 나타납니다.
    if (cloud.x + cloud.w * 0.55 < 0) {
      farmClouds[i] = createFarmCloud(width + random(35, 190));
    }
  }
}

function drawFarmClouds(opacity, tint) {
  const ctx = drawingContext;
  const cloudColor = color(tint);
  const topColor = lerpColor(cloudColor, color("#ffffff"), 0.34);
  const lowerColor = lerpColor(cloudColor, color("#9bb4c2"), 0.12);
  const toRgba = (c, alpha) =>
    `rgba(${Math.round(red(c))}, ${Math.round(green(c))}, ${Math.round(blue(c))}, ${constrain(alpha / 255, 0, 1)})`;

  for (const cloud of farmClouds) {
    const y =
      cloud.y +
      sin(millis() * 0.001 * cloud.floatSpeed + cloud.phase) *
        cloud.floatAmplitude;

    // 베지어 곡선 하나로 구름 외곽을 이어, 동그란 타원을 붙인 듯한 경계를 없앱니다.
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cloud.x - cloud.w * 0.48, y + cloud.h * 0.12);
    ctx.bezierCurveTo(
      cloud.x - cloud.w * 0.57, y - cloud.h * 0.04,
      cloud.x - cloud.w * 0.43, y - cloud.h * 0.34,
      cloud.x - cloud.w * 0.22, y - cloud.h * 0.27,
    );
    ctx.bezierCurveTo(
      cloud.x - cloud.w * 0.16, y - cloud.h * 0.59,
      cloud.x + cloud.w * 0.15, y - cloud.h * 0.55,
      cloud.x + cloud.w * 0.20, y - cloud.h * 0.27,
    );
    ctx.bezierCurveTo(
      cloud.x + cloud.w * 0.39, y - cloud.h * 0.42,
      cloud.x + cloud.w * 0.55, y - cloud.h * 0.20,
      cloud.x + cloud.w * 0.45, y - cloud.h * 0.02,
    );
    ctx.bezierCurveTo(
      cloud.x + cloud.w * 0.57, y + cloud.h * 0.03,
      cloud.x + cloud.w * 0.48, y + cloud.h * 0.24,
      cloud.x + cloud.w * 0.30, y + cloud.h * 0.22,
    );
    ctx.bezierCurveTo(
      cloud.x + cloud.w * 0.12, y + cloud.h * 0.36,
      cloud.x - cloud.w * 0.17, y + cloud.h * 0.31,
      cloud.x - cloud.w * 0.27, y + cloud.h * 0.21,
    );
    ctx.bezierCurveTo(
      cloud.x - cloud.w * 0.43, y + cloud.h * 0.28,
      cloud.x - cloud.w * 0.55, y + cloud.h * 0.23,
      cloud.x - cloud.w * 0.48, y + cloud.h * 0.12,
    );
    ctx.closePath();

    const gradient = ctx.createLinearGradient(
      0,
      y - cloud.h * 0.55,
      0,
      y + cloud.h * 0.42,
    );
    gradient.addColorStop(0, toRgba(topColor, opacity));
    gradient.addColorStop(0.58, toRgba(cloudColor, opacity));
    gradient.addColorStop(1, toRgba(lowerColor, opacity * 0.94));
    ctx.fillStyle = gradient;
    ctx.shadowColor = toRgba(cloudColor, opacity * 0.1);
    ctx.shadowBlur = cloud.h * 0.16;
    ctx.shadowOffsetY = cloud.h * 0.035;
    ctx.fill();
    ctx.restore();
  }
}

function getSkyColorForTime(value) {
  const dayColor = color("#8ed8f2");
  const sunsetColor = color("#f2a477");
  const nightColor = color("#243653");
  if (value <= 0.5) {
    return lerpColor(dayColor, sunsetColor, value * 2);
  }
  return lerpColor(sunsetColor, nightColor, (value - 0.5) * 2);
}

function drawSky() {
  const skyColor = getSkyColorForTime(timeOfDay);
  background(skyColor);
  noStroke();

  const cloudColor = lerpColor(color("#d8f4ff"), color("#68758e"), timeOfDay);
  const cloudAlpha = 190 - timeOfDay * 95;
  drawFarmClouds(cloudAlpha, cloudColor);
  // 해는 기존처럼 지평선 아래로 내려가 들판에 가려집니다. 달은 밤 효과 위에 별도로 그립니다.
  drawSunAndMoon(skyColor, false, false);
}

function drawSunAndMoon(
  skyColor,
  showOnlyHigherBody = false,
  includeMoon = true,
) {
  const sunY = lerp(BASE_HEIGHT * 0.11, BASE_HEIGHT * 0.58, timeOfDay);
  const moonProgress = constrain((timeOfDay - 0.58) / 0.42, 0, 1);
  const moonAlpha = 255 * constrain(moonProgress * 2.2, 0, 1);

  // 타이틀 화면에서는 달이 뜨기 시작하면 해를 숨겨 한 번에 하나만 보입니다.
  if (!showOnlyHigherBody || moonAlpha <= 0) {
    noStroke();
    const sunsetRed = constrain(timeOfDay * 2, 0, 1);
    fill(lerpColor(color("#ff9a45"), color("#e94b3c"), sunsetRed));
    ellipse(width * 0.86, sunY, 70, 70);
  }

  if (includeMoon) drawMoon();
}

function drawMoon() {
  const moonProgress = constrain((timeOfDay - 0.58) / 0.42, 0, 1);
  const moonY = lerp(-32, BASE_HEIGHT * 0.11, moonProgress);
  const moonX = width * 0.86;
  const moonAlpha = 255 * constrain(moonProgress * 2.2, 0, 1);

  if (moonAlpha > 0) {
    const glow = drawingContext.createRadialGradient(
      moonX,
      moonY,
      5,
      moonX,
      moonY,
      78,
    );
    const glowStrength = moonAlpha / 255;
    glow.addColorStop(0, `rgba(255, 247, 214, ${0.34 * glowStrength})`);
    glow.addColorStop(0.42, `rgba(255, 239, 185, ${0.16 * glowStrength})`);
    glow.addColorStop(1, "rgba(255, 239, 185, 0)");
    drawingContext.save();
    drawingContext.fillStyle = glow;
    drawingContext.fillRect(moonX - 78, moonY - 78, 156, 156);
    drawingContext.restore();
  }

  noStroke();
  fill(255, 239, 148, moonAlpha);
  circle(moonX, moonY, 70);
}

function drawField() {
  noStroke();

  fill("#77bd57");
  rect(0, BASE_HEIGHT * 0.43, width, height - BASE_HEIGHT * 0.43);

  fill("#68aa4d");
  ellipse(width * 0.12, BASE_HEIGHT * 0.53, width * 0.5, BASE_HEIGHT * 0.24);
  ellipse(width * 0.8, BASE_HEIGHT * 0.5, width * 0.6, BASE_HEIGHT * 0.2);

  for (let i = 0; i < 18; i++) {
    const x = (i * 91 + 25) % width;
    const y = BASE_HEIGHT * (0.55 + (i % 5) * 0.08);

    fill(i % 2 ? "#fff2a2" : "#ffd3a0");
    ellipse(x, y, 7, 7);
  }
}

function drawFence() {
  const y = BASE_HEIGHT * 0.43;
  const gateX = width * 0.75;

  stroke("#87532f");
  strokeWeight(max(8, width * 0.012));
  const gapLeft = width * 0.77; // 8번째 기둥
  const gapRight = width * 0.99; // 10번째 기둥

  line(0, y, gapLeft, y);
  line(gapRight, y, width, y);

  line(0, y + BASE_HEIGHT * 0.12, gapLeft, y + BASE_HEIGHT * 0.12);
  line(gapRight, y + BASE_HEIGHT * 0.12, width, y + BASE_HEIGHT * 0.12);

  for (let i = 0; i <= 9; i++) {
    if (i === 8) continue;

    const x = width * 0.11 * i;
    line(x, y - BASE_HEIGHT * 0.04, x, y + BASE_HEIGHT * 0.16);
  }

  noStroke();

  const gateWidth = width * 0.24;
  const gateHeight = height * 0.14;
  const leafWidth = gateWidth / 2;
  const gateTop = y - height * 0.02;
  const depth = width * 0.035;

  if (gateOpen) {
    // 문이 열린 동안에는 문짝을 그리지 않습니다.
  } else {
    // 닫혔을 때는 기존 문 모양을 유지합니다.
    fill("#a66b3e");
    rect(gateX, gateTop, gateWidth, gateHeight, 5);

    for (let x = gateX + width * 0.04; x < width * 0.99; x += width * 0.06) {
      rect(x, gateTop, width * 0.016, gateHeight, 3);
    }

    // 문 오른쪽에 둥근 손잡이를 그립니다.
    noStroke();
    fill("#f2c66d");
    ellipse(
      gateX + gateWidth * 0.14,
      gateTop + gateHeight * 0.52,
      max(8, width * 0.014),
      max(8, width * 0.014),
    );
  }
}

function drawGatePrompt() {
  const gateX = width * 0.75;
  const y = BASE_HEIGHT * 0.43;
  push();
  textFont("FarmUIFont");
  textAlign(CENTER, CENTER);
  textSize(14);
  noStroke();
  fill("#fff8e8");
  text("문을 눌러 열기", gateX + width * 0.12, y + BASE_HEIGHT * 0.18);
  pop();
}

function cartonLayout() {
  const deskX = width * 0.04;
  const deskY = BASE_HEIGHT * 0.64;
  const deskWidth = width * 0.52;

  return {
    deskX: deskX,
    deskY: deskY,
    deskWidth: deskWidth,
    trayX: deskX + width * 0.025,
    trayY: deskY - BASE_HEIGHT * 0.105,
    trayWidth: deskWidth * 0.91,
    trayHeight: BASE_HEIGHT * 0.14,
  };
}

function getEggPosition(index) {
  const box = cartonLayout();

  // 알은 앞줄 오른쪽부터 채우고, 다음에 뒷줄 오른쪽부터 채웁니다.
  const col = 4 - (index % 5);
  const row = floor(index / 5);
  const cavityY = box.trayY + box.trayHeight * (row === 0 ? 0.72 : 0.36);

  return {
    x: box.trayX + box.trayWidth * (0.12 + col * 0.19),
    y: cavityY - box.trayHeight * 0.3,
    w: box.trayWidth * 0.17,
    h: box.trayHeight * 0.78,
  };
}

function drawDeskAndCarton() {
  const box = cartonLayout();

  // 책상
  noStroke();
  fill("#9a6037");
  rect(box.deskX, box.deskY, box.deskWidth, BASE_HEIGHT * 0.045, 8);

  fill("#77472e");
  rect(
    box.deskX + width * 0.03,
    box.deskY + BASE_HEIGHT * 0.02,
    width * 0.025,
    BASE_HEIGHT * 0.27,
  );
  rect(
    box.deskX + box.deskWidth - width * 0.06,
    box.deskY + BASE_HEIGHT * 0.02,
    width * 0.025,
    BASE_HEIGHT * 0.27,
  );

  // 계란판 바닥과 홈
  noStroke();
  fill("#b8b9b5");
  rect(box.trayX, box.trayY, box.trayWidth, box.trayHeight, 12);

  fill("#d1d2ce");
  rect(
    box.trayX + box.trayWidth * 0.03,
    box.trayY + box.trayHeight * 0.11,
    box.trayWidth * 0.94,
    box.trayHeight * 0.72,
    10,
  );

  for (let i = 0; i < SLOT_COUNT; i++) {
    const col = i % 5;
    const row = floor(i / 5);
    const cavityX = box.trayX + box.trayWidth * (0.12 + col * 0.19);
    const cavityY = box.trayY + box.trayHeight * (row === 0 ? 0.36 : 0.72);

    fill("#b9bab6");
    ellipse(cavityX, cavityY, box.trayWidth * 0.16, box.trayHeight * 0.39);
  }

  // 뒷줄 알을 먼저 그려 앞줄 알이 위에 보이게 합니다.
  for (let i = 5; i < notes.length; i++) {
    const egg = getEggPosition(i);
    drawEgg(egg.x, egg.y, egg.w, egg.h, notes[i], notes[i].number);
  }

  // 앞줄 알을 그리기 전에 같은 열의 뒷줄 알과 겹치는지 확인합니다.
  for (let i = 0; i < min(notes.length, 5); i++) {
    const egg = getEggPosition(i);
    const backIndex = i + 5;

    if (notes[backIndex]) {
      const backEgg = getEggPosition(backIndex);

      const overlapX = abs(backEgg.x - egg.x) < (backEgg.w + egg.w) * 0.375;
      const overlapY = abs(backEgg.y - egg.y) < (backEgg.h + egg.h) * 0.61;

      if (overlapX && overlapY) {
        noStroke();
        fill(70, 55, 40, 22);

        const radiusX = (egg.w * 0.75) / 2;
        const radiusY = (egg.h * 1.22) / 2;

        // 작은 타원 9개를 알의 윗곡선을 따라 겹쳐 그립니다.
        push();
        noFill();
        stroke(185, 186, 182, 100);
        strokeWeight(max(10, min(width, BASE_HEIGHT) * 0.018));
        strokeCap(ROUND);

        // 알의 윗곡선을 따라 일정한 굵기와 투명도로 그림자를 그립니다.
        arc(egg.x, egg.y, egg.w * 0.67, egg.h * 1.18, PI + 0.6, TWO_PI - 0.6);
        pop();
      }
    }

    // 그림자를 먼저 그리고 앞줄 알을 나중에 그립니다.
    drawEgg(egg.x, egg.y, egg.w, egg.h, notes[i], notes[i].number);
  }

  // 중간 가려짐
  fill("#b8b9b5");
  rect(
    box.trayX,
    box.trayY + box.trayHeight * 0.65,
    box.trayWidth * 0.98,
    box.trayHeight * 0.12,
    5,
  );
  //밑부분 가려지게 밑부분 가려짐
  fill("#b8b9b5");
  rect(
    box.trayX,
    box.trayY + box.trayHeight * 0.82,
    box.trayWidth * 0.98,
    box.trayHeight * 0.09,
    5,
  );
  //중간가려짐 위에흰거
  fill("#d1d2ce");
  rect(
    box.trayX + 21.6,
    box.trayY + box.trayHeight * 0.64,
    box.trayWidth * 0.94,
    box.trayHeight * 0.035,
    4,
  );

  fill("#64503f");
  textAlign(LEFT);
  textSize(13);
}

function drawEgg(x, y, eggW, eggH, note, eggNumber) {
  push();
  translate(x, y);

  if (note.hatching) {
    rotate(sin(millis() * 0.035) * 0.09);
  }

  // 알 그리기
  noStroke();
  fill("#fffaf0");
  ellipse(0, 0, eggW * 0.75, eggH * 1.22);

  // 알 표면의 빛 반사
  fill("#ffffff");
  ellipse(-eggW * 0.15, -eggH * 0.19, eggW * 0.22, eggH * 0.3);

  // 알 윗부분에 고정된 생성 순번 표시
  fill("#4a392a");
  textAlign(CENTER, CENTER);
  textFont("MemoFont");
  const numberFontSize = max(8, eggW * 0.18);
  textSize(numberFontSize);
  const numberLabel = String(eggNumber);
  const numberY = -eggH * 0.32;
  text(numberLabel, 0, numberY);
  if (note.favorite) {
    const starSize = max(7, numberFontSize * 0.82);
    const starOffset = textWidth(numberLabel) / 2 + starSize * 0.62;
    drawFavoriteStar(
      -starOffset,
      numberY,
      starSize,
    );
    drawFavoriteStar(
      starOffset,
      numberY,
      starSize,
    );
  }

  // 부화 중인 알에 금 그리기
  if (note.hatching) {
    stroke("#7f6650");
    strokeWeight(2);

    // 알 가운데를 가로지르는 지그재그 금
    line(-eggW * 0.375, 0, -eggW * 0.27, -eggH * 0.1);
    line(-eggW * 0.27, -eggH * 0.1, -eggW * 0.16, eggH * 0.015);
    line(-eggW * 0.16, eggH * 0.015, -eggW * 0.05, -eggH * 0.095);
    line(-eggW * 0.05, -eggH * 0.095, eggW * 0.07, eggH * 0.02);
    line(eggW * 0.07, eggH * 0.02, eggW * 0.18, -eggH * 0.09);
    line(eggW * 0.18, -eggH * 0.09, eggW * 0.28, eggH * 0.015);
    line(eggW * 0.28, eggH * 0.015, eggW * 0.375, 0);

    // 가운데 금에서 갈라지는 짧은 금
    line(-eggW * 0.27, -eggH * 0.1, -eggW * 0.31, -eggH * 0.2);
    line(-eggW * 0.31, -eggH * 0.2, -eggW * 0.23, -eggH * 0.25);
    line(eggW * 0.18, -eggH * 0.09, eggW * 0.22, -eggH * 0.19);
    line(eggW * 0.22, -eggH * 0.19, eggW * 0.31, -eggH * 0.22);
  }

  pop();
}

function drawChicks(dt) {
  const margin = max(18, min(width, BASE_HEIGHT) * 0.04);
  const minX = margin;
  const maxX = width - margin;
  const carton = cartonLayout();
  const escapedIds = [];

  const movementRate = getMovementRate();
  const growthRate = getGrowthRate();

  for (const chick of chicks) {
    chick.ageElapsed = (chick.ageElapsed || 0) + dt * 1000 * growthRate;
    chick.size = getChickSize(chick);

    if (chick.leaving) {
      const targetX = width * 0.88;
      const targetY = BASE_HEIGHT * 0.49;
      const dx = targetX - chick.x;
      const step = width * 0.38 * dt * movementRate;
      const gateBottomY = BASE_HEIGHT * (0.43 + 0.12);
      const gateEntryY = gateBottomY + chick.size / 2;

      // 문 가까이에서 경로를 부드럽게 꺾고, 문턱을 넘으며 천천히 작아집니다.
      if (abs(dx) > 1) {
        const turnRange = width * 0.07;
        const turnAmount = constrain(1 - abs(dx) / turnRange, 0, 1);
        const smoothTurn = turnAmount * turnAmount * (3 - 2 * turnAmount);
        const horizontalFactor = max(0.12, sqrt(1 - smoothTurn * smoothTurn));
        const moveX = min(abs(dx), step * horizontalFactor);
        const distanceToEntry = max(0, chick.y - gateEntryY);
        const moveY = min(distanceToEntry, step * smoothTurn);

        chick.x += Math.sign(dx) * moveX;
        chick.y -= moveY;
        chick.direction = dx >= 0 ? 1 : -1;
      } else if (chick.y > gateEntryY) {
        chick.y -= min(chick.y - gateEntryY, step);
      } else {
        const slowStep = width * 0.14 * dt * movementRate;
        const remainingInsideDistance = abs(targetY - chick.y);
        if (remainingInsideDistance <= slowStep) {
          escapedIds.push(chick.id);
          continue;
        }

        chick.y -= slowStep;
        const shrinkProgress = constrain(
          (gateEntryY - chick.y) / (gateEntryY - targetY),
          0,
          1,
        );
        const smoothShrink =
          shrinkProgress * shrinkProgress * (3 - 2 * shrinkProgress);
        chick.size *= lerp(1, 0.06, smoothShrink);
      }

      drawChick(chick);
      continue;
    }

    const half = chick.size * 0.5;
    const yBounds = chickYBounds(chick, carton);

    // 병아리마다 고유 속도로 좌우 이동합니다.
    chick.x += chick.direction * chick.speed * dt * movementRate;

    if (chick.x <= minX + half) {
      chick.x = minX + half;
      chick.direction = 1;
    } else if (chick.x >= maxX - half) {
      chick.x = maxX - half;
      chick.direction = -1;
    }

    // 초록 평원 안에서 천천히 위아래로 움직입니다.
    chick.y +=
      chick.verticalDirection * chick.verticalSpeed * dt * movementRate;

    if (chick.y <= yBounds.min) {
      chick.y = yBounds.min;
      chick.verticalDirection = 1;
    } else if (chick.y >= yBounds.max) {
      chick.y = yBounds.max;
      chick.verticalDirection = -1;
    }

    drawChick(chick);
  }

  if (escapedIds.length > 0) {
    const escaped = new Set(escapedIds);
    chicks = chicks.filter((chick) => !escaped.has(chick.id));
    saveChicks();

    if (massReleaseActive) {
      massReleaseNextAt =
        massReleaseQueue.length > 0 ? millis() + 150 : millis();
    } else if (!chicks.some((chick) => chick.leaving)) {
      gateExitMode = false;
      gateOpenedAt = millis();
    }
  }
}

function drawChicksInFrontOfLegBottoms() {
  const box = cartonLayout();
  const legY = box.deskY + BASE_HEIGHT * 0.02;
  const legHeight = BASE_HEIGHT * 0.27;
  const legWidth = width * 0.025;
  const bottomThirdY = legY + legHeight * (2 / 3);
  const leftLegX = box.deskX + width * 0.03;
  const rightLegX = box.deskX + box.deskWidth - width * 0.06;

  for (const chick of chicks) {
    const half = chick.size / 2;
    const overlapsLegX =
      (chick.x + half > leftLegX && chick.x - half < leftLegX + legWidth) ||
      (chick.x + half > rightLegX && chick.x - half < rightLegX + legWidth);
    const isBelowLegBottomThird = chick.y + half >= bottomThirdY;

    if (overlapsLegX && isBelowLegBottomThird) {
      drawChick(chick);
    }
  }
}

function drawChick(chick) {
  const s = chick.size;
  const movementRate = getMovementRate();
  // 밤에는 좌우 이동뿐 아니라 위아래 흔들림도 함께 천천히, 작게 줄입니다.
  const bob =
    sin(millis() * 0.008 * movementRate + chick.phase) *
    s * 0.025 * movementRate;
  const ageMs = chick.ageElapsed || 0;
  const hasComb = ageMs >= 90 * 1000;
  const isChicken = ageMs >= 150 * 1000;

  push();
  // 좌표를 픽셀 단위로 반올림하지 않아 저속 이동 중 생기는 덜컥거림을 막습니다.
  translate(chick.x, chick.y + bob);
  scale(chick.direction, 1);

  const growthImage = isChicken
    ? adultChickenImage
    : hasComb
      ? middleChickenImage
      : chickImage;

  // preload()가 불러온 p5.Image는 complete/naturalWidth가 아니라 width/height를 씁니다.
  if (growthImage && growthImage.width > 0 && growthImage.height > 0) {
    let sx = 0;
    let sy = 0;
    let sw = growthImage.width;
    let sh = growthImage.height;

    if (!isChicken && hasComb) {
      sx = 550;
      sy = 1300;
      sw = 1400;
      sh = 1500;
    } else if (!isChicken) {
      sx = 550;
      sy = 1600;
      sw = 1180;
      sh = 1200;
    }

    const rawHeight = isChicken ? s * (sh / sw) : s * 0.93;
    const rawWidth = rawHeight * (sw / sh);
    // 위치는 소수점 그대로 움직이게 두고, 이미지 크기만 실제 캔버스 픽셀에 맞춰
    // 고정해 프레임마다 재표본화되며 생기는 가장자리 지직거림을 줄입니다.
    const density = pixelDensity();
    const drawHeight = Math.round(rawHeight * density) / density;
    const drawWidth = Math.round(rawWidth * density) / density;
    imageMode(CENTER);
    image(growthImage, 0, 0, drawWidth, drawHeight, sx, sy, sw, sh);
  }

  // 몸통 위 번호는 이미지 방향과 상관없이 읽히도록 다시 좌우 반전합니다.
  scale(chick.direction, 1);
  noStroke();
  fill("#4a392a");
  textAlign(CENTER, CENTER);
  textFont("MemoFont");
  const baseChickSize = min(width * 0.0625, BASE_HEIGHT * 0.10125) * 0.97;
  const numberGrowth = min(s / baseChickSize, 1.3);
  const numberFontSize = max(6, baseChickSize * 0.24 * numberGrowth);
  textSize(numberFontSize);
  const numberLabel = String(chick.number);
  const numberX = s * 0.18;
  const numberY = s * 0.21;
  text(numberLabel, numberX, numberY);
  if (chick.memo && chick.memo.favorite) {
    const starSize = max(8, numberFontSize * 0.82);
    const starOffset = textWidth(numberLabel) / 2 + starSize * 0.62;
    drawFavoriteStar(
      numberX - starOffset,
      numberY,
      starSize,
    );
    drawFavoriteStar(
      numberX + starOffset,
      numberY,
      starSize,
    );
  }
  pop();
}

function drawFavoriteStar(x, y, size) {
  push();
  noStroke();
  fill("#ffd84d");
  beginShape();
  for (let i = 0; i < 10; i++) {
    const angle = -HALF_PI + (i * TWO_PI) / 10;
    const radius = (i % 2 === 0 ? size : size * 0.43) / 2;
    vertex(x + cos(angle) * radius, y + sin(angle) * radius);
  }
  endShape(CLOSE);
  pop();
}

function addChickFromNote(note) {
  const margin = max(20, min(width, BASE_HEIGHT) * 0.05);
  const chickSize = min(width * 0.0625, BASE_HEIGHT * 0.10125) * 0.97;
  const carton = cartonLayout();
  const x = random(margin, max(margin + 1, width - margin));
  const sizeMultiplier = random(1, 1.25);
  const chick = {
    id: "chick-" + note.id,
    bornAt: Date.now(),
    ageElapsed: 0,
    number: note.number,
    memo: {
      id: note.id,
      title: note.title,
      body: note.body,
      favorite: Boolean(note.favorite),
    },
    x: x,
    y: 0,
    direction: random() < 0.5 ? -1 : 1,
    speed: random(35, 95),
    verticalDirection: random() < 0.5 ? -1 : 1,
    verticalSpeed: random(8, 18),
    sizeMultiplier: sizeMultiplier,
    size: chickSize * sizeMultiplier,
    phase: random(TWO_PI),
  };
  const yBounds = chickYBounds(chick, carton);
  chick.y = random(yBounds.min, yBounds.max);
  chicks.push(chick);
  if (massReleaseActive) massReleaseQueue.push(chick.id);

  saveChicks();
}

function keepChicksInsideFence() {
  const margin = max(20, min(width, BASE_HEIGHT) * 0.05);
  const carton = cartonLayout();

  for (const chick of chicks) {
    chick.x = constrain(chick.x, margin, width - margin);
    if (!chick.verticalDirection)
      chick.verticalDirection = random() < 0.5 ? -1 : 1;
    if (!chick.verticalSpeed) chick.verticalSpeed = random(8, 18);
    const yBounds = chickYBounds(chick, carton);
    chick.y = constrain(chick.y, yBounds.min, yBounds.max);
  }
}

function chickYBounds(chick, box) {
  // 가장 크게 뽑힌 성체도 울타리와 메모 입력 버튼에 가리지 않게 여유를 둡니다.
  const adultSize =
    min(width * 0.0625, BASE_HEIGHT * 0.10125) * 0.97 * 1.4 * 1.25;
  const adultHalf = adultSize / 2;
  const buttonY = BASE_HEIGHT * 0.91 + 70;
  const fenceBottom = BASE_HEIGHT * (0.43 + 0.16);
  const minY = fenceBottom + adultHalf + 8;
  const maxY = buttonY - adultHalf - 12;
  const overlapsCartonX =
    chick.x + adultHalf > box.trayX &&
    chick.x - adultHalf < box.trayX + box.trayWidth;
  const safeMinY = overlapsCartonX
    ? max(minY, box.trayY + box.trayHeight + adultHalf + 8)
    : minY;

  return { min: safeMinY, max: maxY };
}

function getChickSize(chick) {
  const baseSize = min(width * 0.0625, BASE_HEIGHT * 0.10125) * 0.97;
  const ageMs = chick.ageElapsed || 0;
  const growthProgress = constrain(ageMs / (150 * 1000), 0, 1);

  // 2분 30초 동안 부드럽게 커져서 원래 병아리의 1.4배가 됩니다.
  const sizeMultiplier = constrain(chick.sizeMultiplier || 1, 1, 1.25);
  return baseSize * lerp(1, 1.4, growthProgress) * sizeMultiplier;
}

function updateNotes(dt) {
  const now = Date.now();
  const eggLifeRate = getEggLifeRate();

  for (const note of notes) {
    note.lifeElapsed = (note.lifeElapsed || 0) + dt * 1000 * eggLifeRate;
  }

  if (notes.length > 0) {
    // 작성 시간이 가장 오래된 알부터 부화시킵니다.
    let oldestIndex = 0;

    for (let i = 1; i < notes.length; i++) {
      if (notes[i].created < notes[oldestIndex].created) {
        oldestIndex = i;
      }
    }

    const oldest = notes[oldestIndex];

    const isNight = getIsNight();
    const naturalHatchReady = !isNight && oldest.lifeElapsed >= NOTE_LIFE;
    const fullTrayNightHatchReady = isNight && notes.length >= SLOT_COUNT;

    if (!oldest.hatching && (naturalHatchReady || fullTrayNightHatchReady)) {
      oldest.hatching = true;
      oldest.hatchAt = now;
      oldest.hatchElapsed = 0;
      saveNotes();
    }

    if (oldest.hatching) {
      const canHatchNow = !isNight || notes.length >= SLOT_COUNT;
      if (canHatchNow) {
        oldest.hatchElapsed =
          (oldest.hatchElapsed || 0) + dt * 1000 * getHatchRate();
      }
    }

    if (oldest.hatching && oldest.hatchElapsed >= HATCH_TIME) {
      addChickFromNote(oldest);
      notes.splice(oldestIndex, 1);

      // 새 메모가 기다리고 있을 때만 1초 뒤 알판에 넣습니다.
      if (pendingNote && oldest.id === pendingTargetId) {
        pendingTargetId = null;
        refillAt = now + 1000;
      }

      saveNotes();
    }
  }

  if (
    pendingNote &&
    refillAt > 0 &&
    now >= refillAt &&
    notes.length < SLOT_COUNT
  ) {
    notes.push(pendingNote);
    pendingNote = null;
    pendingTargetId = null;
    refillAt = 0;
    saveNotes();
  }
}

function buildUI() {
  shade = createDiv("");
  shade.elt.style.position = "fixed";
  shade.elt.style.inset = "0";
  shade.elt.style.zIndex = "10";
  shade.elt.style.background = "rgba(20, 28, 27, 0.55)";
  shade.elt.style.display = "none";

  editor = createDiv("");
  editor.elt.style.position = "fixed";
  editor.elt.style.zIndex = "11";
  editor.elt.style.boxSizing = "border-box";
  editor.elt.style.background = "#f6bd72";
  editor.elt.style.border = "8px solid #96521f";
  editor.elt.style.outline = "3px solid #f6d293";
  editor.elt.style.borderRadius = "12px";
  editor.elt.style.padding = "18px";
  editor.elt.style.boxShadow = "0 12px 40px #33241b88";
  editor.elt.style.display = "none";

  const headingRow = createDiv("");
  headingRow.parent(editor);
  headingRow.style("display", "flex");
  headingRow.style("align-items", "center");
  headingRow.style("gap", "8px");
  headingRow.style("margin-bottom", "12px");

  const heading = createDiv("농장 비밀 노트");
  heading.parent(headingRow);
  heading.style("font-size", "20px");
  heading.style("font-family", '"FarmTitleFont", sans-serif');
  heading.style("font-weight", "bold");
  heading.style("color", "#59371f");
  heading.style("margin-bottom", "0");
  favoriteButton = createButton("");
  favoriteButton.parent(headingRow);
  favoriteButton.attribute("aria-label", "즐겨찾기");
  favoriteButton.attribute("title", "즐겨찾기");
  favoriteButton.html(
    '<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path fill="currentColor" d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5-5.8-3.1-5.8 3.1 1.1-6.5-4.7-4.6 6.5-.9z"/></svg>',
  );
  favoriteButton.style("display", "inline-flex");
  favoriteButton.style("align-items", "center");
  favoriteButton.style("justify-content", "center");
  favoriteButton.style("width", "30px");
  favoriteButton.style("height", "30px");
  favoriteButton.style("padding", "0");
  favoriteButton.style("border", "none");
  favoriteButton.style("outline", "none");
  favoriteButton.style("background", "transparent");
  favoriteButton.style("cursor", "pointer");
  favoriteButton.elt.addEventListener("click", () => {
    currentMemoFavorite = !currentMemoFavorite;
    updateFavoriteButton();
  });
  deleteButton = createButton("삭제");
  deleteButton.parent(editor);
  deleteButton.attribute("aria-label", "메모 삭제");
  deleteButton.attribute("title", "메모 삭제");
  styleButton(deleteButton, "#8a382f", "#fff8e8");
  deleteButton.elt.addEventListener("click", deleteCurrentMemo);
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
  bodyInput.style("height", "min(38vh, 300px)");
  bodyInput.style("margin-top", "12px");
  bodyInput.style("padding", "12px");
  bodyInput.style("resize", "none");
  bodyInput.style("font-size", "20px");
  bodyInput.style("font-family", '"MemoFont", sans-serif');
  bodyInput.style("line-height", "1.6");
  bodyInput.style("color", "#38291f");
  bodyInput.style("background", "#ffdda0");
  bodyInput.style("border", "2px solid #bc7a3b");
  bodyInput.style("border-radius", "6px");
  titleInput.elt.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.keyCode === 13) {
      event.preventDefault();
      bodyInput.elt.focus();
    }
  });

  const buttonRow = createDiv("");
  buttonRow.parent(editor);
  buttonRow.style("display", "flex");
  buttonRow.style("justify-content", "flex-end");
  buttonRow.style("gap", "10px");
  buttonRow.style("margin-top", "28px");
  deleteButton.parent(buttonRow);
  deleteButton.style("order", "-1");
  deleteButton.style("transform", "translateY(-22px)");
  const cancelButton = createButton("취소");
  cancelButton.parent(editor);
  styleButton(cancelButton, "#c08b55", "#ffffff");
  cancelButton.style("padding", "9px 18px");
  cancelButton.style("position", "absolute");
  cancelButton.style("top", "14px");
  cancelButton.style("right", "18px");
  cancelButton.elt.addEventListener("click", closeEditor);
  editButton = createButton("수정");
  editButton.parent(buttonRow);
  styleButton(editButton, "#a66b3e", "#fff8e8");
  editButton.style("transform", "translateY(-22px)");
  editButton.elt.addEventListener("click", () => {
    titleInput.elt.readOnly = false;
    bodyInput.elt.readOnly = false;
    titleInput.elt.focus();
  });
  const doneButton = createButton("완료");
  doneButton.parent(buttonRow);
  styleButton(doneButton, "#74452f", "#fff8e8");
  doneButton.style("transform", "translateY(-22px)");
  doneButton.elt.addEventListener("click", saveEditor);

  addButton = createButton("메모를 입력하려면 여기를 누르세요");
  styleButton(addButton, "#68452f", "#fff8e8");
  addButton.elt.addEventListener("click", () => openEditor(null));
  clearChicksButton = createButton("풀어주기");
  styleButton(clearChicksButton, "#68452f", "#fff8e8");
  clearChicksButton.elt.addEventListener("click", clearChicks);
  resetFarmButton = createButton("농장 리셋하기");
  styleButton(resetFarmButton, "#8a382f", "#fff8e8");
  resetFarmButton.elt.addEventListener("click", resetFarm);
}

function styleInput(element) {
  element.style("font-family", '"MemoFont", sans-serif');
  element.style("box-sizing", "border-box");
  element.style("width", "100%");
  element.style("padding", "11px");
  element.style("font-size", "18px");
  element.style("background", "#ffdda0");
  element.style("border", "2px solid #bc7a3b");
  element.style("border-radius", "6px");
}

function updateFavoriteButton() {
  if (!favoriteButton) return;
  favoriteButton.style("color", currentMemoFavorite ? "#ffd84d" : "#969696");
  favoriteButton.attribute("aria-pressed", String(currentMemoFavorite));
}

function styleButton(element, background, color) {
  element.style("font-family", '"FarmUIFont", sans-serif');
  element.style("padding", "11px 18px");
  element.style("font-size", "16px");
  element.style("border", "0");
  element.style("border-radius", "8px");
  element.style("background", background);
  element.style("color", color);
  element.style("cursor", "pointer");
}

function positionUI() {
  if (!editor || !shade || !addButton) {
    return;
  }

  shade.position(0, 0);
  shade.size(windowWidth, windowHeight);

  editor.position(max(12, width * 0.1), max(18, BASE_HEIGHT * 0.1));
  editor.size(min(width * 0.8, 560), min(BASE_HEIGHT * 0.76, 600));

  addButton.position(width * 0.08, BASE_HEIGHT * 0.91 + 70);
  clearChicksButton.position(12, 12);
  clearChicksButton.size(140, 44);
  resetFarmButton.position(160, 12);
  resetFarmButton.size(160, 44);
  addButton.size(min(width * 0.46, 420), 48);

  shade.elt.style.position = "fixed";
  editor.elt.style.position = "fixed";
  addButton.elt.style.position = "fixed";
  clearChicksButton.elt.style.position = "fixed";
  clearChicksButton.elt.style.zIndex = "5";
  resetFarmButton.elt.style.position = "fixed";
  resetFarmButton.elt.style.zIndex = "5";
}

function openEditor(note, source) {
  editorIsOpen = true;
  shade.elt.style.display = "block";
  editor.elt.style.display = "block";
  positionUI();

  titleInput.value(note ? note.title : "");
  bodyInput.value(note ? note.body : "");
  currentMemoFavorite = Boolean(note && note.favorite);
  updateFavoriteButton();
  deleteButton.elt.style.display = note ? "block" : "none";
  editor.elt.dataset.editId = note ? note.id : "";
  editor.elt.dataset.editSource = note ? source : "";

  if (!note) {
    titleInput.elt.focus();
  }
}

function closeEditor() {
  editor.elt.style.display = "none";
  shade.elt.style.display = "none";
  editor.elt.dataset.editId = "";
  editor.elt.dataset.editSource = "";

  titleInput.value("");
  bodyInput.value("");
  currentMemoFavorite = false;
  editorIsOpen = false;
}

function saveEditor() {
  let title = titleInput.value().trim();
  const body = bodyInput.value().trim();

  if (!title) {
    title = "이름 없는 메모";
  }

  const editId = editor.elt.dataset.editId;
  const editSource = editor.elt.dataset.editSource;

  if (editId && editSource === "chick") {
    // 병아리에서 연 메모를 수정합니다.
    const chick = chicks.find((item) => item.memo.id === editId);

    if (chick) {
      chick.memo.title = title;
      chick.memo.body = body;
      chick.memo.favorite = currentMemoFavorite;
      saveChicks();
    }
  } else if (editId) {
    // 계란판에 있는 기존 메모를 수정합니다.
    const note = notes.find((item) => item.id === editId);

    if (note) {
      note.title = title;
      note.body = body;
      note.favorite = currentMemoFavorite;
    }
  } else {
    // 새 메모
    const newNote = {
      id: String(Date.now()) + Math.random(),
      number: nextEggNumber,
      title: title,
      favorite: currentMemoFavorite,
      body: body,
      created: Date.now(),
      hatching: false,
      hatchAt: 0,
      lifeElapsed: 0,
      hatchElapsed: 0,
    };
    nextEggNumber++;
    localStorage.setItem(EGG_NUMBER_KEY, String(nextEggNumber));
    if (notes.length < SLOT_COUNT) {
      // 새 알은 앞줄 오른쪽부터 다음 빈 자리에 들어갑니다.
      notes.push(newNote);
    } else {
      // 가장 먼저 쓴 알을 부화시킨 뒤 새 메모 알로 교체합니다.
      let oldestIndex = 0;

      for (let i = 1; i < notes.length; i++) {
        if (notes[i].created < notes[oldestIndex].created) {
          oldestIndex = i;
        }
      }

      pendingNote = newNote;
      pendingTargetId = notes[oldestIndex].id;
      notes[oldestIndex].hatching = true;
      notes[oldestIndex].hatchAt = Date.now();
      notes[oldestIndex].hatchElapsed = 0;
    }
  }

  saveNotes();
  closeEditor();
}

function saveNotes() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(notes));
  } catch (error) {
    console.error("메모 저장 실패:", error);
  }
}

function saveChicks() {
  try {
    const saved = chicks.map((chick) => ({
      id: chick.id,
      bornAt: chick.bornAt,
      ageElapsed: chick.ageElapsed || 0,
      number: chick.number,
      memo: chick.memo,
      xRatio: chick.x / width,
      yRatio: chick.y / BASE_HEIGHT,
      direction: chick.direction,
      speed: chick.speed,
      verticalDirection: chick.verticalDirection,
      verticalSpeed: chick.verticalSpeed,
      sizeMultiplier: chick.sizeMultiplier || 1,
      phase: chick.phase,
    }));

    localStorage.setItem(CHICK_STORE_KEY, JSON.stringify(saved));
  } catch (error) {
    console.error("병아리 저장 실패:", error);
  }
}
function clearChicks() {
  if (massReleaseActive || chicks.length === 0) return;

  massReleaseQueue = chicks.map((chick) => chick.id);
  massReleaseActive = true;
  massReleaseNextAt = millis();
  gateOpen = true;
  gateExitMode = true;
  gateOpenedAt = millis();
  updateMassRelease();
}

function updateMassRelease() {
  if (
    !massReleaseActive ||
    millis() < massReleaseNextAt ||
    chicks.some((chick) => chick.leaving)
  ) {
    return;
  }

  while (massReleaseQueue.length > 0) {
    const nextId = massReleaseQueue.shift();
    const nextChick = chicks.find((chick) => chick.id === nextId);
    if (!nextChick) continue;

    nextChick.leaving = true;
    saveChicks();
    return;
  }

  massReleaseActive = false;
  gateExitMode = false;
  gateOpenedAt = millis();
  saveChicks();
}
function deleteCurrentMemo() {
  const shouldDelete = confirm(
    "이 메모를 정말 삭제할까요? 삭제하면 복구할 수 없습니다.",
  );

  if (!shouldDelete) {
    return;
  }

  const editId = editor.elt.dataset.editId;
  const editSource = editor.elt.dataset.editSource;

  if (editSource === "chick") {
    chicks = chicks.filter((chick) => chick.memo.id !== editId);
    saveChicks();
  } else if (editSource === "egg") {
    const deletingPendingTarget = editId === pendingTargetId;
    notes = notes.filter((note) => note.id !== editId);
    saveNotes();

    // 교체를 기다리는 알의 자리였다면 새 알을 1초 뒤 넣습니다.
    if (deletingPendingTarget && pendingNote) {
      pendingTargetId = null;
      refillAt = Date.now() + 1000;
    }
  }

  closeEditor();
}
function resetFarm() {
  const shouldReset = confirm(
    "알, 메모, 병아리를 모두 지우고 처음부터 시작할까요?",
  );

  if (!shouldReset) {
    return;
  }

  notes = [];
  chicks = [];
  pendingNote = null;
  pendingTargetId = null;
  refillAt = 0;
  nextEggNumber = 1;
  gateOpen = false;
  gateExitMode = false;

  localStorage.removeItem(STORE_KEY);
  localStorage.removeItem(CHICK_STORE_KEY);
  localStorage.removeItem(EGG_NUMBER_KEY);
  localStorage.removeItem(TIME_OF_DAY_KEY);
  timeOfDay = 0;

  if (editorIsOpen) {
    closeEditor();
  }
}

function mousePressed() {
  unlockFarmAudio();

  if (titleScreenActive) {
    if (titleTransitionStartedAt === null) {
      const button = titleStartButtonBounds();
      if (
        mouseX >= button.x &&
        mouseX <= button.x + button.w &&
        mouseY >= button.y &&
        mouseY <= button.y + button.h
      ) {
        titleTransitionStartedAt = millis();
      }
    }
    return;
  }

  if (editorIsOpen) {
    return;
  }

  if (timeSliderHit(mouseX, mouseY)) {
    timeSliderDragging = true;
    setTimeOfDayFromPointer();
    return;
  }

  if (skyTimeDragHit(mouseX, mouseY)) {
    skyTimeDragging = true;
    skyDragStartY = mouseY;
    skyDragStartTime = timeOfDay;
    return;
  }

  // 전체 내보내기가 진행되는 동안은 수동 문/닭 선택이 순서를 바꾸지 않게 합니다.
  if (massReleaseActive) return;

  const gateX = width * 0.75;
  const fenceY = BASE_HEIGHT * 0.43;

  // 울타리 문
  if (
    mouseX >= gateX &&
    mouseX <= width &&
    mouseY >= fenceY - BASE_HEIGHT * 0.04 &&
    mouseY <= fenceY + BASE_HEIGHT * 0.15
  ) {
    if (gateOpen && gateExitMode && !chicks.some((chick) => chick.leaving)) {
      gateOpen = false;
      gateExitMode = false;
    } else {
      gateOpen = true;
      gateExitMode = true;
      gateOpenedAt = millis();
    }
    return;
  }

  // 문을 연 뒤 병아리를 누르면 문 쪽으로 달려가며 사라집니다.
  for (let i = chicks.length - 1; i >= 0; i--) {
    const chick = chicks[i];
    if (chick.leaving) continue;
    const hitSize = chick.size * 0.65;

    if (dist(mouseX, mouseY, chick.x, chick.y) < hitSize) {
      if (gateExitMode && gateOpen) {
        chick.leaving = true;
      } else {
        openEditor(chick.memo, "chick");
      }
      return;
    }
  }

  // 알은 그려진 순서를 고려해 앞줄부터 터치 판정합니다.
  const eggHitOrder = [];

  for (let i = min(notes.length, 5) - 1; i >= 0; i--) {
    eggHitOrder.push(i);
  }
  for (let i = notes.length - 1; i >= 5; i--) {
    eggHitOrder.push(i);
  }

  for (const i of eggHitOrder) {
    const egg = getEggPosition(i);

    // 기존 알의 터치 영역은 유지합니다.
    const insideHitBox =
      Math.abs(mouseX - egg.x) <= egg.w * 0.6 &&
      Math.abs(mouseY - egg.y) <= egg.h * 0.6;

    // 실제 타원 모양 안을 눌렀는지도 확인합니다.
    const dx = (mouseX - egg.x) / (egg.w * 0.375);
    const dy = (mouseY - egg.y) / (egg.h * 0.61);
    const insideEggShape = dx * dx + dy * dy <= 1;

    if (!insideHitBox && !insideEggShape) {
      continue;
    }

    // 뒷줄 알은 앞줄 알에 실제로 가려진 부분을 눌렀을 때 선택되지 않습니다.
    let coveredByFrontEgg = false;

    if (i >= 5) {
      for (let j = 0; j < min(notes.length, 5); j++) {
        const frontEgg = getEggPosition(j);
        const frontDx = (mouseX - frontEgg.x) / (frontEgg.w * 0.375);
        const frontDy = (mouseY - frontEgg.y) / (frontEgg.h * 0.61);

        if (frontDx * frontDx + frontDy * frontDy <= 1) {
          coveredByFrontEgg = true;
          break;
        }
      }
    }

    if (coveredByFrontEgg) {
      continue;
    }

    openEditor(notes[i], "egg");
    return;
  }

  // 빈 홈은 알 터치를 먼저 처리한 뒤에만 새 메모 입력 대상으로 삼습니다.
  if (notes.length < SLOT_COUNT) {
    // 알이 겹친 자리의 터치가 빈 홈으로 잘못 처리되지 않도록 한 번 더 제외합니다.
    for (let i = 0; i < notes.length; i++) {
      const egg = getEggPosition(i);
      const inOccupiedArea =
        Math.abs(mouseX - egg.x) <= egg.w * 0.6 &&
        Math.abs(mouseY - egg.y) <= egg.h * 0.6;
      if (inOccupiedArea) return;
    }

    const box = cartonLayout();
    for (let i = notes.length; i < SLOT_COUNT; i++) {
      const emptySlot = getEggPosition(i);
      const cavityX = emptySlot.x;
      const cavityY = emptySlot.y + box.trayHeight * 0.3;
      const dx = (mouseX - cavityX) / (box.trayWidth * 0.08);
      const dy = (mouseY - cavityY) / (box.trayHeight * 0.195);

      if (dx * dx + dy * dy <= 1) {
        openEditor(null);
        return;
      }
    }
  }
}

// function windowResized() {
//   resizeCanvas(windowWidth, windowHeight);
//   positionUI();
//   keepChicksInsideFence();}
function windowResized() {
  // 창 크기가 바뀌어도 캔버스 크기는 1024 × 576으로 유지합니다.
}

function mouseDragged() {
  if (skyTimeDragging) {
    setTimeOfDayFromSkyPointer();
  } else if (timeSliderDragging) {
    setTimeOfDayFromPointer();
  }
}

function mouseReleased() {
  if (timeSliderDragging || skyTimeDragging) {
    localStorage.setItem(TIME_OF_DAY_KEY, String(timeOfDay));
  }
  timeSliderDragging = false;
  skyTimeDragging = false;
}
