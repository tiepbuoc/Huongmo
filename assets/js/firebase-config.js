/* =========================================================
   Hướng Mở — Cấu hình Firebase (dùng chung cho mọi trang)
   Dự án Firebase: huongmo-8a3f7
   ========================================================= */

const firebaseConfig = {
  apiKey: "AIzaSyDtY8jY6UooBrC4GVuKJ-Wk3n8BOhELeew",
  authDomain: "huongmo-8a3f7.firebaseapp.com",
  projectId: "huongmo-8a3f7",
  storageBucket: "huongmo-8a3f7.firebasestorage.app",
  messagingSenderId: "557281871866",
  appId: "1:557281871866:web:ba6d84d1de383be88fc643",
  measurementId: "G-RVH03VR62Z"
};

// Dùng Firebase SDK bản "compat" (nạp qua thẻ <script> ở mỗi trang HTML)
// nên không cần build/bundler — phù hợp để deploy thẳng lên GitHub Pages.
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Tên các collection trong Firestore — đổi ở đây nếu bạn đặt tên khác.
const COL = {
  NGANH: "nganh",
  TRUONG: "truong",
  TOHOP: "tohop"
};
