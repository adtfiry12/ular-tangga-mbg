import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import {
  getAuth,
  signInAnonymously,
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDDzocf21m0ioWmqzxOq1XAGfLqTMv1Ffo",
  authDomain: "ular-tangga-mbg.firebaseapp.com",
  projectId: "ular-tangga-mbg",
  storageBucket: "ular-tangga-mbg.firebasestorage.app",
  messagingSenderId: "53522881206",
  appId: "1:53522881206:web:0b33808b3ab5961af3a417",
};

window.db = null;
window.auth = null;
window.myUserId = null;
window.firebaseInitialized = false;

let gameMode = "local";
let gameState = "menu";
let players = [];
let currentPlayerIndex = 0;
let isMoving = false;
let roomCode = "";
let pendingQuestion = null;
let consecutiveSixes = 0;
let pendingPlayersSync = null; // Menampung sinkronisasi jika data masuk saat animasi berjalan

try {
  const app = initializeApp(firebaseConfig);
  window.db = getFirestore(app);
  window.auth = getAuth(app);
  signInAnonymously(window.auth)
    .then((userCredential) => {
      window.myUserId = userCredential.user.uid;
      window.firebaseInitialized = true;
      console.log("Firebase Connected. UID:", window.myUserId);
    })
    .catch((e) => console.error("Firebase Auth Error:", e));
} catch (e) {
  console.warn("Koneksi Firebase gagal.");
}

const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx;
let audioEnabled = true;

window.initAudio = function () {
  if (!audioCtx) audioCtx = new AudioContext();
  if (audioCtx.state === "suspended") audioCtx.resume();
};

function playTone(freq, type, duration, vol = 0.1) {
  if (!audioEnabled || !audioCtx) return;
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.01,
      audioCtx.currentTime + duration,
    );
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {}
}

const SFX = {
  dice: () => {
    for (let i = 0; i < 5; i++)
      setTimeout(
        () => playTone(300 + Math.random() * 200, "square", 0.1, 0.05),
        i * 100,
      );
  },
  move: () => playTone(600, "sine", 0.1, 0.05),
  ladder: () => {
    for (let i = 0; i < 10; i++)
      setTimeout(() => playTone(400 + i * 50, "triangle", 0.1, 0.05), i * 50);
  },
  snake: () => {
    for (let i = 0; i < 10; i++)
      setTimeout(() => playTone(300 - i * 20, "sawtooth", 0.1, 0.05), i * 50);
  },
  correct: () => {
    playTone(523.25, "sine", 0.1, 0.1);
    setTimeout(() => playTone(659.25, "sine", 0.2, 0.1), 100);
    setTimeout(() => playTone(783.99, "sine", 0.3, 0.1), 200);
  },
  wrong: () => {
    playTone(300, "sawtooth", 0.3, 0.1);
    setTimeout(() => playTone(250, "sawtooth", 0.4, 0.1), 200);
  },
  win: () => {
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) =>
      setTimeout(() => playTone(freq, "square", 0.3, 0.1), i * 150),
    );
  },
};

const LADDERS = { 4: 14, 9: 31, 20: 38, 28: 84, 40: 59, 51: 67, 71: 91 };
const SNAKES = {
  17: 7,
  54: 34,
  62: 19,
  64: 60,
  87: 24,
  93: 73,
  95: 75,
  99: 78,
};
const QUESTION_CELLS = [12, 25, 33, 45, 58, 65, 77, 88];
const BONUS_CELLS = [8, 22, 43, 68, 81];
const PAWN_COLORS = ["#ef4444", "#3b82f6", "#eab308", "#22c55e"];
const PAWN_ICONS = ["🍎", "💧", "🍌", "🥦"];
const QUESTIONS = [
  {
    q: "Manakah makanan yang merupakan sumber protein?",
    options: ["Telur", "Permen", "Keripik", "Minuman Bersoda"],
    ans: 0,
    exp: "Telur kaya akan protein yang baik untuk otot dan otak.",
    icon: "🥚",
  },
  {
    q: "Apa fungsi utama karbohidrat bagi tubuh?",
    options: [
      "Sumber energi",
      "Membangun tulang",
      "Mencegah penyakit",
      "Melancarkan darah",
    ],
    ans: 0,
    exp: "Karbohidrat (seperti nasi, roti) adalah sumber energi utama.",
    icon: "🍚",
  },
  {
    q: "Buah jeruk sangat kaya akan vitamin apa?",
    options: ["Vitamin A", "Vitamin B", "Vitamin C", "Vitamin D"],
    ans: 2,
    exp: "Jeruk kaya Vitamin C untuk daya tahan tubuh.",
    icon: "🍊",
  },
  {
    q: "Sebelum makan, hal terpenting yang harus dilakukan adalah?",
    options: [
      "Berlari",
      "Mencuci tangan dengan sabun",
      "Tidur",
      "Minum air es",
    ],
    ans: 1,
    exp: "Mencuci tangan mencegah kuman masuk ke perut.",
    icon: "🧼",
  },
  {
    q: "Mengapa kita butuh minum air putih yang cukup?",
    options: [
      "Agar kenyang",
      "Mencegah dehidrasi",
      "Agar bisa terbang",
      "Mewarnai darah",
    ],
    ans: 1,
    exp: "Air putih menjaga tubuh tetap terhidrasi dan fokus.",
    icon: "💧",
  },
];

