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
      // Thưởng mời = ref_bonus của user hiện tại
      document.getElementById('ref-bonus').textContent = data.ref_bonus || 0;
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
          <span class="ref-coins">${friend.coin || 0} 💰</span>
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
      document.getElementById('account-coin').textContent = coin.toLocaleString();
      tapLevel = data.tap_level || 1;
      energyLevel = data.energy_level || 1;
      maxEnergy = energyLevels[energyLevel];
      lastTapAt = data.last_tap_at;
      updateUI();

      const inviteLink = `${user.id}`;
      document.getElementById('invite-link').value = inviteLink;

      loadReferrals(user.id);

      if (data.modal === 'no') {
        showReferralModal();
      }
           
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



// ===== Referral Modal =====
const modal = document.getElementById('referral-modal');
const refInput = document.getElementById('referral-input');
const confirmBtn = document.getElementById('referral-confirm');
const skipBtn = document.getElementById('referral-skip');

function showReferralModal() {
  modal.classList.add('show');
}

// 👉 Xác nhận mã mời
confirmBtn.addEventListener('click', () => {
  const refId = parseInt(refInput.value.trim());
  if (!refId || isNaN(refId) || refId === user.id) {
    alert('Vui lòng nhập ID hợp lệ (không phải chính bạn)');
    return;
  }

  fetch('/api/setRefBy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: user.id, ref_by: refId })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        // 👇 Cập nhật modal = yes luôn sau khi nhập thành công
        fetch('/api/setModal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: user.id })
        });

        alert('🎉 Nhập mã mời thành công!');
        modal.classList.remove('show');
        localStorage.setItem('referral_done', '1');
      } else {
        alert(data.error || 'Đã xảy ra lỗi.');
      }
    });
});

// 👉 Nhấn bỏ qua
skipBtn.addEventListener('click', () => {
  fetch('/api/setModal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: user.id })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        modal.classList.remove('show');
        localStorage.setItem('referral_done', '1');
      } else {
        alert('Không thể cập nhật trạng thái modal');
      }
    })
    .catch(() => alert('Lỗi khi gọi API setModal'));
});


document.querySelectorAll('.account-tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    // Bỏ active khỏi tất cả nút và nội dung
    document.querySelectorAll('.account-tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.account-content').forEach(c => c.classList.remove('active'));

    // Gán active
    btn.classList.add('active');
    document.getElementById(btn.dataset.target).classList.add('active');
  });
});

const accountCoinEl = document.getElementById('account-coin');
const withdrawForm = document.getElementById('withdraw-form');
const withdrawMessage = document.getElementById('withdraw-message');
const withdrawHistoryEl = document.getElementById('withdraw-history');

// 👇 Tải số dư người dùng
function updateAccountBalance() {
  document.getElementById('account-coin').textContent = coin.toLocaleString();
}


// 👇 Gửi yêu cầu rút tiền
withdrawForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const bankAccount = document.getElementById('bank-account').value.trim();
  const receiverName = document.getElementById('receiver-name').value.trim();
  const bankName = document.getElementById('bank-name').value.trim();
  const amount = parseInt(document.getElementById('withdraw-amount').value.trim());

  if (!bankAccount || !receiverName || !bankName || isNaN(amount) || amount < 1000) {
    withdrawMessage.textContent = 'Vui lòng điền đầy đủ và đúng thông tin.';
    return;
  }

  if (coin < amount) {
    withdrawMessage.textContent = 'Không đủ xu để rút.';
    return;
  }

  fetch('/api/withdraw', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: user.id,
      bank_account: bankAccount,
      receiver_name: receiverName,
      bank_name: bankName,
      amount
    })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        withdrawMessage.textContent = '✅ Yêu cầu rút đã được gửi!';
        coin -= amount;
        updateAccountBalance();
        withdrawForm.reset();
        loadWithdrawHistory();
      } else {
        withdrawMessage.textContent = data.error || 'Lỗi khi gửi yêu cầu.';
      }
    })
    .catch(() => {
      withdrawMessage.textContent = 'Đã xảy ra lỗi khi gửi yêu cầu.';
    });
});

// 👇 Tải lịch sử rút tiền
function loadWithdrawHistory() {
  withdrawHistoryEl.innerHTML = '<li>Đang tải...</li>';

  fetch('/api/getWithdrawHistory', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: user.id })
  })
    .then(res => res.json())
    .then(data => {
      withdrawHistoryEl.innerHTML = '';

      if (!data || data.length === 0) {
        withdrawHistoryEl.innerHTML = '<li>Chưa có giao dịch nào.</li>';
        return;
      }

      data.forEach(tx => {
        const li = document.createElement('li');
        li.classList.add(tx.status); // 'success', 'pending', 'failed'

        li.innerHTML = `
          <div class="withdraw-info">
            <span class="withdraw-amount">-${tx.amount.toLocaleString()} 💰</span>
            <span class="withdraw-status ${tx.status}">${tx.status === 'success' ? 'Thành công' : tx.status === 'pending' ? 'Đang xử lý' : 'Thất bại'}</span>
          </div>
          <div class="withdraw-details">
            ${tx.bank_name} - ${tx.bank_account}<br>
            ${tx.receiver_name}
          </div>
          <div class="withdraw-date">${formatDate(tx.created_at)}</div>
        `;

        withdrawHistoryEl.appendChild(li);
      });
    })
    .catch(() => {
      withdrawHistoryEl.innerHTML = '<li>Lỗi khi tải lịch sử.</li>';
    });
}

// 👉 Hàm định dạng ngày giờ
function formatDate(dateStr) {
  const date = new Date(dateStr);
  return `${date.getDate()}/${date.getMonth()+1}/${date.getFullYear()} - ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
}

// 👉 Khi trang tải xong
document.addEventListener('DOMContentLoaded', () => {
  updateAccountBalance();
  loadWithdrawHistory();
});
