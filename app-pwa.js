// ลงทะเบียน Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js');
  });
}

// จัดการ “ติดตั้งเป็นแอป”
let deferredPrompt;
const installBtnId = 'btnInstall';

// สร้างปุ่มติดตั้งอัตโนมัติถ้ายังไม่มี
(function ensureInstallBtn(){
  if (document.getElementById(installBtnId)) return;
  const b = document.createElement('button');
  b.id = installBtnId;
  b.textContent = 'ติดตั้งเป็นแอป';
  b.style.cssText = 'position:fixed;right:12px;bottom:12px;padding:10px 14px;background:#0ea5e9;color:#fff;border:0;border-radius:10px;box-shadow:0 4px 14px rgba(0,0,0,.15);z-index:9999';
  b.hidden = true;
  document.body.appendChild(b);
})();

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  const btn = document.getElementById(installBtnId);
  if (btn) btn.hidden = false;

  btn?.addEventListener('click', async () => {
    btn.hidden = true;
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    // console.log('Install choice:', outcome);
  }, { once: true });
});

// ซ่อนปุ่มเมื่อติดตั้งแล้ว
window.addEventListener('appinstalled', () => {
  const btn = document.getElementById(installBtnId);
  if (btn) btn.hidden = true;
});