window.showPage = function (pageId) {
  window.initAudio();
  document.querySelectorAll("section").forEach((s) => s.classList.add("hide"));
  document.getElementById(pageId).classList.remove("hide");
  gameState =
    pageId === "page-game"
      ? "playing"
      : pageId === "page-setup"
        ? "setup"
        : "menu";
};

window.showModal = function (modalId) {
  window.initAudio();
  document.getElementById(modalId).classList.remove("hide");
};
window.closeModal = function (modalId) {
  document.getElementById(modalId).classList.add("hide");
};
window.toggleAudio = function () {
  audioEnabled = !audioEnabled;
  document.getElementById("btn-audio").innerText = audioEnabled ? "🔊" : "🔇";
};

window.switchTab = function (mode) {
  window.initAudio();
  ["local", "online"].forEach((t) => {
    document.getElementById("setup-" + t).classList.add("hide");
    document
      .getElementById("tab-" + t)
      .classList.replace("text-green-600", "text-slate-500");
    document
      .getElementById("tab-" + t)
      .classList.replace("bg-green-500", "bg-transparent");
    document
      .getElementById("tab-" + t)
      .classList.replace("text-white", "text-slate-500");
  });
  document.getElementById("setup-" + mode).classList.remove("hide");
  document
    .getElementById("tab-" + mode)
    .classList.replace("text-slate-500", "text-white");
  document
    .getElementById("tab-" + mode)
    .classList.replace("bg-transparent", "bg-green-500");
};

window.updatePlayerInputs = function () {
  const count = parseInt(document.getElementById("player-count").value);
  const container = document.getElementById("player-inputs-container");
  container.innerHTML = "";
  for (let i = 1; i <= (count === 1 ? 2 : count); i++) {
    let isBot = count === 1 && i === 2;
    container.innerHTML += `
      <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full flex items-center justify-center text-xl text-white shadow-sm" style="background-color: ${PAWN_COLORS[i - 1]}">${PAWN_ICONS[i - 1]}</div>
          <input type="text" id="p-name-${i - 1}" value="${isBot ? "Komputer" : `Player ${i}`}" ${isBot ? "disabled" : ""} class="flex-grow bg-slate-50 border-2 border-slate-200 rounded-xl p-3 font-bold outline-none focus:border-green-500 transition" maxlength="12">
      </div>`;
  }
};

window.addEventListener("DOMContentLoaded", window.updatePlayerInputs);

window.startGameLocal = function () {
  window.initAudio();
  gameMode = "local";
  const count = parseInt(document.getElementById("player-count").value);
  players = [];
  for (let i = 0; i < (count === 1 ? 2 : count); i++) {
    players.push({
      id: "local_" + i,
      name:
        document.getElementById(`p-name-${i}`).value.trim() ||
        `Player ${i + 1}`,
      pos: 1,
      score: 0,
      icon: PAWN_ICONS[i],
      color: PAWN_COLORS[i],
      isBot: count === 1 && i === 1,
    });
  }
  initGameUI();
};

