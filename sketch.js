// ===================================================
// 專題：p5.js 簡易程式設計多媒體拖曳測驗系統
// 檔案：sketch.js
// 特色：全螢幕響應式、6選項拖曳、GIF動畫支援、交卷結算、彩帶特效
// ===================================================

// 全域變數宣告：媒體資源與動畫狀態
let myGifImage = null;       // 儲存預載入的 GIF 圖片物件
let isGifLoaded = false;    // GIF 圖片是否載入成功標記
let fireworks = [];         // 儲存彩帶/紙屑粒子的陣列

// 全域變數宣告：系統狀態與交卷標記
let isSubmitted = false;    // 是否已點擊交卷按鈕
let finalScore = 0;         // 最終計算出的測驗分數
let submitButton = null;    // 交卷 HTML 按鈕元素

// 全域變數宣告：拖曳互動邏輯
let draggedCard = null;     // 當前正在被滑鼠拖曳的卡片物件
let dragOffsetX = 0;        // 滑鼠與卡片左上角的 X 軸偏移量
let dragOffsetY = 0;        // 滑鼠與卡片左上角的 Y 軸偏移量

// 測驗題目與答案資料庫 (包含 6 個 p5.js 核心觀念題)
const quizData = [
  {
    id: 1,
    question: "1. 繪製一個圓心在 (100,100)，直徑 50 的圓形指令為？",
    targetName: "【 題目 1 放此 】",
    correctAnswer: "ellipse(100, 100, 50, 50)",
    matchedCard: null
  },
  {
    id: 2,
    question: "2. 設定畫布背景為純黑色的指令為？",
    targetName: "【 題目 2 放此 】",
    correctAnswer: "background(0)",
    matchedCard: null
  },
  {
    id: 3,
    question: "3. 設定填滿顏色為紅色的指令為？",
    targetName: "【 題目 3 放此 】",
    correctAnswer: "fill(255, 0, 0)",
    matchedCard: null
  },
  {
    id: 4,
    question: "4. 建立寬 800、高 600 畫布的初始化指令為？",
    targetName: "【 題目 4 放此 】",
    correctAnswer: "createCanvas(800, 600)",
    matchedCard: null
  },
  {
    id: 5,
    question: "5. 繪製矩形從 (50,50) 開始，寬 100 高 60 的指令為？",
    targetName: "【 題目 5 放此 】",
    correctAnswer: "rect(50, 50, 100, 60)",
    matchedCard: null
  },
  {
    id: 6,
    question: "6. 控制外框線條粗細為 4 像素的指令為？",
    targetName: "【 題目 6 放此 】",
    correctAnswer: "strokeWeight(4)",
    matchedCard: null
  }
];

// 可拖曳卡片陣列 (6 個可拖曳的文字選項卡片)
let cards = [];

// ===================================================
// 1. preload()：預先載入外部資源 (GIF 圖片)
// ===================================================
function preload() {
  // 嘗試載入專案目錄下的 GIF 動畫圖片 (可更換為你自己的 assets/animation.gif)
  // 如果載入失敗，畫面上會自動切換為內建的繪圖動畫作為備用展示
  try {
    myGifImage = loadImage('assets/animation.gif', 
      () => { isGifLoaded = true; }, 
      () => { isGifLoaded = false; }
    );
  } catch (e) {
    isGifLoaded = false;
  }
}

// ===================================================
// 2. setup()：畫布初始化與介面元件建立
// ===================================================
function setup() {
  // 建立全螢幕畫布，使其充滿整個瀏覽器視窗
  createCanvas(windowWidth, windowHeight);
  
  // 設定繪圖模式為中心點對齊 (方便圖片與形狀縮放放置)
  rectMode(CORNER);
  textAlign(CENTER, CENTER);

  // 初始化 6 個可拖曳卡片物件與位置
  initQuizLayout();

  // 建立「交卷看成績」的 DOM 按鈕元件
  createSubmitButton();
}

// ===================================================
// 3. draw()：每秒約 60 幀的主繪圖循環
// ===================================================
function draw() {
  // 繪製微灰藍色的漸層質感背景
  background(245, 247, 250);

  // 1. 繪製頁面標題與測驗說明資訊
  drawHeader();

  // 2. 繪製上方動態 GIF 展示區與提示動畫
  drawTopGifSection();

  // 3. 繪製題目放置區 (Drop Zones)
  drawDropZones();

  // 4. 繪製下方可拖曳卡片區 (Draggable Cards)
  drawCards();

  // 5. 若已交卷，顯示成績結算畫面與彩帶特效
  if (isSubmitted) {
    drawResultBoard();
    
    // 當分數超過 60% (及格標頭) 時，繪製放彩帶粒子動畫
    if (finalScore >= 60) {
      updateAndDrawConfetti();
    }
  }
}

