// script.js - Phiên bản tối ưu hoá toàn diện
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

const tapUpgradeCosts = [0, 100, 200, 400, 700, 1000, 1500, 2000];
const energyUpgradeCosts = [0, 100, 300, 600, 1000, 1500, 2100, 2800];
const energyLevels = [0, 500, 700, 900, 1100, 1300, 1500, 1700];

let lastTapAt = null;
let pendingTaps = 0;
let debounceTimeout = null;

function calculateEnergy(lastTime) {
  if (!lastTime) return maxEnergy;
  const now = Date.now();
  const last = new Date(lastTime).getTime();
  const elapsed = now - last;
  return Math.min(maxEnergy, Math.floor(maxEnergy * (elapsed / (30 * 60 * 1000))));
}

function updateUI() {
  energy = calculateEnergy(lastTapAt);
  coinCountEl.textContent = coin;
  const percent = (energy / maxEnergy) * 100;
  energyFillEl.style.width = `${percent}%`;
  energyLabelEl.textContent = `${energy} / ${maxEnergy}`;
  tapLevelEl.textContent = tapLevel;
  energyMaxEl.textContent = maxEnergy;
  tapCostEl.textContent = tapUpgradeCosts[tapLevel + 1] || 'MAX';
  energyCostEl.textContent = energyUpgradeCosts[energyLevel + 1] || 'MAX';
}

function showPlusEffect(amount) {
  const plusOne = document.createElement('div');
  plusOne.textContent = `+${amount}`;
  plusOne.className = 'plus-one';
  plusOne.style.position = 'absolute';
  const rect = bigCoinEl.getBoundingClientRect();
  plusOne.style.left = rect.left + rect.width / 2 + 'px';
  plusOne.style.top = rect.top + 'px';
  document.body.appendChild(plusOne);
  setTimeout(() => plusOne.remove(), 1000);
}

if (user) {
  document.getElementById('greeting').innerHTML =
    `Xin chào <b>${user.first_name}</b> (ID: <span style="color: orange">${user.id}</span>) 👋`;

  fetch('/api/getUser', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: user.id, username: user.username, first_name: user.first_name })
  })
    .then(res => res.json())
    .then(data => {
      coin = data.coin;
      tapLevel = data.tap_level || 1;
      energyLevel = data.energy_level || 1;
      maxEnergy = energyLevels[energyLevel];
      lastTapAt = data.last_tap_at;
      updateUI();
    })
    .catch(err => console.error('Lỗi khi lấy user:', err));

} else {
  document.getElementById('greeting').textContent = 'Không thể lấy thông tin người dùng.';
}

bigCoinEl.addEventListener('click', () => {
  if (calculateEnergy(lastTapAt) <= pendingTaps) {
    tg.HapticFeedback.notificationOccurred('error');
    alert('Hết năng lượng!');
    return;
  }

  pendingTaps++;
  bigCoinEl.classList.add('shake');
  setTimeout(() => bigCoinEl.classList.remove('shake'), 300);
  showPlusEffect(tapLevel);

  clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(() => {
    fetch('/api/tap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: user.id, tapCount: pendingTaps })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.user) {
          const u = data.user;
          coin = u.coin;
          tapLevel = u.tap_level || 1;
          energyLevel = u.energy_level || 1;
          maxEnergy = energyLevels[energyLevel];
          lastTapAt = u.last_tap_at;
          updateUI();
        }
      })
      .catch(err => console.error('Lỗi khi gửi tap:', err));

    pendingTaps = 0;
  }, 1000);
});

// Nâng cấp Tap
const btnTap = document.getElementById('upgrade-tap');
btnTap.addEventListener('click', () => {
  if (tapLevel >= maxLevel) return alert('Tối đa level!');
  const cost = tapUpgradeCosts[tapLevel + 1];
  if (coin < cost) return alert('Không đủ xu');

  fetch('/api/upgrade', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: user.id, tapLevel: tapLevel + 1 })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success && data.user) {
        coin = data.user.coin;
        tapLevel = data.user.tap_level;
        updateUI();
      }
    });
});

// Nâng cấp Năng lượng
const btnEnergy = document.getElementById('upgrade-energy');
btnEnergy.addEventListener('click', () => {
  if (energyLevel >= maxLevel) return alert('Tối đa level!');
  const cost = energyUpgradeCosts[energyLevel + 1];
  if (coin < cost) return alert('Không đủ xu');

  fetch('/api/upgrade', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: user.id, energyLevel: energyLevel + 1 })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success && data.user) {
        coin = data.user.coin;
        energyLevel = data.user.energy_level;
        maxEnergy = energyLevels[energyLevel];
        lastTapAt = data.user.last_tap_at;
        updateUI();
      }
    });
});

// Auto update energy mỗi 5s
setInterval(() => {
  updateUI();
}, 5000);

// Tab navigation
const menuButtons = document.querySelectorAll('nav.menu button');
menuButtons.forEach(button => {
  button.addEventListener('click', () => {
    const targetTab = button.getAttribute('data-tab');
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.getElementById('tab-' + targetTab).classList.add('active');
  });
});