function initGameUI() {
  window.showPage("page-game");
  window.closeModal("modal-winner");
  currentPlayerIndex = 0;
  isMoving = false;
  consecutiveSixes = 0;
  pendingPlayersSync = null;
  if (gameMode === "online") {
    document.getElementById("room-info").classList.remove("hide");
    document.getElementById("game-room-code").innerText = roomCode;
  } else {
    document.getElementById("room-info").classList.add("hide");
  }
  drawBoardGrid();
  drawConnections();
  renderAllPawns(true);
  updateTurnUI();
  updateLeaderboard();
}

function drawBoardGrid() {
  const grid = document.getElementById("board-grid");
  grid.innerHTML = "";
  for (let row = 9; row >= 0; row--) {
    for (let col = 0; col < 10; col++) {
      let cellNum =
        row % 2 === 0 ? row * 10 + col + 1 : row * 10 + (9 - col) + 1;
      let cellDiv = document.createElement("div");
      cellDiv.className = `cell ${BONUS_CELLS.includes(cellNum) ? "bonus" : ""} ${QUESTION_CELLS.includes(cellNum) ? "question" : ""}`;
      cellDiv.id = `cell-${cellNum}`;
      cellDiv.innerText = cellNum;
      grid.appendChild(cellDiv);
    }
  }
}

function getCoords(cell) {
  if (cell < 1 || cell > 100) return null;
  let row = Math.floor((cell - 1) / 10),
    col = (cell - 1) % 10;
  return { x: row % 2 !== 0 ? 9 - col : col, y: 9 - row };
}

function drawConnections() {
  const svg = document.getElementById("svg-layer");
  if (!svg) return;

  let svgStr = "";
  for (let [s, e] of Object.entries(LADDERS)) {
    let p1 = getCoords(s),
      p2 = getCoords(e);
    let x1 = p1.x * 10 + 5,
      y1 = p1.y * 10 + 5,
      x2 = p2.x * 10 + 5,
      y2 = p2.y * 10 + 5;
    let dx = x2 - x1,
      dy = y2 - y1;
    let angle = Math.atan2(dy, dx);
    let offsetX = Math.cos(angle + Math.PI / 2) * 1.8;
    let offsetY = Math.sin(angle + Math.PI / 2) * 1.8;

    svgStr += `<line x1="${x1 - offsetX}" y1="${y1 - offsetY}" x2="${x2 - offsetX}" y2="${y2 - offsetY}" stroke="#78350f" stroke-width="1.2" stroke-linecap="round"/>`;
    svgStr += `<line x1="${x1 + offsetX}" y1="${y1 + offsetY}" x2="${x2 + offsetX}" y2="${y2 + offsetY}" stroke="#78350f" stroke-width="1.2" stroke-linecap="round"/>`;

    let dist = Math.sqrt(dx * dx + dy * dy);
    let steps = Math.floor(dist / 3.5);
    for (let i = 1; i <= steps; i++) {
      let px = x1 + (dx * i) / (steps + 1);
      let py = y1 + (dy * i) / (steps + 1);
      svgStr += `<line x1="${px - offsetX}" y1="${py - offsetY}" x2="${px + offsetX}" y2="${py + offsetY}" stroke="#92400e" stroke-width="0.9"/>`;
    }
  }

  for (let [s, e] of Object.entries(SNAKES)) {
    let p1 = getCoords(s),
      p2 = getCoords(e);
    let x1 = p1.x * 10 + 5,
      y1 = p1.y * 10 + 5,
      x2 = p2.x * 10 + 5,
      y2 = p2.y * 10 + 5;
    let dx = x2 - x1,
      dy = y2 - y1;

    let cp1x = x1 + dx * 0.2 - dy * 0.4;
    let cp1y = y1 + dy * 0.2 + dx * 0.4;
    let cp2x = x1 + dx * 0.8 + dy * 0.4;
    let cp2y = y1 + dy * 0.8 - dx * 0.4;

    svgStr += `<path d="M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}" stroke="#064e3b" stroke-width="2.8" fill="none" stroke-linecap="round"/>`;
    svgStr += `<path d="M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}" stroke="#10b981" stroke-width="1.2" fill="none" stroke-linecap="round" stroke-dasharray="1.5 1.5"/>`;
    svgStr += `<circle cx="${x1}" cy="${y1}" r="1.8" fill="#dc2626"/>`;
    svgStr += `<circle cx="${x1 - 0.5}" cy="${y1 - 0.5}" r="0.4" fill="white"/>`;
    svgStr += `<circle cx="${x1 + 0.5}" cy="${y1 - 0.5}" r="0.4" fill="white"/>`;
  }

  svg.innerHTML = svgStr;
}