// ===================================================
// 4. 版面佈局與尺寸計算 (響應式設計)
// ===================================================
function initQuizLayout() {
  cards = [];
  
  // 打亂選項順序，增加測驗趣味性
  let shuffleAnswers = [
    "ellipse(100, 100, 50, 50)",
    "background(0)",
    "fill(255, 0, 0)",
    "createCanvas(800, 600)",
    "rect(50, 50, 100, 60)",
    "strokeWeight(4)"
  ];
  shuffleArray(shuffleAnswers);

  // 計算卡片與佈局尺寸 (依視窗寬度動態調整)
  let cardW = min(width * 0.28, 220);
  let cardH = 45;
  let startY = height - 130;

  // 動態排列 6 個選項卡片於下方排版區
  for (let i = 0; i < 6; i++) {
    let col = i % 3;
    let row = Math.floor(i / 3);
    let gapX = (width - cardW * 3) / 4;
    let posX = gapX + col * (cardW + gapX);
    let posY = startY + row * (cardH + 15);

    cards.push({
      id: i,
      text: shuffleAnswers[i],
      x: posX,
      y: posY,
      homeX: posX,
      homeY: posY,
      w: cardW,
      h: cardH,
      isPlaced: false,
      targetIdx: -1
    });
  }
}

// 繪製頁面上方標題列
function drawHeader() {
  fill(30, 41, 59);
  noStroke();
  textSize(22);
  textStyle(BOLD);
  text("💻 p5.js 簡易程式設計 - 多媒體互動拖曳測驗", width / 2, 30);
  
  textSize(13);
  textStyle(NORMAL);
  fill(100, 116, 139);
  text("請將下方的 p5.js 程式碼卡片拖曳至對應題目框中，完成後點擊「交卷看成績」", width / 2, 58);
}

// 繪製上方 GIF 動畫圖片展示區
function drawTopGifSection() {
  let gifX = width / 2;
  let gifY = 115;
  let gifW = 120;
  let gifH = 75;

  // 外框裝飾面板
  fill(255);
  stroke(226, 232, 240);
  strokeWeight(2);
  rect(gifX - gifW / 2 - 10, gifY - gifH / 2 - 5, gifW + 20, gifH + 10, 12);

  // 若成功載入 GIF 檔，則顯示 GIF；否則顯示向量擬真動畫
  if (isGifLoaded && myGifImage) {
    imageMode(CENTER);
    image(myGifImage, gifX, gifY, gifW, gifH);
  } else {
    // 備用動態向量圖示：旋轉的光芒與繪圖程式碼圖標
    push();
    translate(gifX, gifY);
    noFill();
    stroke(99, 102, 241, 180);
    strokeWeight(3);
    rotate(frameCount * 0.02);
    rect(-25, -25, 50, 50, 8);
    rotate(-frameCount * 0.04);
    stroke(244, 63, 94, 180);
    ellipse(0, 0, 35, 35);
    pop();

    fill(79, 70, 229);
    noStroke();
    textSize(11);
    textStyle(BOLD);
    text("p5.js CODE", gifX, gifY);
  }
}

// 繪製題目與放置目標區域 (Drop Zones)
function drawDropZones() {
  let startY = 175;
  let zoneW = min(width * 0.42, 360);
  let zoneH = 50;

  for (let i = 0; i < quizData.length; i++) {
    let col = i % 2;
    let row = Math.floor(i / 2);
    let gapX = (width - zoneW * 2) / 3;
    let posX = gapX + col * (zoneW + gapX);
    let posY = startY + row * (zoneH + 20);

    // 儲存目標區座標，利於判斷碰撞
    quizData[i].x = posX;
    quizData[i].y = posY;
    quizData[i].w = zoneW;
    quizData[i].h = zoneH;

    // 外框背景配色（交卷後顯示對錯顏色）
    if (isSubmitted) {
      if (quizData[i].matchedCard && quizData[i].matchedCard.text === quizData[i].correctAnswer) {
        fill(220, 252, 231); // 綠色背景 (正確)
        stroke(34, 197, 94);
      } else {
        fill(254, 226, 226); // 紅色背景 (錯誤)
        stroke(239, 68, 68);
      }
    } else {
      fill(255);
      stroke(203, 213, 225);
    }

    strokeWeight(2);
    rect(posX, posY, zoneW, zoneH, 8);

    // 繪製題目文字
    fill(51, 65, 85);
    noStroke();
    textAlign(LEFT, CENTER);
    textSize(12);
    textStyle(BOLD);
    text(quizData[i].question, posX + 10, posY + 15);

    // 提示拖曳目標區文字
    textAlign(RIGHT, CENTER);
    textSize(11);
    fill(148, 163, 184);
    if (!quizData[i].matchedCard) {
      text("請放置卡片 ➔", posX + zoneW - 12, posY + 35);
    }
  }
}

