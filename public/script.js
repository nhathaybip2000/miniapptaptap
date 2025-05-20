const tg = window.Telegram.WebApp;
tg.expand();

const user = tg.initDataUnsafe?.user;

let coin = 0;
let energy = 0;
const maxEnergy = 500;

// DOM elements
const coinCountEl = document.getElementById('coin-count');
const energyFillEl = document.querySelector('.fill');
const energyLabelEl = document.querySelector('.label');
const bigCoinEl = document.getElementById('big-coin');

function updateUI() {
  coinCountEl.textContent = coin;
  const percent = (energy / maxEnergy) * 100;
  energyFillEl.style.width = `${percent}%`;
  energyLabelEl.textContent = `${energy} / ${maxEnergy}`;
}

if (user) {
  document.getElementById('greeting').innerHTML =
    `Xin chào <b>${user.first_name}</b> (ID: <span style="color: orange">${user.id}</span>) 👋`;

  // Gửi và lấy dữ liệu từ Supabase
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
      energy = data.energy;
      updateUI();
    })
    .catch(err => {
      console.error('Lỗi khi lấy thông tin user:', err);
    });
} else {
  document.getElementById('greeting').textContent = 'Không thể lấy thông tin người dùng.';
}

// Xử lý khi click vào thú
bigCoinEl.addEventListener('click', () => {
  if (energy <= 0) {
    tg.HapticFeedback.notificationOccurred('error');
    alert('Bạn đã hết năng lượng! Hãy đợi hồi năng lượng nhé.');
    return;
  }

  fetch('/api/tap', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: user.id })
  })
    .then(res => res.json())
    .then(data => {
      coin = data.coin;
      energy = data.energy;
      updateUI();

      // Rung nhẹ hình
      bigCoinEl.classList.add('shake');
      setTimeout(() => bigCoinEl.classList.remove('shake'), 300);

      // Hiệu ứng +1
      const plusOne = document.createElement('div');
      plusOne.textContent = '+1';
      plusOne.className = 'plus-one';
      plusOne.style.position = 'absolute';
      const rect = bigCoinEl.getBoundingClientRect();
      plusOne.style.left = rect.left + rect.width / 2 + 'px';
      plusOne.style.top = rect.top + 'px';
      document.body.appendChild(plusOne);
      setTimeout(() => plusOne.remove(), 1000);
    })
    .catch(err => {
      console.error('Lỗi khi Tap:', err);
    });
});