function renderAllPawns(forceRebuild = false) {
  const container = document.getElementById("pawns-container");
  if (forceRebuild) container.innerHTML = "";
  let posCounts = {},
    posCurrent = {};
  players.forEach((p) => (posCounts[p.pos] = (posCounts[p.pos] || 0) + 1));

  players.forEach((p, index) => {
    const c = getCoords(p.pos);
    if (!c) return;
    let cx = c.x * 10 + 5,
      cy = c.y * 10 + 5;
    if (posCounts[p.pos] > 1) {
      const angle = ((posCurrent[p.pos] || 0) / posCounts[p.pos]) * Math.PI * 2;
      cx += Math.cos(angle) * 2.5;
      cy += Math.sin(angle) * 2.5;
    }
    posCurrent[p.pos] = (posCurrent[p.pos] || 0) + 1;

    let pawnDiv = document.getElementById(`pawn-${index}`);
    if (!pawnDiv) {
      pawnDiv = document.createElement("div");
      pawnDiv.className = "pawn";
      pawnDiv.id = `pawn-${index}`;
      container.appendChild(pawnDiv);
    }
    pawnDiv.style.backgroundColor = p.color;
    pawnDiv.innerText = p.icon;
    pawnDiv.style.left = `${cx}%`;
    pawnDiv.style.top = `${cy}%`;
    pawnDiv.style.transition = isMoving ? "all 0.3s ease-in-out" : "none";
  });
}

function updateTurnUI() {
  if (players.length === 0) return;
  const cp = players[currentPlayerIndex];
  if (!cp) return;
  const btnRoll = document.getElementById("btn-roll");

  document.getElementById("cp-name").innerText = cp.name;
  document.getElementById("cp-icon").innerText = cp.icon;
  document.getElementById("cp-name").style.color = cp.color;

  if (gameMode === "online") {
    btnRoll.disabled = cp.id !== window.myUserId || isMoving;
    btnRoll.innerText =
      cp.id === window.myUserId ? "LEMPAR DADU" : "MENUNGGU LAWAN...";
    btnRoll.className = btnRoll.disabled
      ? "bg-slate-400 text-white font-black text-lg md:text-xl py-3.5 md:py-4 px-8 md:px-12 rounded-full cursor-not-allowed opacity-75 w-[90%] max-w-[280px]"
      : "z-10 bg-gradient-to-b from-orange-400 to-orange-600 hover:from-orange-500 hover:to-orange-700 text-white font-black text-lg md:text-xl py-3.5 md:py-4 px-8 md:px-12 rounded-full shadow-[0_6px_0_#9a3412] active:shadow-[0_0px_0_#9a3412] active:translate-y-1.5 transition-all w-[90%] max-w-[280px]";
  } else {
    btnRoll.disabled = cp.isBot || isMoving;
    btnRoll.innerText = cp.isBot ? "KOMPUTER BERFIKIR..." : "LEMPAR DADU";
    if (cp.isBot && !isMoving) setTimeout(window.rollDiceLocally, 1500);
  }
}

function updateLeaderboard() {
  let sorted = [...players].sort((a, b) =>
    b.pos !== a.pos ? b.pos - a.pos : b.score - a.score,
  );
  const lb = document.getElementById("leaderboard");
  lb.innerHTML = "";
  sorted.forEach((p) => {
    let isCurrentTurn = p.id === players[currentPlayerIndex]?.id;
    lb.innerHTML += `
      <div class="flex items-center justify-between p-2.5 rounded-xl border-2 ${isCurrentTurn ? "bg-green-100 border-green-300" : "bg-slate-50 border-slate-100"}">
          <div class="flex items-center gap-3 font-bold">
              <span class="w-8 h-8 rounded-full flex justify-center items-center text-sm shadow-sm border border-white" style="background-color: ${p.color}">${p.icon}</span>
              <span class="text-sm truncate w-24 text-slate-700">${p.name}</span>
          </div>
          <div class="text-right font-black text-green-700 text-lg">${p.pos}</div>
      </div>`;
  });
}