// 繪製所有 6 個卡片選項
function drawCards() {
  textAlign(CENTER, CENTER);
  textSize(12);

  for (let card of cards) {
    push();
    
    // 當前正在拖曳的卡片加上浮空陰影
    if (card === draggedCard) {
      fill(238, 242, 255);
      stroke(99, 102, 241);
      strokeWeight(3);
      // 繪製陰影
      rect(card.x + 4, card.y + 4, card.w, card.h, 8);
    } else if (card.isPlaced) {
      fill(241, 245, 249);
      stroke(148, 163, 184);
      strokeWeight(1.5);
    } else {
      fill(255);
      stroke(99, 102, 241);
      strokeWeight(2);
    }

    rect(card.x, card.y, card.w, card.h, 8);

    // 繪製卡片文字（語法程式碼）
    fill(30, 27, 75);
    noStroke();
    textStyle(BOLD);
    text(card.text, card.x + card.w / 2, card.y + card.h / 2);
    pop();
  }
}

// ===================================================
// 5. 滑鼠互動事件判斷 (Mouse Events)
// ===================================================
function mousePressed() {
  if (isSubmitted) return; // 若已交卷則鎖定無法拖曳

  // 倒序檢查卡片，使最上層被點擊的卡片優先獲得拖曳權
  for (let i = cards.length - 1; i >= 0; i--) {
    let card = cards[i];
    if (
      mouseX >= card.x &&
      mouseX <= card.x + card.w &&
      mouseY >= card.y &&
      mouseY <= card.y + card.h
    ) {
      draggedCard = card;
      dragOffsetX = mouseX - card.x;
      dragOffsetY = mouseY - card.y;

      // 若卡片原本已放置在題目區，將其釋放
      if (card.isPlaced && card.targetIdx !== -1) {
        quizData[card.targetIdx].matchedCard = null;
        card.isPlaced = false;
        card.targetIdx = -1;
      }
      break;
    }
  }
}

function mouseDragged() {
  // 跟隨滑鼠移動拖曳中的卡片
  if (draggedCard) {
    draggedCard.x = mouseX - dragOffsetX;
    draggedCard.y = mouseY - dragOffsetY;
  }
}

function mouseReleased() {
  if (!draggedCard) return;

  let snapped = false;

  // 檢查拖曳的卡片是否放開在某個題目目標區內 (Collision / Snap)
  for (let i = 0; i < quizData.length; i++) {
    let q = quizData[i];
    if (
      mouseX >= q.x &&
      mouseX <= q.x + q.w &&
      mouseY >= q.y &&
      mouseY <= q.y + q.h
    ) {
      // 若該目標區已有其他卡片，將原卡片彈回首頁
      if (q.matchedCard && q.matchedCard !== draggedCard) {
        q.matchedCard.isPlaced = false;
        q.matchedCard.x = q.matchedCard.homeX;
        q.matchedCard.y = q.matchedCard.homeY;
        q.matchedCard.targetIdx = -1;
      }

      // 自動磁吸吸附至題目區右下側
      draggedCard.x = q.x + q.w - draggedCard.w - 8;
      draggedCard.y = q.y + q.h - draggedCard.h - 4;
      draggedCard.isPlaced = true;
      draggedCard.targetIdx = i;
      q.matchedCard = draggedCard;
      snapped = true;
      break;
    }
  }

  // 若未放置到目標區，則回彈至原起始位置
  if (!snapped) {
    draggedCard.x = draggedCard.homeX;
    draggedCard.y = draggedCard.homeY;
    draggedCard.isPlaced = false;
    draggedCard.targetIdx = -1;
  }

  draggedCard = null;
}

