/*
----- Coding Tutorial by Patt Vira ----- 
Name: Interactive Fridge Magnets
Video Tutorial: https://youtu.be/72pAzuD8tqE

Connect with Patt: @pattvira
https://www.pattvira.com/
----------------------------------------
*/

// 主要全域變數宣告
let video, handPose, hands = []; // 攝影機物件、手勢模型、偵測到的手
let bullets = [];                // 子彈陣列
let targets = [];                // 目標陣列
let score = 0;                   // 分數
let timer = 20;                  // 遊戲剩餘秒數
let gameOver = false;            // 遊戲結束狀態
let lastShotTime = 0;            // 上次射擊的時間
let thumbWasBent = false;        // 拇指上次是否彎曲
let targetWords = [              // 目標文字清單
  "數位學習", "教學設計", "多媒體", "程式設計", "教育科技理論", 
  "AI應用", "互動設計", "專案管理", "訓練發展與評鑑"
];
let canShoot = true;             // 是否可射擊
let gameStarted = false;         // 遊戲是否開始
let gunImg;                      // 槍圖片
let explosionImg;                // 爆炸圖片
let thumbWasBentArr = [];        // 每隻手的彎曲狀態
let countdown = 0;               // 倒數秒數，0 代表不用倒數
let countdownStartTime = 0;      // 記錄倒數開始的時間

const keypointIndices = [0, 4, 8, 12, 16, 20]; // 手腕、五指指尖的索引

// 預先載入資源（手勢模型、圖片）
function preload() {
  handPose = ml5.handPose({flipped: true}); // 啟動 handPose，鏡像
  gunImg = loadImage('gun.png');            // 載入槍圖片
  explosionImg = loadImage('explosion.png');// 載入爆炸圖片
}

// 畫布與遊戲初始設定
function setup() {
  createCanvas(640, 480);                   // 設定畫布大小
  video = createCapture(VIDEO, {flipped: true}); // 啟動攝影機，鏡像
  video.hide();                             // 隱藏原生 video 畫面
  handPose.detectStart(video, gotHands);    // 啟動手勢偵測
  rectMode(CENTER);                         // 矩形中心對齊
  textAlign(CENTER, CENTER);                // 文字置中
  for (let i = 0; i < 5; i++) {
    targets.push(new Target());             // 初始產生5個目標
  }
  setInterval(() => {                       // 每秒倒數計時
    if (!gameOver) timer--;
    if (timer <= 0) gameOver = true;
  }, 1000);
}

