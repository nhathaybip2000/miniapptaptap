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

// 🔢 Tính lại năng lượng dựa trên thời gian
function calculateEnergy(lastTime) {
  if (!lastTime) return maxEnergy;
  const now = Date.now();
  const last = new Date(lastTime).getTime();
  const elapsed = now - last;
  return Math.min(maxEnergy, Math.floor(maxEnergy * (elapsed / (30 * 60 * 1000))));
}

function updateUI() {
  coinCountEl.textContent = coin;
  const percent = (energy / maxEnergy) * 100;
  energyFillEl.style.width = `${percent}%`;
  energyLabelEl.textContent = `${energy} / ${maxEnergy}`;
}

// 📦 Gửi thông tin user và lấy dữ liệu từ Supabase
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

      // 🔁 Cập nhật năng lượng theo thời gian thực mỗi 1 giây
      setInterval(() => {
        energy = calculateEnergy(lastTapAt);
        updateUI();
      }, 1000);
    })
    .catch(err => {
      console.error('Lỗi khi lấy user:', err);
    });
} else {
  document.getElementById('greeting').textContent = 'Không thể lấy thông tin người dùng.';
}

// 👆 Gộp nhiều lần Tap
let pendingTaps = 0;
let debounceTimeout = null;

bigCoinEl.addEventListener('click', () => {
  if (energy <= 0) {
    tg.HapticFeedback.notificationOccurred('error');
    alert('Bạn đã hết năng lượng! Hãy đợi hồi năng lượng nhé.');
    return;
  }

  coin++;
  energy--;
  pendingTaps++;
  updateUI();

  // Rung và hiệu ứng +1
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

  // ⏳ Gửi sau 1s (gộp Tap)
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
