const tg = window.Telegram.WebApp;
tg.expand(); // Mở rộng giao diện

// Lấy thông tin người dùng Telegram
const user = tg.initDataUnsafe?.user;

if (user) {
  document.getElementById('greeting').innerHTML =
    `Xin chào <b>${user.first_name}</b> (ID: <span style="color: orange">${user.id}</span>) 👋`;
} else {
  document.getElementById('greeting').textContent =
    'Không thể lấy thông tin người dùng.';
}

// Biến lưu trạng thái xu và năng lượng
let coinCount = 24;
let energy = 482;
const maxEnergy = 500;

// DOM elements
const coinCountEl = document.getElementById('coin-count');
const energyFillEl = document.querySelector('.fill');
const energyLabelEl = document.querySelector('.label');
const bigCoinEl = document.getElementById('big-coin');

// Xử lý khi click vào thú
bigCoinEl.addEventListener('click', () => {
  if (energy > 0) {
    coinCount++;
    energy--;

    // Cập nhật UI
    coinCountEl.textContent = coinCount;
    const percent = (energy / maxEnergy) * 100;
    energyFillEl.style.width = `${percent}%`;
    energyLabelEl.textContent = `${energy} / ${maxEnergy}`;

    // Rung nhẹ hình coin
    bigCoinEl.classList.add('shake');
    setTimeout(() => bigCoinEl.classList.remove('shake'), 300);

    // Tạo hiệu ứng +1
    const plusOne = document.createElement('div');
    plusOne.textContent = '+1';
    plusOne.className = 'plus-one';
    plusOne.style.position = 'absolute';
    const rect = bigCoinEl.getBoundingClientRect();
    plusOne.style.left = rect.left + rect.width / 2 + 'px';
    plusOne.style.top = rect.top + 'px';
    document.body.appendChild(plusOne);

    setTimeout(() => plusOne.remove(), 1000);
  } else {
    tg.HapticFeedback.notificationOccurred('error');
    alert('Bạn đã hết năng lượng! Hãy đợi hồi năng lượng nhé.');
  }
});