// 主繪圖迴圈
function draw() {
  background(220);                          // 畫布底色
  image(video, 0, 0, width, height);        // 顯示攝影機畫面

  // ====== 1. 倒數機制放最前面 ======
  // 如果倒數中，顯示倒數數字，倒數結束才開始遊戲
  if (countdown > 0) {
    let elapsed = floor((millis() - countdownStartTime) / 1000); // 經過的秒數
    let showNum = countdown - elapsed;                           // 要顯示的倒數數字
    fill(0, 102, 204);
    textSize(80);
    if (showNum > 0) {
      text(showNum, width/2, height/2);                         // 顯示倒數
      return;                                                   // 還在倒數，不進入遊戲
    } else {
      countdown = 0;
      gameStarted = true;                                       // 倒數結束才正式開始
    }
  }

  // ====== 2. 首頁畫面 ======
  // 如果遊戲尚未開始，顯示首頁畫面
  if (!gameStarted) {
    // 畫動態圓點背景
    let grid = 6; // 6x6 共36個點
    for (let xi = 0; xi < grid; xi++) {
      for (let yi = 0; yi < grid; yi++) {
        // 基本格點位置
        let x = map(xi, 0, grid-1, 0, width);
        let y = map(yi, 0, grid-1, 0, height);
        // 加入一點隨機晃動
        x += sin(millis()/3000 + xi*2 + yi) * 30;
        y += cos(millis()/3500 + yi*2 + xi) * 30;
        // 更繽紛的顏色
        let c = color(
          180 + 60 * sin(xi*2 + millis()/2000),
          180 + 60 * sin(yi*2 + millis()/2500),
          180 + 60 * sin((xi+yi)*1.5 + millis()/3000),
          50
        );
        fill(c);
        noStroke();
        ellipse(
          x,
          y,
          35 + 18 * sin(millis()/4000 + xi + yi), // 晃動更慢
          35 + 18 * sin(millis()/4000 + xi + yi)
        );
      }
    }
    // 畫標題文字（左右晃動）
    let t = millis() / 500;
    let swing = sin(t) * 60;
    textSize(32);

    // 文字外框
    stroke(0);
    strokeWeight(4);
    fill(0, 102, 204);
    text("教育科技系小遊戲", width/2 + swing, height/2 - 120);
    // 文字本體
    noStroke();
    fill(0, 102, 204);
    text("教育科技系小遊戲", width/2 + swing, height/2 - 120);

    // 設定按鈕參數
    let btnX = width/2;
    let btnY = height/2 + 30; // 向下
    let btnW = 160;           // 按鈕寬
    let btnH = 60;            // 按鈕高

    // 畫按鈕
    fill(0, 102, 204);
    rect(btnX, btnY, btnW, btnH, 20);

    // 按鈕文字外框
    textSize(28);
    fill(0, 102, 204);
    text("開始遊戲", btnX, btnY);
    // 按鈕文字本體
    noStroke();
    fill(255);
    text("開始遊戲", btnX, btnY);
    
    // 按鈕下方提示
    textSize(20);
    fill(60, 180, 120); // 柔和綠色
    text("觸碰按鈕以開始遊戲", btnX, btnY + 55);

    // 右側直排提示（沒偵測到手時）
    if (hands.length === 0) {
      fill(255, 0, 0, 180);
      textSize(24);
      let tip = "請將手放到鏡頭前";
      let baseX = width - 60;
      let baseY = height/2 - (tip.length * 15) / 2 - 60;
      for (let i = 0; i < tip.length; i++) {
        text(tip[i], baseX, baseY + i * 30);
      }
    }

    // 顯示所有子彈
    for (let b of bullets) b.moveAndShow();

    // 判斷子彈是否碰到按鈕
    for (let b of bullets) {
      if (
        b.x > btnX - btnW/2 && b.x < btnX + btnW/2 &&
        b.y > btnY - btnH/2 && b.y < btnY + btnH/2
      ) {
        gameStarted = true;
        // 遊戲重新初始化
        score = 0;
        timer = 20;
        gameOver = false;
        bullets = [];
        targets = [];
        for (let i = 0; i < 5; i++) {
          targets.push(new Target());
        }
        break; // 只要一顆子彈碰到就開始
      }
    }

    // 判斷手是否碰到按鈕
    if (hands.length > 0) {
      for (let hand of hands) {
        // 你可以用手掌中心或食指尖端來判斷
        let palm = hand.keypoints[0]; // 手腕
        let finger = hand.keypoints[8]; // 食指尖端

        // 判斷食指是否碰到按鈕
        if (
          finger.x > btnX - btnW/2 && finger.x < btnX + btnW/2 &&
          finger.y > btnY - btnH/2 && finger.y < btnY + btnH/2
        ) {
          countdown = 3;
          countdownStartTime = millis();
          gameStarted = false;
          score = 0;
          timer = 20;
          gameOver = false;
          bullets = [];
          targets = [];
          for (let i = 0; i < 5; i++) {
            targets.push(new Target());
          }
          break;
        }
      }
    }
    return; // 首頁畫面結束
  }

  // ====== 3. 遊戲結束畫面 ======
  if (gameOver) {
    // 加入繽紛動態圓點背景
    let grid = 6;
    for (let xi = 0; xi < grid; xi++) {
      for (let yi = 0; yi < grid; yi++) {
        let x = map(xi, 0, grid-1, 0, width);
        let y = map(yi, 0, grid-1, 0, height);
        x += sin(millis()/3000 + xi*2 + yi) * 30;
        y += cos(millis()/3500 + yi*2 + xi) * 30;
        let c = color(
          180 + 60 * sin(xi*2 + millis()/2000),
          180 + 60 * sin(yi*2 + millis()/2500),
          180 + 60 * sin((xi+yi)*1.5 + millis()/3000),
          50
        );
        fill(c);
        noStroke();
        ellipse(
          x,
          y,
          35 + 18 * sin(millis()/4000 + xi + yi),
          35 + 18 * sin(millis()/4000 + xi + yi)
        );
      }
    }

    fill(0);
    textSize(36);
    text("遊戲結束！你的分數：" + score, width/2, height/2 - 40);

    // 再玩一次按鈕參數（向左移一點）
    let retryBtnX = width/2 - 90;
    let retryBtnY = height/2 + 60;
    let retryBtnW = 160;
    let retryBtnH = 60;

    // 返回首頁按鈕參數（在右側）
    let homeBtnX = width/2 + 90;
    let homeBtnY = height/2 + 60;
    let homeBtnW = 160;
    let homeBtnH = 60;

    // 畫再玩一次按鈕
    fill(0, 102, 204);
    rect(retryBtnX, retryBtnY, retryBtnW, retryBtnH, 20);
    textSize(28);
    fill(255);
    noStroke();
    text("再玩一次", retryBtnX, retryBtnY);

    // 畫返回首頁按鈕
    fill(204, 102, 0);
    rect(homeBtnX, homeBtnY, homeBtnW, homeBtnH, 20);
    fill(255);
    text("返回首頁", homeBtnX, homeBtnY);

    // 判斷手是否碰到再玩一次按鈕
    if (hands.length > 0) {
      for (let hand of hands) {
        let finger = hand.keypoints[8]; // 食指尖端
        if (
          finger.x > retryBtnX - retryBtnW/2 && finger.x < retryBtnX + retryBtnW/2 &&
          finger.y > retryBtnY - retryBtnH/2 && finger.y < retryBtnY + retryBtnH/2
        ) {
          // 重新開始遊戲
          gameStarted = true;
          gameOver = false;
          score = 0;
          timer = 20;
          bullets = [];
          targets = [];
          for (let i = 0; i < 5; i++) {
            targets.push(new Target());
          }
          break;
        }
      }
    }

    // 判斷雙手是否同時碰到返回首頁按鈕（這裡 homeBtnX 等才有值！）
    if (hands.length >= 2) {
      let hitCount = 0;
      for (let hand of hands) {
        let finger = hand.keypoints[8];
        if (
          finger.x > homeBtnX - homeBtnW/2 && finger.x < homeBtnX + homeBtnW/2 &&
          finger.y > homeBtnY - homeBtnH/2 && finger.y < homeBtnY + homeBtnH/2
        ) {
          hitCount++;
        }
      }
      if (hitCount >= 1) { // 單手即可觸發，正式上線再改回2
        gameStarted = false;
        gameOver = false;
        score = 0;
        timer = 20;
        bullets = [];
        targets = [];
      }
    }
    return;
  }

  // ====== 4. 遊戲主畫面 ======
  // 顯示目標
  for (let t of targets) t.moveAndShow();

  // 顯示子彈
  for (let b of bullets) b.moveAndShow();

  // 子彈與目標碰撞
  for (let b of bullets) {
    for (let t of targets) {
      if (!t.hit && dist(b.x, b.y, t.x, t.y) < t.w/2) {
        t.hit = true;
        t.exploding = true;      // 觸發爆炸
        t.explodeFrame = 0;      // 重設爆炸計數
        score++;
        b.toRemove = true;       // 標記這顆子彈要移除
        break;                   // 這顆子彈只打中一個標籤就結束
      }
    }
  }

  // 移除已擊中目標與被標記移除的子彈
  targets = targets.filter(t => !(t.hit && t.exploding && t.explodeFrame > 10));
  bullets = bullets.filter(b => b.y > 0 && !b.toRemove);

  // 補充新目標
  while (targets.length < 4) { // 只保留4個
    targets.push(new Target());
  }

  // 顯示分數與時間
  fill(0);
  textSize(24);
  text("分數：" + score, 60, 30);
  text("剩餘時間：" + timer, width - 100, 30);

  // 手勢偵測與發射子彈
  if (hands.length > 0) {
    for (let i = 0; i < hands.length; i++) {
      let hand = hands[i];
      let index = hand.keypoints[8]; // 食指尖端
      let wrist = hand.keypoints[0]; // 手腕
      let thumbTip = hand.keypoints[4]; // 拇指指尖
      let thumbJoint = hand.keypoints[2]; // 拇指第二關節

      // 槍的角度與位置
      let dx = index.x - wrist.x;
      let dy = index.y - wrist.y;
      let angle = atan2(dy, dx);
      let gunLength = dist(wrist.x, wrist.y, index.x, index.y); // 槍長度

      push();
      translate(wrist.x, wrist.y);
      rotate(angle);

      // 判斷左右手（x 靠右視為右手）
      if (wrist.x > width / 2) {
        scale(-1, -1); // 右手：左右+上下翻轉
      } else {
        scale(-1, 1);  // 左手：只左右翻轉
      }

      imageMode(CENTER);
      image(gunImg, -gunLength/2, 0, gunLength, 120);
      pop();

      // 判斷拇指是否彎曲
      let thumbBent = dist(thumbTip.x, thumbTip.y, thumbJoint.x, thumbJoint.y) < 90;
      // 判斷食指是否彎曲
      let indexBent = dist(hand.keypoints[8].x, hand.keypoints[8].y, hand.keypoints[6].x, hand.keypoints[6].y) < 70;
      // 判斷食指是否「抬高」
      let indexRaised = (hand.keypoints[8].y < hand.keypoints[6].y - 30);

      // 每隻手各自記錄狀態
      if (typeof thumbWasBentArr[i] === 'undefined') thumbWasBentArr[i] = false;

      // 只要大拇指或食指彎曲，或食指抬高，且上一幀沒彎曲/抬高，就射擊
      let bentNow = thumbBent || indexBent || indexRaised;
      if (bentNow && !thumbWasBentArr[i] && millis() - lastShotTime > 200) {
        bullets.push(new Bullet(index.x, index.y));
        lastShotTime = millis();
      }
      thumbWasBentArr[i] = bentNow;

      // 印出偵測數值方便 debug
      console.log('thumb', dist(thumbTip.x, thumbTip.y, thumbJoint.x, thumbJoint.y), 
                  'index', dist(hand.keypoints[8].x, hand.keypoints[8].y, hand.keypoints[6].x, hand.keypoints[6].y),
                  'indexY', hand.keypoints[8].y, 'indexBaseY', hand.keypoints[6].y);
    }
  }
}

