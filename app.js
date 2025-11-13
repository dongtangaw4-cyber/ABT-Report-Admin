 // ---------- Firebase v10 (modular) ----------
  import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
  import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
  import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

  const firebaseConfig = {
    apiKey: "AIzaSyDR8hVqZ1uDrjRMjK6u_rWO6c7Cs5-vDXw",
    authDomain: "abt-report.firebaseapp.com",
    projectId: "abt-report",
    // storageBucket ไม่ได้ใช้ก็ข้ามได้ แต่ถ้าจะใส่ แนะนำรูปแบบปกติ: "abt-report.appspot.com"
    storageBucket: "abt-report.appspot.com",
    messagingSenderId: "166748459797",
    appId: "1:166748459797:web:0cf5693e43a551142a8f1c"
  };

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db   = getFirestore(app);
  await signInAnonymously(auth);

  // ---------- Cloudinary (ของคุณ) ----------
  const CLOUD_NAME    = 'dm7cggzov';
  const UPLOAD_PRESET = 'abt-report-imge'; // ต้องตรงกับ preset แบบ Unsigned ที่สร้างไว้

  async function uploadToCloudinary(file) {
    const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
    const fd  = new FormData();
    fd.append('file', file);
    fd.append('upload_preset', UPLOAD_PRESET);
    // fd.append('folder', 'abt-report'); // อยากจัดโฟลเดอร์ เพิ่มได้

    const res = await fetch(url, { method: 'POST', body: fd });
    const data = await res.json();
    if (!res.ok || !data.secure_url) {
      throw new Error(data.error?.message || 'อัปโหลดรูปไม่สำเร็จ');
    }
    return data.secure_url; // ลิงก์ https พร้อมใช้งาน
  }

  // ---------- DOM ----------
  const form       = document.getElementById('reportForm');
  const resEl      = document.getElementById('result');        // <p id="result">
  const btnLocate  = document.getElementById('btnLocate');
  const latInput   = document.getElementById('lat');
  const lngInput   = document.getElementById('lng');
  const photoInput = document.getElementById('photo');
  const previewImg = document.getElementById('preview');
  const submitBtn  = form.querySelector('button[type="submit"]');

  // พรีวิวรูป
  let objectUrl;
  photoInput.addEventListener('change', () => {
    const f = photoInput.files?.[0];
    previewImg.style.display = 'none';
    previewImg.removeAttribute('src');
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      alert('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
      photoInput.value = '';
      return;
    }
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = URL.createObjectURL(f);
    previewImg.src = objectUrl;
    previewImg.style.display = 'block';
  });

  // ระบุตำแหน่งอัตโนมัติ
  btnLocate.addEventListener('click', () => {
    if (!navigator.geolocation) return alert('อุปกรณ์ไม่รองรับการระบุตำแหน่ง');
    resEl.textContent = 'กำลังขอตำแหน่ง...';
    navigator.geolocation.getCurrentPosition(
	
	
      pos => {
        latInput.value = pos.coords.latitude.toFixed(6);
        lngInput.value = pos.coords.longitude.toFixed(6);
        resEl.textContent = '';
      },
      () => { resEl.textContent = ''; alert('ไม่สามารถขอตำแหน่งได้'); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });

  // ส่งฟอร์ม: อัปโหลดรูป -> บันทึก Firestore
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    resEl.textContent = 'กำลังส่ง...';
    submitBtn.disabled = true;

    try {
      // บังคับต้องมีรูป
      const file = photoInput.files?.[0];
      if (!file) throw new Error('กรุณาแนบรูปภาพก่อนส่งเรื่อง');

      // อัปโหลดรูปไป Cloudinary
      const photoUrl = await uploadToCloudinary(file);

      // เก็บข้อมูลลง Firestore
      const fd = new FormData(form);
      const data = Object.fromEntries(fd.entries());

      await addDoc(collection(db, 'reports'), {
        name: data.name || '',
        address: data.address || '',
        phone: data.phone || '',
        category: data.category || '',
        detail: data.detail || '',
        lat: data.lat || '',
        lng: data.lng || '',
        photo: photoUrl,                 // << สำคัญ: URL รูป
        status: 'รับเรื่องแล้ว',
        createdAt: serverTimestamp()
      });

      resEl.textContent = '✅ ส่งข้อมูลสำเร็จแล้ว!';
      form.reset();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      previewImg.style.display = 'none';
      previewImg.removeAttribute('src');
    } catch (err) {
      resEl.textContent = '❌ เกิดข้อผิดพลาด: ' + err.message;
    } finally {
      submitBtn.disabled = false;
    }
  });