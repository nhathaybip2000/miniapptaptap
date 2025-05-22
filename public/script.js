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

function calculateEnergy(lastTime) {
  if (!lastTime) return maxEnergy;
  const now = Date.now();
  const last = new Date(lastTime).getTime();
  const elapsed = now - last;
  return Math.min(maxEnergy, Math.floor(maxEnergy * (elapsed / (30 * 60 * 1000))));
}

function updateUI() {
  const currentEnergy = calculateEnergy(lastTapAt) - pendingTaps * tapLevel;
  energy = Math.max(0, currentEnergy);
  coinCountEl.textContent = coin;
  const percent = (energy / maxEnergy) * 100;
  energyFillEl.style.width = `${percent}%`;
  energyLabelEl.textContent = `${energy} / ${maxEnergy}`;
  tapLevelEl.textContent = tapLevel;
  energyMaxEl.textContent = maxEnergy;
  tapCostEl.textContent = tapUpgradeCosts[tapLevel + 1] || 'MAX';
  energyCostEl.textContent = energyUpgradeCosts[energyLevel + 1] || 'MAX';
}

function loadReferrals(userId) {
  fetch('/api/getReferrals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: userId })
  })
    .then(res => res.json())
    .then(data => {
      document.getElementById('ref-bonus').textContent = data.total_bonus || 0;
      document.getElementById('ref-count').textContent = data.list.length || 0;

      const listEl = document.getElementById('referrals');
      listEl.innerHTML = '';

      if (!data.list || data.list.length === 0) {
        listEl.innerHTML = '<li>Bạn chưa mời ai cả. Hãy chia sẻ link để nhận thưởng 💰</li>';
        return;
      }

      data.list.forEach(friend => {
        const li = document.createElement('li');
        li.innerHTML = `
          <span class="ref-name">${friend.first_name || 'Người dùng'}</span>
          <span class="ref-coins">+${friend.ref_bonus || 0} 💰</span>
        `;
        listEl.appendChild(li);
      });
    })
    .catch(err => console.error('Lỗi khi tải danh sách mời:', err));
}

// ====== Khởi tạo =======
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
      tapLevel = data.tap_level || 1;
      energyLevel = data.energy_level || 1;
      maxEnergy = energyLevels[energyLevel];
      lastTapAt = data.last_tap_at;
      updateUI();

      const inviteLink = `https://t.me/coinxutaptap_bot/miniApp?start=ref_${user.id}`;
      document.getElementById('invite-link').value = inviteLink;

      loadReferrals(user.id);
    })
    .catch(err => console.error('Lỗi khi lấy user:', err));

  setInterval(updateUI, 5000);
} else {
  document.getElementById('greeting').textContent = 'Không thể lấy thông tin người dùng.';
}

// ===== Tap Logic =====
let pendingTaps = 0;
let debounceTimeout = null;

bigCoinEl.addEventListener('click', () => {
  const availableEnergy = calculateEnergy(lastTapAt) - pendingTaps * tapLevel;

  if (availableEnergy < tapLevel) {
    tg.HapticFeedback.notificationOccurred('error');
    alert('Bạn đã hết năng lượng! Hãy đợi hồi năng lượng nhé.');
    return;
  }

  pendingTaps++;
  coin += tapLevel;
  updateUI();

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
      body: JSON.stringify({ id: user.id, tapCount: pendingTaps, tapLevel })
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
        } else {
          console.error('Lỗi dữ liệu trả về từ server:', data);
        }
      })
      .catch(err => console.error('Lỗi khi gửi tap:', err));

    pendingTaps = 0;
  }, 1000);
});

// ===== Nâng cấp Tap =====
document.getElementById('upgrade-tap').addEventListener('click', () => {
  if (tapLevel >= maxLevel) return alert('Đã đạt cấp tối đa!');
  const cost = tapUpgradeCosts[tapLevel + 1];
  if (coin < cost) return alert('Không đủ xu để nâng cấp.');

  fetch('/api/upgrade', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: user.id, tapLevel: tapLevel + 1 })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success && data.user) {
        const u = data.user;
        coin = u.coin;
        tapLevel = u.tap_level || 1;
        updateUI();
      } else {
        alert('Lỗi nâng cấp tap.');
      }
    });
});

// ===== Nâng cấp Năng Lượng =====
document.getElementById('upgrade-energy').addEventListener('click', () => {
  if (energyLevel >= maxLevel) return alert('Đã đạt cấp tối đa!');
  const cost = energyUpgradeCosts[energyLevel + 1];
  if (coin < cost) return alert('Không đủ xu để nâng cấp.');

  fetch('/api/upgrade', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: user.id, energyLevel: energyLevel + 1 })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success && data.user) {
        const u = data.user;
        coin = u.coin;
        energyLevel = u.energy_level || 1;
        maxEnergy = energyLevels[energyLevel];
        updateUI();
      } else {
        alert('Lỗi nâng cấp năng lượng.');
      }
    });
});

// ===== Copy Link mời bạn =====
document.getElementById('copy-link').addEventListener('click', () => {
  const link = document.getElementById('invite-link').value;

  if (navigator.clipboard) {
    navigator.clipboard.writeText(link)
      .then(() => alert('Đã sao chép link!'))
      .catch(() => alert('Không thể sao chép link.'));
  } else {
    const input = document.getElementById('invite-link');
    input.select();
    document.execCommand('copy');
    alert('Đã sao chép link!');
  }
});

// ===== Chuyển Tab =====
document.querySelectorAll('nav.menu button').forEach(button => {
  button.addEventListener('click', () => {
    const targetTab = button.getAttribute('data-tab');
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.getElementById('tab-' + targetTab).classList.add('active');
  });
});

// Hiển thị modal nhập mã mời nếu user chưa có ref_by và chưa bỏ qua
const refSkipped = localStorage.getItem('ref_skipped');
const storedRef = localStorage.getItem('ref_by');

if (!storedRef && !refSkipped && user) {
  document.getElementById('ref-modal').style.display = 'flex';
}

// Xử lý xác nhận mã mời
document.getElementById('submit-ref').addEventListener('click', () => {
  const refInput = parseInt(document.getElementById('ref-input').value);
  if (!refInput || refInput === user.id) {
    alert('ID không hợp lệ hoặc trùng với chính bạn!');
    return;
  }

  fetch('/api/setRef', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: user.id, ref_by: refInput })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        localStorage.setItem('ref_by', refInput);
        document.getElementById('ref-modal').style.display = 'none';
        alert('🎉 Lưu mã mời thành công!');
      } else {
        alert(data.message || '❌ Không thể lưu mã mời.');
      }
    })
    .catch(() => alert('⚠️ Lỗi kết nối server!'));
});

// Xử lý khi user bấm "Bỏ qua"
document.getElementById('skip-ref').addEventListener('click', () => {
  localStorage.setItem('ref_skipped', true);
  document.getElementById('ref-modal').style.display = 'none';
});
