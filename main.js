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

// ==========================================
// 1. KONFIGURASI FIREBASE ANDA (PENTING!)
// ==========================================
const firebaseConfig = {
  // NANTI KITA ISI BAGIAN INI (Lihat Tahap 2 di bawah)
  apiKey: "AIzaSyDDzocf21m0ioWmqzxOq1XAGfLqTMv1Ffo",
  authDomain: "ular-tangga-mbg.firebaseapp.com",
  projectId: "ular-tangga-mbg",
  storageBucket: "ular-tangga-mbg.firebasestorage.app",
  messagingSenderId: "53522881206",
  appId: "1:53522881206:web:0b33808b3ab5961af3a417",
};

const appId = "ular-tangga-mbg";

// Global Firebase References
window.db = null;
window.auth = null;
window.myUserId = null;
window.firebaseInitialized = false;

// Initialize Firebase
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
  console.warn(
    "Firebase belum disetting dengan benar. Mode online tidak akan jalan.",
  );
}

// ==========================================
// 2. PASTE SEMUA LOGIKA GAME DI SINI
// ==========================================
// (Paste kode Audio, LADDERS, SNAKES, QUESTIONS, fungsi getCoords, drawConnections, executeMove, rollDiceLocally, dll di sini)

// ==========================================
// 3. DAFTARKAN FUNGSI KE GLOBAL WINDOW
// (Agar bisa dipanggil oleh tombol di HTML)
// ==========================================
window.showPage = showPage;
window.showModal = showModal;
window.closeModal = closeModal;
window.toggleAudio = toggleAudio;
window.switchTab = switchTab;
window.updatePlayerInputs = updatePlayerInputs;
window.startGameLocal = startGameLocal;
window.createRoom = createRoom;
window.joinRoom = joinRoom;
window.startOnlineGame = startOnlineGame;
window.rollDiceLocally = rollDiceLocally;
window.quitGame = quitGame;
window.closeInfoModal = closeInfoModal;