window.rollDiceLocally = function () {
  if (isMoving) return;
  if (
    gameMode === "online" &&
    players[currentPlayerIndex].id !== window.myUserId
  )
    return;

  isMoving = true;
  document.getElementById("btn-roll").disabled = true;
  const diceRoll = Math.floor(Math.random() * 6) + 1;
  const diceEl = document.getElementById("dice");
  diceEl.classList.add("rolling");
  SFX.dice();

  if (gameMode === "online")
    window.sendOnlineAction("roll", { diceValue: diceRoll });

  setTimeout(() => {
    diceEl.classList.remove("rolling");
    diceEl.innerText = diceRoll;
    executeMove(diceRoll);
  }, 600);
};

function executeMove(diceRoll) {
  const p = players[currentPlayerIndex];
  let targetCell = p.pos + diceRoll;
  let moves = [];
  if (targetCell > 100) {
    let over = targetCell - 100;
    for (let i = p.pos + 1; i <= 100; i++) moves.push(i);
    for (let i = 99; i >= 100 - over; i--) moves.push(i);
  } else {
    for (let i = p.pos + 1; i <= targetCell; i++) moves.push(i);
  }

  let moveIdx = 0;
  function step() {
    if (moveIdx < moves.length) {
      p.pos = moves[moveIdx];
      renderAllPawns();
      SFX.move();
      let pawnEl = document.getElementById(`pawn-${currentPlayerIndex}`);
      if (pawnEl) {
        pawnEl.classList.remove("hopping");
        void pawnEl.offsetWidth;
        pawnEl.classList.add("hopping");
      }
      moveIdx++;
      setTimeout(step, 300);
    } else {
      checkCellEvent(diceRoll);
    }
  }
  step();
}

function animateRemoteMove(pIdx, diceRoll) {
  let p = players[pIdx];
  let targetCell = p.pos + diceRoll;
  let moves = [];
  if (targetCell > 100) {
    let over = targetCell - 100;
    for (let i = p.pos + 1; i <= 100; i++) moves.push(i);
    for (let i = 99; i >= 100 - over; i--) moves.push(i);
  } else {
    for (let i = p.pos + 1; i <= targetCell; i++) moves.push(i);
  }

  let moveIdx = 0;
  isMoving = true;

  function step() {
    if (moveIdx < moves.length) {
      p.pos = moves[moveIdx];
      renderAllPawns();
      SFX.move();
      let pawnEl = document.getElementById(`pawn-${pIdx}`);
      if (pawnEl) {
        pawnEl.classList.remove("hopping");
        void pawnEl.offsetWidth;
        pawnEl.classList.add("hopping");
      }
      moveIdx++;
      setTimeout(step, 300);
    } else {
      isMoving = false;
      // Jika saat animasi berjalan ada data sinkronisasi baru dari server, aplikasikan sekarang
      if (pendingPlayersSync) {
        players = pendingPlayersSync;
        pendingPlayersSync = null;
      }
      renderAllPawns();
      updateLeaderboard();
      updateTurnUI();
    }
  }
  step();
}

function checkCellEvent(diceRoll) {
  const p = players[currentPlayerIndex];
  if (p.pos === 100) return handleWin();
  if (LADDERS[p.pos]) {
    setTimeout(() => {
      SFX.ladder();
      window.showInfoModal(
        "🪜 Naik!",
        `Naik ke kotak ${LADDERS[p.pos]}.`,
        () => {
          p.pos = LADDERS[p.pos];
          p.score += 5;
          renderAllPawns();
          checkPostMoveEvent(diceRoll);
        },
      );
    }, 400);
    return;
  }
  if (SNAKES[p.pos]) {
    setTimeout(() => {
      SFX.snake();
      window.showInfoModal(
        "🐍 Turun!",
        `Turun ke kotak ${SNAKES[p.pos]}.`,
        () => {
          p.pos = SNAKES[p.pos];
          renderAllPawns();
          checkPostMoveEvent(diceRoll);
        },
      );
    }, 400);
    return;
  }
  if (BONUS_CELLS.includes(p.pos)) {
    setTimeout(() => {
      SFX.correct();
      window.showInfoModal("🎁 Bonus!", "Dapat +10 Poin.", () => {
        p.score += 10;
        checkPostMoveEvent(diceRoll);
      });
    }, 400);
    return;
  }
  if (QUESTION_CELLS.includes(p.pos)) {
    setTimeout(() => triggerQuestion(diceRoll), 400);
    return;
  }
  checkPostMoveEvent(diceRoll);
}