// 滑鼠點擊事件（桌面測試用）
function mousePressed() {
  if (!gameStarted) {
    // 判斷是否點到按鈕範圍
    if (mouseX > width/2 - 100 && mouseX < width/2 + 100 &&
        mouseY > height/2 - 40 && mouseY < height/2 + 40) {
      // gameStarted = true; // ← 刪掉這行
      countdown = 3;
      countdownStartTime = millis();
      gameStarted = false;
      score = 0;
      timer = 20;
      gameOver = false;
      bullets = [];
      targets = [];
      for (let i = 0; i < 5; i++) {
        targets.push(new Target());
      }
    }
  }
}

// handPose 偵測到手時的 callback
function gotHands(results) {
  hands = results;
}

// 子彈類別
class Bullet {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.r = 8;
    this.speed = 10;
  }
  moveAndShow() {
    this.y -= this.speed;
    fill(50, 100, 255);
    noStroke();
    ellipse(this.x, this.y, this.r*2, this.r*2);
  }
}

// 目標類別
class Target {
  constructor() {
    // 取得目前畫面上已經有的標籤文字
    let usedWords = targets.map(t => t.text);
    // 選出還沒出現過的文字
    let availableWords = targetWords.filter(w => !usedWords.includes(w));
    // 如果全部都出現過，就重置 availableWords
    if (availableWords.length === 0) availableWords = targetWords.slice();
    this.text = random(availableWords);

    textSize(20);
    this.w = textWidth(this.text) + 40; // 文字寬度+左右邊界
    this.h = 50;
    this.x = random(80, width - 80);
    this.y = random(80, height / 2 - 40); // 只在上半部
    this.speed = random(1, 3) * (random() > 0.5 ? 1 : -1);
    this.hit = false;
    this.exploding = false;    // 是否正在爆炸
    this.explodeFrame = 0;     // 爆炸動畫幀數
  }
  moveAndShow() {
    if (this.exploding) {
      // 顯示爆炸特效
      imageMode(CENTER);
      image(explosionImg, this.x, this.y, this.w + 40, this.h + 40);
      imageMode(CORNER); // ← 加這行，還原回預設
      this.explodeFrame++;
      return;
    }
    this.x += this.speed;
    if (this.x < this.w/2 || this.x > width - this.w/2) this.speed *= -1;
    fill(255, 200, 100);
    noStroke();
    rect(this.x, this.y, this.w, this.h, 10);
    fill(0);
    textSize(20);
    text(this.text, this.x, this.y);
  }
}

