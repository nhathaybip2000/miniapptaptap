const tg = window.Telegram.WebApp;
tg.expand();

const user = tg.initDataUnsafe?.user;

let coin = 0;
let energy = 0;
const maxEnergy = 500;
let lastTapAt = null;

const coinCountEl = document.getElementById('coin-count');
const energyFillEl = document.querySelector('.fill');
const energyLabelEl = document.querySelector('.label');
const bigCoinEl = document.getElementById('big-coin');

// 🔁 Tính lại năng lượng dựa trên thời gian
function calculateEnergy(lastTime) {
  if (!lastTime) return maxEnergy;
  const now = Date.now();
  const last = new Date(lastTime).getTime();
  const elapsed = now - last;
  return Math.min(maxEnergy, Math.floor(maxEnergy * (elapsed / (30 * 60 * 1000))));
}

// 🧠 Cập nhật UI thật
function updateUI() {
  coinCountEl.textContent = coin;
  const percent = (energy / maxEnergy) * 100;
  energyFillEl.style.width = `${percent}%`;
  energyLabelEl.textContent = `${energy} / ${maxEnergy}`;
}

// 👁 Cập nhật UI tạm thời khi đang tap liên tục
function updateUIWithPreview(previewTaps = 0) {
  const currentEnergy = Math.max(0, calculateEnergy(lastTapAt) - previewTaps);
  const currentCoin = coin + previewTaps;

  coinCountEl.textContent = currentCoin;
  const percent = (currentEnergy / maxEnergy) * 100;
  energyFillEl.style.width = `${percent}%`;
  energyLabelEl.textContent = `${currentEnergy} / ${maxEnergy}`;
}

// Lấy user từ server
if (user) {
  document.getElementById('greeting').innerHTML =
    `Xin chào <b>${user.first_name}</b> (ID: <span style="color: orange">${user.id}</span>) 👋`;

  fetch('/api/getUser', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: user.id,
      username: user.username,
      first_name: user.first_name
    })
  })
    .then(res => res.json())
    .then(data => {
      coin = data.coin;
      lastTapAt = data.last_tap_at;
      energy = calculateEnergy(lastTapAt);
      updateUI();
    })
    .catch(err => {
      console.error('Lỗi khi lấy user:', err);
    });
} else {
  document.getElementById('greeting').textContent = 'Không thể lấy thông tin người dùng.';
}

// Tap logic
let pendingTaps = 0;
let debounceTimeout = null;

bigCoinEl.addEventListener('click', () => {
  if (calculateEnergy(lastTapAt) <= pendingTaps) {
    tg.HapticFeedback.notificationOccurred('error');
    alert('Bạn đã hết năng lượng! Hãy đợi hồi năng lượng nhé.');
    return;
  }

  pendingTaps++;
  updateUIWithPreview(pendingTaps);

  // Rung và hiệu ứng
  bigCoinEl.classList.add('shake');
  setTimeout(() => bigCoinEl.classList.remove('shake'), 300);

  const plusOne = document.createElement('div');
  plusOne.textContent = '+1';
  plusOne.className = 'plus-one';
  plusOne.style.position = 'absolute';
  const rect = bigCoinEl.getBoundingClientRect();
  plusOne.style.left = rect.left + rect.width / 2 + 'px';
  plusOne.style.top = rect.top + 'px';
  document.body.appendChild(plusOne);
  setTimeout(() => plusOne.remove(), 1000);

  clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(() => {
    fetch('/api/tap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: user.id, count: pendingTaps })
    })
      .then(res => res.json())
      .then(data => {
        coin = data.coin;
        lastTapAt = data.last_tap_at;
        energy = calculateEnergy(lastTapAt);
        updateUI();
      })
      .catch(err => console.error('Lỗi khi gửi tap:', err));

    pendingTaps = 0;
  }, 1000);
});

// Chuyển tab
document.querySelectorAll('nav.menu button').forEach(button => {
  button.addEventListener('click', () => {
    const targetTab = button.getAttribute('data-tab');
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.getElementById('tab-' + targetTab).classList.add('active');
  });
});