function checkPostMoveEvent(diceRoll) {
  updateLeaderboard();
  if (
    gameMode === "online" &&
    players[currentPlayerIndex].id === window.myUserId
  )
    window.sendOnlineAction("sync");
  advanceTurn(diceRoll);
}

function triggerQuestion(diceRoll) {
  const q = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];
  pendingQuestion = { data: q, diceRoll: diceRoll, answered: false };
  document.getElementById("q-text").innerText = q.q;
  document.getElementById("q-icon").innerText = q.icon;
  const optionsDiv = document.getElementById("q-options");
  optionsDiv.innerHTML = "";
  q.options.forEach((opt, idx) => {
    let btn = document.createElement("button");
    btn.className =
      "w-full text-left bg-slate-50 hover:bg-yellow-50 border-2 border-slate-200 hover:border-yellow-400 font-bold p-4 rounded-xl flex items-center gap-3 transition";
    btn.innerHTML = `<div class="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center font-black text-slate-600">${String.fromCharCode(65 + idx)}</div> <span>${opt}</span>`;
    btn.onclick = () => window.answerQuestion(idx);
    optionsDiv.appendChild(btn);
  });
  window.showModal("modal-question");
  if (gameMode === "local" && players[currentPlayerIndex].isBot)
    setTimeout(
      () =>
        window.answerQuestion(Math.random() > 0.3 ? q.ans : (q.ans + 1) % 4),
      2000,
    );
}

window.answerQuestion = function (selectedIdx) {
  if (!pendingQuestion || pendingQuestion.answered) return;
  pendingQuestion.answered = true;
  window.closeModal("modal-question");
  const q = pendingQuestion.data,
    p = players[currentPlayerIndex];
  if (selectedIdx === q.ans) {
    SFX.correct();
    p.score += 10;
    window.showInfoModal("🌟 BENAR!", q.exp, () =>
      checkPostMoveEvent(pendingQuestion.diceRoll),
    );
  } else {
    SFX.wrong();
    window.showInfoModal(
      "❌ Salah",
      `Jawaban benar: ${q.options[q.ans]}<br>${q.exp}`,
      () => checkPostMoveEvent(pendingQuestion.diceRoll),
    );
  }
};

window.showInfoModal = function (title, desc, callback) {
  document.getElementById("info-title").innerHTML = title;
  document.getElementById("info-desc").innerHTML = desc;
  window.showModal("modal-info");
  window.infoModalCallback = callback;
};

window.closeInfoModal = function () {
  window.closeModal("modal-info");
  if (window.infoModalCallback) {
    const cb = window.infoModalCallback;
    window.infoModalCallback = null;
    cb();
  }
};

function advanceTurn(lastDiceRoll) {
  isMoving = false;
  if (lastDiceRoll === 6) {
    consecutiveSixes++;
    if (consecutiveSixes >= 3) {
      window.showInfoModal(
        "❌ 3 Kali Angka 6!",
        "Giliranmu hangus karena mendapat angka 6 tiga kali berturut-turut. Pindah giliran!",
        () => {
          consecutiveSixes = 0;
          currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
          updateTurnUI();
          if (
            gameMode === "online" &&
            players[(currentPlayerIndex - 1 + players.length) % players.length]
              .id === window.myUserId
          ) {
            window.sendOnlineAction("sync");
          }
        },
      );
      return;
    } else {
      window.showInfoModal("🎲 Angka 6!", "Berhak melempar dadu lagi!", () => {
        updateTurnUI();
        if (
          gameMode === "online" &&
          players[currentPlayerIndex].id === window.myUserId
        ) {
          window.sendOnlineAction("sync");
        }
      });
      return;
    }
  }

  consecutiveSixes = 0;
  currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
  updateTurnUI();
  if (
    gameMode === "online" &&
    players[(currentPlayerIndex - 1 + players.length) % players.length].id ===
      window.myUserId
  ) {
    window.sendOnlineAction("sync");
  }
}

