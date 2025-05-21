
const tg = window.Telegram.WebApp;
tg.expand();

const user = tg.initDataUnsafe?.user;

let coin = 0;
let energy = 0;
let maxEnergy = 500;
let tapLevel = 1;
let energyLevel = 1;
const maxLevel = 7;

const coinCountEl = document.getElementById('coin-count');
const energyFillEl = document.querySelector('.fill');
const energyLabelEl = document.getElementById('energy-label');
const bigCoinEl = document.getElementById('big-coin');
const tapLevelEl = document.getElementById('tap-level');
const energyMaxEl = document.getElementById('energy-max');
const tapCostEl = document.getElementById('tap-cost');
const energyCostEl = document.getElementById('energy-cost');

// Giá nâng cấp mỗi cấp
const tapUpgradeCosts = [0, 100, 200, 400, 700, 1000, 1500, 2000];
const energyUpgradeCosts = [0, 100, 300, 600, 1000, 1500, 2100, 2800];
const energyLevels = [0, 500, 700, 900, 1100, 1300, 1500, 1700];

let lastTapAt = null;

// Tính năng hồi năng lượng
function calculateEnergy(lastTime) {
  if (!lastTime) return maxEnergy;
  const now = Date.now();
  const last = new Date(lastTime).getTime();
  const elapsed = now - last;
  return Math.min(maxEnergy, Math.floor(maxEnergy * (elapsed / (30 * 60 * 1000))));
}

// Cập nhật giao diện
function updateUI() {
  coinCountEl.textContent = coin;
  const percent = (energy / maxEnergy) * 100;
  energyFillEl.style.width = `${percent}%`;
  energyLabelEl.textContent = `${energy} / ${maxEnergy}`;

  tapLevelEl.textContent = tapLevel;
  energyMaxEl.textContent = maxEnergy;
  tapCostEl.textContent = tapUpgradeCosts[tapLevel + 1] || 'MAX';
  energyCostEl.textContent = energyUpgradeCosts[energyLevel + 1] || 'MAX';
}

// UI tạm thời khi tap liên tục
function updateUIWithPreview(previewTaps = 0) {
  const currentEnergy = Math.max(0, calculateEnergy(lastTapAt) - previewTaps);
  const currentCoin = coin + (previewTaps * tapLevel);
  coinCountEl.textContent = currentCoin;
  const percent = (currentEnergy / maxEnergy) * 100;
  energyFillEl.style.width = `${percent}%`;
  energyLabelEl.textContent = `${currentEnergy} / ${maxEnergy}`;
}

// Gọi server lấy user
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

// Xử lý tap
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

  // Hiệu ứng
  bigCoinEl.classList.add('shake');
  setTimeout(() => bigCoinEl.classList.remove('shake'), 300);

  const plusOne = document.createElement('div');
  plusOne.textContent = `+${tapLevel}`;
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
      body: JSON.stringify({ id: user.id, count: pendingTaps * tapLevel })
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

// Nâng cấp tap
document.getElementById('upgrade-tap').addEventListener('click', () => {
  if (tapLevel >= maxLevel) return alert('Đã đạt cấp tối đa!');
  const cost = tapUpgradeCosts[tapLevel + 1];
  if (coin < cost) return alert('Không đủ xu để nâng cấp.');
  coin -= cost;
  tapLevel++;
  updateUI();
});

// Nâng cấp năng lượng
document.getElementById('upgrade-energy').addEventListener('click', () => {
  if (energyLevel >= maxLevel) return alert('Đã đạt cấp tối đa!');
  const cost = energyUpgradeCosts[energyLevel + 1];
  if (coin < cost) return alert('Không đủ xu để nâng cấp.');
  coin -= cost;
  energyLevel++;
  maxEnergy = energyLevels[energyLevel];
  energy = calculateEnergy(lastTapAt);
  updateUI();
});

// Chuyển tab
document.querySelectorAll('nav.menu button').forEach(button => {
  button.addEventListener('click', () => {
    const targetTab = button.getAttribute('data-tab');
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.getElementById('tab-' + targetTab).classList.add('active');
  });
});
