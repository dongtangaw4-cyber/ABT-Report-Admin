// ===== Firebase (Firestore) =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getFirestore, collection, query, orderBy, onSnapshot,
  doc, updateDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// --- โปรเจ็กต์ของคุณ ---
const firebaseConfig = {
  apiKey: "AIzaSyDR8hVqZ1uDrjRMjK6u_rWO6c7Cs5-vDXw",
  authDomain: "abt-report.firebaseapp.com",
  projectId: "abt-report",
  storageBucket: "abt-report.appspot.com",
  messagingSenderId: "166748459797",
  appId: "1:166748459797:web:0cf5693e43a551142a8f1c"
};

const app  = initializeApp(firebaseConfig);
const db   = getFirestore(app);

// ===== Cloudinary (Unsigned upload) =====
// เปลี่ยนตามของคุณ ถ้าไม่ตรง
const CLOUD_NAME    = "dm7cggzov";
const UPLOAD_PRESET = "abt_admin";

// อัปโหลดไฟล์ไป Cloudinary -> คืน secure_url
async function uploadToCloudinary(file){
  const url  = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`;
  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", UPLOAD_PRESET);
  // optional: โฟลเดอร์
  // form.append("folder", "abt-report/reports");

  const res = await fetch(url, { method:"POST", body: form });
  if(!res.ok) throw new Error("Upload failed");
  const data = await res.json();
  return data.secure_url; // ใช้ลิงก์ https ปลอดภัย
}

// ===== DOM refs =====
const rowsEl      = document.getElementById("rows");
const fileChooser = document.getElementById("fileChooser");

// ===== เรนเดอร์ตาราง (ตัวอย่างโครง) =====
// NOTE: ใช้ r.photo ให้ตรงกับ Firestore ของคุณ
function renderRows(list){
  rowsEl.innerHTML = list.map(r => `
    <tr>
      <td>${new Date((r.createdAt?.seconds||0)*1000).toLocaleString("th-TH")}</td>
      <td>
        <div><strong>${r.name || r.reporterName || "-"}</strong></div>
        <div class="muted">${r.phone || ""}</div>
      </td>
      <td>
        <div>${r.category || "-"}</div>
        <div class="muted">${r.detail || ""}</div>
      </td>
      <td><img class="thumb" src="${r.photo || ""}" alt=""></td>
      <td>
        ${r.lat || ""}, ${r.lng || ""}<br>
        <a href="https://maps.google.com/?q=${r.lat||""},${r.lng||""}" target="_blank">เปิดแผนที่</a>
      </td>
      <td>${r.status || "-"}</td>
      <td class="right">
        <button class="btn-change-img" data-id="${r.id}">เปลี่ยนรูป</button>
      </td>
    </tr>
  `).join("");
}

// ===== โหลดรายการจาก Firestore (เรียลไทม์) =====
const qReports = query(collection(db, "reports"), orderBy("createdAt", "desc"));
let currentList = [];
onSnapshot(qReports, snap=>{
  currentList = snap.docs.map(d=>({ id: d.id, ...d.data() }));
  renderRows(currentList);
});

// ===== เปลี่ยนรูป: กดปุ่ม -> เปิดเลือกไฟล์ -> อัปโหลด -> อัปเดต Firestore =====
let currentChangeId = null;

// จับคลิกที่ปุ่มในตาราง (event delegation)
rowsEl.addEventListener("click", (e)=>{
  const btn = e.target.closest(".btn-change-img");
  if(!btn) return;
  currentChangeId = btn.dataset.id;
  fileChooser.value = "";
  fileChooser.click();
});

fileChooser.addEventListener("change", async () => {
  const file = fileChooser.files?.[0];
  if(!file || !currentChangeId) return;

  try {
    // 1) อัปโหลดขึ้น Cloudinary
    const newUrl = await uploadToCloudinary(file);

    // 2) อัปเดต Firestore —> ฟิลด์ "photo" (ให้ตรงกับของคุณ)
    await updateDoc(doc(db, "reports", currentChangeId), {
      photo: newUrl,                 // *** ชื่อฟิลด์ตรงกับ Firestore ***
      updatedAt: serverTimestamp()
    });

    alert("เปลี่ยนรูปเรียบร้อย ✅");
    currentChangeId = null; // เคลียร์
    // onSnapshot จะเด้งรีเฟรชให้อยู่แล้ว ถ้าอยากบังคับรีโหลดก็ใช้ location.reload();
  } catch(err){
    console.error(err);
    alert("อัปโหลดไม่สำเร็จ");
  }
});