function handleWin() {
  SFX.win();
  players[currentPlayerIndex].score += 50;
  updateLeaderboard();
  document.getElementById("winner-name").innerText =
    `${players[currentPlayerIndex].name} Menang!`;
  document.getElementById("winner-score").innerText =
    players[currentPlayerIndex].score;
  window.showModal("modal-winner");
  if (gameMode === "online" && window.isHost)
    updateDoc(doc(window.db, "rooms", roomCode), { status: "finished" });
}

// BUG FIX 2: Fitur "Keluar Permainan" agar akun tidak nyangkut di server
window.quitGame = async function () {
  if (confirm("Yakin ingin keluar dan kembali ke menu utama?")) {
    if (gameMode === "online" && roomCode) {
      try {
        const roomRef = doc(window.db, "rooms", roomCode);
        const docSnap = await getDoc(roomRef);
        if (docSnap.exists()) {
          let data = docSnap.data();
          let newPlayers = data.players.filter((p) => p.id !== window.myUserId);

          if (newPlayers.length > 0) {
            let newTurn = data.turn;
            let leftPlayerIndex = data.players.findIndex(
              (p) => p.id === window.myUserId,
            );

            // Atur giliran agar tidak macet jika yang keluar adalah yang sedang main
            if (leftPlayerIndex === data.turn) {
              newTurn = newTurn % newPlayers.length;
            } else if (leftPlayerIndex < data.turn) {
              newTurn = data.turn - 1;
            }

            // Pindahkan Host jika yang keluar adalah Host
            let newHostId =
              data.hostId === window.myUserId ? newPlayers[0].id : data.hostId;

            await updateDoc(roomRef, {
              players: newPlayers,
              turn: newTurn,
              hostId: newHostId,
              lastAction: {
                id: Math.random().toString(36).substring(2, 9),
                type: "leave",
                userId: window.myUserId,
                name: data.players[leftPlayerIndex].name,
              },
            });
          }
        }
      } catch (e) {
        console.error("Gagal menghapus pemain dari server:", e);
      }

      if (window.roomUnsubscribe) window.roomUnsubscribe();
    }
    window.showPage("page-landing");
  }
};

window.createRoom = async function () {
  if (!window.firebaseInitialized) return alert("Koneksi server belum siap.");
  const name =
    document.getElementById("online-player-name").value.trim() || "Host";
  roomCode = Math.random().toString(36).substring(2, 7).toUpperCase();
  gameMode = "online";
  window.isHost = true;

  const roomRef = doc(window.db, "rooms", roomCode);
  await setDoc(roomRef, {
    hostId: window.myUserId,
    status: "waiting",
    players: [
      {
        id: window.myUserId,
        name: name,
        pos: 1,
        score: 0,
        icon: PAWN_ICONS[0],
        color: PAWN_COLORS[0],
      },
    ],
    turn: 0,
    lastAction: null,
  });

  document.getElementById("lobby-code-display").innerText = roomCode;
  document.getElementById("online-lobby").classList.remove("hide");
  document.getElementById("btn-start-online").classList.remove("hidden");
  document.getElementById("lbl-waiting-host").classList.add("hidden");
  listenToRoom(roomCode);
};

window.joinRoom = async function () {
  if (!window.firebaseInitialized) return alert("Server belum siap.");
  const name =
    document.getElementById("online-player-name").value.trim() || "Player";
  roomCode = document
    .getElementById("join-room-code")
    .value.trim()
    .toUpperCase();
  if (roomCode.length !== 5) return alert("Kode tidak valid.");

  const roomRef = doc(window.db, "rooms", roomCode);
  const docSnap = await getDoc(roomRef);
  if (!docSnap.exists()) return alert("Ruangan tidak ditemukan!");

  let data = docSnap.data();
  if (data.status !== "waiting") return alert("Permainan sudah dimulai.");
  if (data.players.length >= 4) return alert("Ruangan penuh.");

  if (!data.players.find((p) => p.id === window.myUserId)) {
    data.players.push({
      id: window.myUserId,
      name: name,
      pos: 1,
      score: 0,
      icon: PAWN_ICONS[data.players.length],
      color: PAWN_COLORS[data.players.length],
    });
    await updateDoc(roomRef, { players: data.players });
  }

  gameMode = "online";
  window.isHost = false;
  document.getElementById("lobby-code-display").innerText = roomCode;
  document.getElementById("online-lobby").classList.remove("hide");
  document.getElementById("btn-start-online").classList.add("hidden");
  document.getElementById("lbl-waiting-host").classList.remove("hidden");
  listenToRoom(roomCode);
};