// ===================================================
// 6. 交卷按鈕建立與邏輯結算
// ===================================================
function createSubmitButton() {
  // 使用 p5.js DOM 函式建立按鈕，保證響應式對齊
  submitButton = createButton("送出答案，交卷看成績 🚀");
  positionSubmitButton();

  // 按鈕 CSS 樣式美化
  submitButton.style("background-color", "#4F46E5");
  submitButton.style("color", "#FFFFFF");
  submitButton.style("font-size", "15px");
  submitButton.style("font-weight", "bold");
  submitButton.style("padding", "12px 28px");
  submitButton.style("border", "none");
  submitButton.style("border-radius", "30px");
  submitButton.style("cursor", "pointer");
  submitButton.style("box-shadow", "0 4px 12px rgba(79, 70, 229, 0.3)");

  // 點擊事件監聽
  submitButton.mousePressed(calculateScore);
}

// 動態調整交卷按鈕位置
function positionSubmitButton() {
  if (submitButton) {
    submitButton.position(width / 2 - 100, height - 60);
  }
}

// 計算測驗成績並觸發彩帶
function calculateScore() {
  let correctCount = 0;

  // 依據 matchedCard 與正確答案比對
  for (let q of quizData) {
    if (q.matchedCard && q.matchedCard.text === q.correctAnswer) {
      correctCount++;
    }
  }

  // 計算百分比總分 (每題約 16.6 分)
  finalScore = Math.round((correctCount / quizData.length) * 100);
  isSubmitted = true;

  // 若成績高於 60%，產生歡慶彩帶粒子特效！
  if (finalScore >= 60) {
    createConfetti();
  }

  // 隱藏交卷按鈕
  submitButton.hide();
}

// 繪製結算成績看板彈窗
function drawResultBoard() {
  // 半透明背景遮罩
  fill(15, 23, 42, 180);
  rect(0, 0, width, height);

  // 結算彈窗主體
  let boardW = min(width * 0.8, 420);
  let boardH = 260;
  let boardX = width / 2 - boardW / 2;
  let boardY = height / 2 - boardH / 2;

  fill(255);
  stroke(226, 232, 240);
  strokeWeight(2);
  rect(boardX, boardY, boardW, boardH, 16);

  // 顯示得分與稱號
  textAlign(CENTER, CENTER);
  fill(30, 41, 59);
  textSize(22);
  textStyle(BOLD);
  text("🎉 測驗結果結算", width / 2, boardY + 45);

  textSize(42);
  if (finalScore >= 60) {
    fill(34, 197, 94); // 綠色及格分數
  } else {
    fill(239, 68, 68); // 紅色不及格分數
  }
  text(finalScore + " 分", width / 2, boardY + 105);

  textSize(15);
  fill(71, 85, 105);
  textStyle(NORMAL);
  if (finalScore >= 60) {
    text("太棒了！你已經掌握了 p5.js 的基本語法！", width / 2, boardY + 160);
  } else {
    text("再接再厲！複習一下 p5.js 畫布與圖形指令吧！", width / 2, boardY + 160);
  }

  // 繪製重新測驗按鈕提示
  textSize(12);
  fill(148, 163, 184);
  text("（點擊畫布任意處重新進行挑戰）", width / 2, boardY + 215);
}

// 重新挑戰（點擊彈窗重置）
function mouseClicked() {
  if (isSubmitted) {
    isSubmitted = false;
    finalScore = 0;
    quizData.forEach(q => q.matchedCard = null);
    initQuizLayout();
    submitButton.show();
  }
}

// ===================================================
// 7. >60% 成績歡慶彩帶粒子特效 (Confetti System)
// ===================================================
function createConfetti() {
  fireworks = [];
  let colors = ['#f43f5e', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'];

  // 產生 120 個不同顏色與拋射速度的彩帶碎片
  for (let i = 0; i < 120; i++) {
    fireworks.push({
      x: width / 2,
      y: height / 2 + 50,
      vx: random(-8, 8),
      vy: random(-14, -4),
      size: random(6, 12),
      color: random(colors),
      gravity: 0.25,
      rotation: random(TWO_PI),
      vRot: random(-0.1, 0.1)
    });
  }
}

// 繪製與更新彩帶物理動態
function updateAndDrawConfetti() {
  for (let p of fireworks) {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += p.gravity; // 重力加速度
    p.rotation += p.vRot;

    push();
    translate(p.x, p.y);
    rotate(p.rotation);
    fill(p.color);
    noStroke();
    rect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
    pop();
  }
}

// ===================================================
// 8. 視窗縮放事件 (Responsive Window Resized)
// ===================================================
function windowResized() {
  // 自動調整畫布與內部元件尺寸
  resizeCanvas(windowWidth, windowHeight);
  initQuizLayout();
  positionSubmitButton();
}

// 陣列隨機洗牌演算法
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}