window.startOnlineGame = async function () {
  if (!window.isHost) return;
  await updateDoc(doc(window.db, "rooms", roomCode), { status: "playing" });
};

function listenToRoom(code) {
  window.roomUnsubscribe = onSnapshot(
    doc(window.db, "rooms", code),
    (docSnap) => {
      if (!docSnap.exists()) return;
      const data = docSnap.data();

      if (data.status === "waiting") {
        document.getElementById("lobby-players").innerHTML = data.players
          .map(
            (p) =>
              `<li>${p.icon} ${p.name} ${p.id === data.hostId ? "(Host)" : ""}</li>`,
          )
          .join("");
      }

      if (data.status === "playing" && gameState !== "playing") {
        players = data.players;
        initGameUI();
      }

      if (data.status === "playing" && gameState === "playing") {
        window.isHost = data.hostId === window.myUserId;

        // Proses pergerakan aksi pemain lain
        if (
          data.lastAction &&
          data.lastAction.id !== window.lastLocalActionId
        ) {
          processServerAction(data);
        } else {
          // Jika tidak ada trigger aksi khusus, pastikan array sinkron di latar belakang (kecuali saat animasi)
          if (!isMoving && data.lastAction?.type !== "roll") {
            players = data.players;
          }
        }

        // Update UI Giliran jika giliran berubah (bisa berubah saat turn advance atau saat orang leave)
        if (currentPlayerIndex !== data.turn) {
          currentPlayerIndex = data.turn;
          updateTurnUI();
        }
      }
    },
  );
}

window.sendOnlineAction = async function (type, updates = {}) {
  if (gameMode !== "online") return;
  window.lastLocalActionId = Math.random().toString(36).substring(2, 9);
  await updateDoc(doc(window.db, "rooms", roomCode), {
    players: players,
    turn: currentPlayerIndex,
    lastAction: {
      id: window.lastLocalActionId,
      type: type,
      userId: window.myUserId,
      ...updates,
    },
  });
};

function processServerAction(data) {
  window.lastLocalActionId = data.lastAction.id;

  if (data.lastAction.type === "roll") {
    // BUG FIX 1: Tampilkan Animasi Lompat untuk Teman
    const pIdx = players.findIndex((p) => p.id === data.lastAction.userId);
    const diceEl = document.getElementById("dice");
    diceEl.innerText = data.lastAction.diceValue;
    diceEl.classList.add("rolling");
    SFX.dice();

    setTimeout(() => {
      diceEl.classList.remove("rolling");
      if (pIdx !== -1) animateRemoteMove(pIdx, data.lastAction.diceValue);
    }, 600);
  } else if (data.lastAction.type === "leave") {
    // BUG FIX 2: Menangani pemain yang keluar saat online
    isMoving = false; // Menghentikan animasi jika ada
    players = data.players;
    renderAllPawns(true); // Redraw ulang pion untuk menghilangkan pemain yang pergi
    updateLeaderboard();

    alert(`Pemain "${data.lastAction.name}" telah keluar dari permainan.`);

    // Auto-win jika tinggal sisa 1 orang
    if (players.length === 1 && players[0].id === window.myUserId) {
      alert("Semua lawan telah keluar. Anda otomatis memenangkan permainan!");
      handleWin();
    }
  } else {
    // "sync" action biasa (Tangga, Ular, Poin)
    if (isMoving) {
      pendingPlayersSync = data.players; // Simpan data untuk diterapkan setelah animasi selesai
    } else {
      players = data.players;
      renderAllPawns();
      updateLeaderboard();
    }
  }
}
