// Khởi tạo Supabase client
const supabaseUrl = 'https://mujmuntmnplkwmsjbfig.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11am11bnRtbnBsa3dtc2piZmlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3MDk4NTUsImV4cCI6MjA2MzI4NTg1NX0.ve7SYqOoyavg1hVvAGsnoO3O6eKqv66hbQ1pu1qcUpI';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

// Biến toàn cục
let currentUser = null;
let userData = {
  coins: 0,
  tapPower: 1,
  tapLevel: 1,
  energy: 100,
  energyMax: 200,
  level: 1,
  experience: 0,
  referralCode: '',
  invitedFriends: 0,
  referralBonus: 0
};
let energyTimer = null;
let autoTapInterval = null;

// DOM Elements
const authSection = document.getElementById('auth-section');
const mainApp = document.getElementById('main-app');
const loginForm = document.getElementById('login-form-data');
const registerForm = document.getElementById('register-form-data');
const logoutBtn = document.getElementById('logout-btn');
const notificationBell = document.getElementById('notification-bell');
const petContainer = document.getElementById('pet-container');
const tapFeedback = document.getElementById('tap-feedback');
const coinCount = document.getElementById('coin-count');
const tapPower = document.getElementById('tap-power');
const energyFill = document.getElementById('energy-fill');
const energyText = document.getElementById('energy-text');
const energyTimerElement = document.getElementById('energy-timer');
const upgradeTapBtn = document.getElementById('upgrade-tap');
const upgradeEnergyBtn = document.getElementById('upgrade-energy');
const quickWithdrawBtn = document.getElementById('quick-withdraw');
const withdrawForm = document.getElementById('withdraw-form');
const referralCodeInput = document.getElementById('referral-code');
const copyReferralBtn = document.getElementById('copy-referral');
const withdrawModal = document.getElementById('withdraw-modal');
const closeWithdrawModal = document.getElementById('close-withdraw-modal');
const toast = document.getElementById('toast');

// Hàm khởi tạo
document.addEventListener('DOMContentLoaded', () => {
  initEventListeners();
  checkSession();
});

// Khởi tạo event listeners
function initEventListeners() {
  // Auth forms
  loginForm.addEventListener('submit', handleLogin);
  registerForm.addEventListener('submit', handleRegister);
  logoutBtn.addEventListener('submit', handleLogout);
  
  // Tab switching
  document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', switchAuthTab);
  });
  
  document.querySelectorAll('.content-tab, .nav-item').forEach(tab => {
    tab.addEventListener('click', switchContentTab);
  });
  
  // Mining game
  petContainer.addEventListener('click', handleTap);
  upgradeTapBtn.addEventListener('click', () => upgradeStat('tap'));
  upgradeEnergyBtn.addEventListener('click', () => upgradeStat('energy'));
  
  // Referral
  copyReferralBtn.addEventListener('click', copyReferralCode);
  
  // Withdraw
  quickWithdrawBtn.addEventListener('click', () => {
    document.querySelector('.account-tab[data-tab="withdraw"]').click();
  });
  
  withdrawForm.addEventListener('submit', handleWithdraw);
  
  // Modal
  closeWithdrawModal.addEventListener('click', () => {
    withdrawModal.classList.remove('active');
  });
  
  // Password toggle
  document.querySelectorAll('.password-toggle').forEach(toggle => {
    toggle.addEventListener('click', togglePasswordVisibility);
  });
  
  // Calculate withdraw value
  document.getElementById('withdraw-amount').addEventListener('input', calculateWithdrawValue);
}

// Kiểm tra session khi tải trang
async function checkSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (session) {
    currentUser = session.user;
    await loadUserData();
    showMainApp();
  } else {
    showAuthSection();
  }
}

// Xử lý đăng nhập
async function handleLogin(e) {
  e.preventDefault();
  
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  
  showLoading(loginForm);
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  hideLoading(loginForm);
  
  if (error) {
    showNotification('error', error.message);
    return;
  }
  
  currentUser = data.user;
  await loadUserData();
  showMainApp();
  showNotification('success', 'Đăng nhập thành công!');
}

// Xử lý đăng ký
async function handleRegister(e) {
  e.preventDefault();
  
  const username = document.getElementById('register-username').value;
  const email = document.getElementById('register-email').value;
  const password = document.getElementById('register-password').value;
  const confirmPassword = document.getElementById('register-confirm').value;
  const referralCode = document.getElementById('register-referral').value;
  
  if (password !== confirmPassword) {
    showNotification('error', 'Mật khẩu không khớp!');
    return;
  }
  
  showLoading(registerForm);
  
  // Đăng ký user với Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password
  });
  
  if (authError) {
    hideLoading(registerForm);
    showNotification('error', authError.message);
    return;
  }
  
  // Tạo user profile trong database
  const referralCodeGenerated = generateReferralCode();
  
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .insert([{
      id: authData.user.id,
      username,
      referral_code: referralCodeGenerated,
      referred_by: referralCode || null
    }])
    .select();
  
  hideLoading(registerForm);
  
  if (profileError) {
    showNotification('error', profileError.message);
    return;
  }
  
  // Nếu có mã giới thiệu, cập nhật thông tin người giới thiệu
  if (referralCode) {
    await handleReferral(referralCode, authData.user.id);
  }
  
  showNotification('success', 'Đăng ký thành công! Vui lòng kiểm tra email để xác thực.');
  document.querySelector('.tab-button[data-tab="login"]').click();
  registerForm.reset();
}

// Xử lý đăng xuất
async function handleLogout() {
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    showNotification('error', error.message);
    return;
  }
  
  currentUser = null;
  userData = {
    coins: 0,
    tapPower: 1,
    tapLevel: 1,
    energy: 100,
    energyMax: 200,
    level: 1,
    experience: 0,
    referralCode: '',
    invitedFriends: 0,
    referralBonus: 0
  };
  
  clearInterval(energyTimer);
  clearInterval(autoTapInterval);
  
  showAuthSection();
  showNotification('success', 'Đăng xuất thành công!');
}

// Tải dữ liệu người dùng
async function loadUserData() {
  // Lấy thông tin profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', currentUser.id)
    .single();
  
  if (profileError) {
    showNotification('error', profileError.message);
    return;
  }
  
  // Lấy thông tin game data
  const { data: gameData, error: gameError } = await supabase
    .from('user_game_data')
    .select('*')
    .eq('user_id', currentUser.id)
    .single();
  
  if (gameError && !gameError.message.includes('No rows found')) {
    showNotification('error', gameError.message);
    return;
  }
  
  // Cập nhật userData
  if (gameData) {
    userData = {
      coins: gameData.coins || 0,
      tapPower: gameData.tap_power || 1,
      tapLevel: gameData.tap_level || 1,
      energy: gameData.energy || 100,
      energyMax: gameData.energy_max || 200,
      level: gameData.level || 1,
      experience: gameData.experience || 0,
      referralCode: profile.referral_code,
      invitedFriends: profile.invited_friends || 0,
      referralBonus: profile.referral_bonus || 0
    };
  } else {
    // Tạo dữ liệu game mới nếu chưa có
    userData.referralCode = profile.referral_code;
    await saveUserData();
  }
  
  // Cập nhật UI
  updateUI();
  
  // Bắt đầu energy timer
  startEnergyTimer();
  
  // Kiểm tra auto tap nếu đủ level
  if (userData.level >= 5) {
    startAutoTap();
  }
}

// Lưu dữ liệu người dùng
async function saveUserData() {
  const { data, error } = await supabase
    .from('user_game_data')
    .upsert({
      user_id: currentUser.id,
      coins: userData.coins,
      tap_power: userData.tapPower,
      tap_level: userData.tapLevel,
      energy: userData.energy,
      energy_max: userData.energyMax,
      level: userData.level,
      experience: userData.experience,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', currentUser.id);
  
  if (error) {
    console.error('Lỗi khi lưu dữ liệu:', error);
    return;
  }
  
  updateUI();
}

// Cập nhật giao diện
function updateUI() {
  // User info
  document.getElementById('username-display').textContent = currentUser.email;
  document.getElementById('user-level').textContent = userData.level;
  document.getElementById('user-avatar img').src = currentUser.user_metadata?.avatar_url || 'assets/default-avatar.png';
  
  // Mining tab
  document.getElementById('coin-count').textContent = userData.coins.toLocaleString();
  document.getElementById('tap-power').textContent = userData.tapPower;
  document.getElementById('tap-level').textContent = userData.tapLevel;
  document.getElementById('tap-bonus').textContent = userData.tapPower;
  document.getElementById('tap-cost').textContent = calculateUpgradeCost('tap');
  document.getElementById('energy-level').textContent = Math.floor(userData.energyMax / 100);
  document.getElementById('energy-max').textContent = userData.energyMax;
  document.getElementById('energy-cost').textContent = calculateUpgradeCost('energy');
  
  // Energy bar
  updateEnergyBar();
  
  // Account tab
  document.getElementById('account-balance').textContent = userData.coins.toLocaleString() + ' 💰';
  document.getElementById('account-level').textContent = userData.level;
  document.getElementById('total-earned').textContent = (userData.coins + 5000).toLocaleString() + ' 💰'; // Giả định
  
  // Referral tab
  document.getElementById('referral-code').value = userData.referralCode;
  document.getElementById('ref-count').textContent = userData.invitedFriends;
  document.getElementById('ref-bonus').textContent = userData.referralBonus;
  
  // Upgrade buttons
  document.getElementById('upgrade-tap').querySelector('.price').textContent = `${calculateUpgradeCost('tap')} 💰`;
  document.getElementById('upgrade-energy').querySelector('.price').textContent = `${calculateUpgradeCost('energy')} 💰`;
  
  // Auto tap unlock
  if (userData.level >= 5) {
    const autoTapCard = document.querySelector('.upgrade-card.disabled');
    if (autoTapCard) {
      autoTapCard.classList.remove('disabled');
      autoTapCard.querySelector('button').textContent = 'Mua Auto Tap';
      autoTapCard.querySelector('button').addEventListener('click', () => buyAutoTap());
    }
  }
}

// Xử lý tap vào pet
function handleTap(e) {
  if (userData.energy <= 0) {
    showNotification('warning', 'Bạn đã hết năng lượng! Vui lòng chờ hồi phục.');
    return;
  }
  
  // Giảm energy
  userData.energy -= 1;
  
  // Thêm coins
  const coinsEarned = userData.tapPower;
  userData.coins += coinsEarned;
  
  // Thêm experience
  userData.experience += 1;
  
  // Kiểm tra level up
  checkLevelUp();
  
  // Hiệu ứng tap
  createTapEffect(e);
  
  // Cập nhật UI
  updateEnergyBar();
  document.getElementById('coin-count').textContent = userData.coins.toLocaleString();
  
  // Lưu dữ liệu (debounce để tránh gọi quá nhiều)
  debounceSave();
}

// Tạo hiệu ứng khi tap
function createTapEffect(e) {
  const rect = petContainer.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  // Hiệu ứng tap
  const tapEffect = document.createElement('div');
  tapEffect.className = 'tap-effect';
  tapEffect.style.left = `${x}px`;
  tapEffect.style.top = `${y}px`;
  petContainer.appendChild(tapEffect);
  
  // Hiệu ứng coin
  const coin = document.createElement('div');
  coin.className = 'coin-burst';
  coin.textContent = `+${userData.tapPower}`;
  coin.style.left = `${x}px`;
  coin.style.top = `${y}px`;
  tapFeedback.appendChild(coin);
  
  // Xóa sau khi animation kết thúc
  setTimeout(() => {
    tapEffect.remove();
    coin.remove();
  }, 1000);
}

// Nâng cấp chỉ số
async function upgradeStat(stat) {
  let cost = 0;
  
  if (stat === 'tap') {
    cost = calculateUpgradeCost('tap');
    if (userData.coins < cost) {
      showNotification('error', 'Không đủ xu để nâng cấp!');
      return;
    }
    
    userData.coins -= cost;
    userData.tapLevel += 1;
    userData.tapPower = Math.floor(userData.tapLevel * 1.5);
  } 
  else if (stat === 'energy') {
    cost = calculateUpgradeCost('energy');
    if (userData.coins < cost) {
      showNotification('error', 'Không đủ xu để nâng cấp!');
      return;
    }
    
    userData.coins -= cost;
    userData.energyMax += 50;
    userData.energy = userData.energyMax; // Đầy năng lượng khi nâng cấp
  }
  
  // Lưu dữ liệu
  await saveUserData();
  showNotification('success', `Nâng cấp ${stat === 'tap' ? 'sức mạnh' : 'năng lượng'} thành công!`);
}

// Tính chi phí nâng cấp
function calculateUpgradeCost(stat) {
  if (stat === 'tap') {
    return Math.floor(100 * Math.pow(1.2, userData.tapLevel - 1));
  } 
  else if (stat === 'energy') {
    return Math.floor(150 * Math.pow(1.15, Math.floor(userData.energyMax / 100) - 1));
  }
  return 0;
}

// Kiểm tra level up
function checkLevelUp() {
  const expNeeded = userData.level * 100;
  
  if (userData.experience >= expNeeded) {
    userData.level += 1;
    userData.experience = 0;
    
    // Hiển thị thông báo level up
    showLevelUpNotification();
    
    // Mở khóa tính năng mới nếu đủ level
    if (userData.level === 5) {
      showNotification('info', 'Bạn đã mở khóa Auto Tap!');
      startAutoTap();
    }
  }
  
  // Cập nhật thanh progress
  const progressBar = document.querySelector('.progress-fill');
  const expNeededNext = userData.level * 100;
  const progressPercent = (userData.experience / expNeededNext) * 100;
  progressBar.style.width = `${progressPercent}%`;
  progressBar.nextElementSibling.textContent = `${Math.floor(progressPercent)}%`;
}

// Hiển thị thông báo level up
function showLevelUpNotification() {
  const notification = document.createElement('div');
  notification.className = 'notification info';
  notification.innerHTML = `
    <i class="fas fa-level-up-alt"></i>
    <span>Level Up! Bạn đã đạt level ${userData.level}</span>
  `;
  
  document.getElementById('notification-area').appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 5000);
}

// Bắt đầu auto tap
function startAutoTap() {
  if (autoTapInterval) clearInterval(autoTapInterval);
  
  autoTapInterval = setInterval(() => {
    if (userData.energy > 0) {
      // Tạo sự kiện tap giả
      const fakeEvent = {
        clientX: petContainer.offsetLeft + petContainer.offsetWidth / 2,
        clientY: petContainer.offsetTop + petContainer.offsetHeight / 2
      };
      
      handleTap(fakeEvent);
    }
  }, 1000); // Auto tap mỗi giây
}

// Mua auto tap
async function buyAutoTap() {
  const cost = 500;
  
  if (userData.coins < cost) {
    showNotification('error', 'Bạn cần 500 💰 để mua Auto Tap!');
    return;
  }
  
  userData.coins -= cost;
  await saveUserData();
  startAutoTap();
  
  showNotification('success', 'Bạn đã mua Auto Tap thành công!');
}

// Energy timer
function startEnergyTimer() {
  if (energyTimer) clearInterval(energyTimer);
  
  energyTimer = setInterval(() => {
    if (userData.energy < userData.energyMax) {
      userData.energy += 1;
      updateEnergyBar();
      
      // Lưu mỗi 10 energy hồi phục để giảm request
      if (userData.energy % 10 === 0) {
        debounceSave();
      }
    }
    
    // Cập nhật timer UI
    updateEnergyTimer();
  }, 3000); // Hồi phục 1 energy mỗi 3 giây
}

// Cập nhật thanh energy
function updateEnergyBar() {
  const percent = (userData.energy / userData.energyMax) * 100;
  energyFill.style.width = `${percent}%`;
  energyText.textContent = `${userData.energy}/${userData.energyMax}`;
}

// Cập nhật energy timer
function updateEnergyTimer() {
  if (userData.energy >= userData.energyMax) {
    energyTimerElement.style.display = 'none';
    return;
  }
  
  energyTimerElement.style.display = 'flex';
  const energyMissing = userData.energyMax - userData.energy;
  const seconds = energyMissing * 3; // Mỗi energy cần 3 giây
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  energyTimerElement.querySelector('span').textContent = 
    `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Xử lý referral
async function handleReferral(referralCode, newUserId) {
  // Tìm người giới thiệu
  const { data: referrer, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('referral_code', referralCode)
    .single();
  
  if (error || !referrer) {
    console.log('Mã giới thiệu không hợp lệ');
    return;
  }
  
  // Cập nhật thông tin người giới thiệu
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      invited_friends: (referrer.invited_friends || 0) + 1,
      referral_bonus: (referrer.referral_bonus || 0) + 100
    })
    .eq('id', referrer.id);
  
  if (updateError) {
    console.error('Lỗi khi cập nhật người giới thiệu:', updateError);
    return;
  }
  
  // Thêm bonus cho người mới nếu cần
  const { error: bonusError } = await supabase
    .from('user_game_data')
    .update({
      coins: 100
    })
    .eq('user_id', newUserId);
  
  if (bonusError) {
    console.error('Lỗi khi thêm bonus:', bonusError);
  }
}

// Copy referral code
function copyReferralCode() {
  referralCodeInput.select();
  document.execCommand('copy');
  
  showToast('Đã copy mã giới thiệu!');
}

// Xử lý rút tiền
async function handleWithdraw(e) {
  e.preventDefault();
  
  const bankName = document.getElementById('bank-name').value;
  const bankAccount = document.getElementById('bank-account').value;
  const accountName = document.getElementById('account-name').value;
  const amount = parseInt(document.getElementById('withdraw-amount').value);
  
  // Validate
  if (!bankName || !bankAccount || !accountName || !amount) {
    showNotification('error', 'Vui lòng điền đầy đủ thông tin!');
    return;
  }
  
  if (amount < 1000) {
    showNotification('error', 'Số xu tối thiểu để rút là 1,000!');
    return;
  }
  
  if (userData.coins < amount) {
    showNotification('error', 'Số dư không đủ để thực hiện giao dịch!');
    return;
  }
  
  showLoading(withdrawForm);
  
  // Tạo yêu cầu rút tiền
  const { data, error } = await supabase
    .from('withdrawals')
    .insert([{
      user_id: currentUser.id,
      bank_name: bankName,
      bank_account: bankAccount,
      account_name: accountName,
      amount: amount,
      status: 'pending'
    }])
    .select();
  
  hideLoading(withdrawForm);
  
  if (error) {
    showNotification('error', error.message);
    return;
  }
  
  // Trừ coins
  userData.coins -= amount;
  await saveUserData();
  
  // Hiển thị modal thành công
  withdrawModal.classList.add('active');
  withdrawForm.reset();
  
  // Thêm vào lịch sử
  addWithdrawalToHistory(data[0]);
}

// Thêm vào lịch sử rút tiền
function addWithdrawalToHistory(withdrawal) {
  const historyList = document.getElementById('withdraw-history');
  const emptyState = document.getElementById('empty-history');
  
  if (emptyState) emptyState.style.display = 'none';
  
  const withdrawalDate = new Date(withdrawal.created_at);
  const formattedDate = withdrawalDate.toLocaleDateString('vi-VN') + ' ' + withdrawalDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  
  const historyItem = document.createElement('div');
  historyItem.className = `history-item ${withdrawal.status}`;
  historyItem.innerHTML = `
    <div class="item-icon">
      <i class="fas fa-${withdrawal.status === 'success' ? 'check-circle' : withdrawal.status === 'pending' ? 'clock' : 'times-circle'}"></i>
    </div>
    <div class="item-details">
      <h4>-${withdrawal.amount.toLocaleString()} 💰</h4>
      <p>${withdrawal.bank_name} - ${withdrawal.bank_account.slice(0, 3)}****${withdrawal.bank_account.slice(-3)}</p>
      <small>${formattedDate}</small>
    </div>
    <div class="item-status ${withdrawal.status}">
      ${withdrawal.status === 'success' ? 'Thành công' : withdrawal.status === 'pending' ? 'Đang xử lý' : 'Thất bại'}
    </div>
  `;
  
  historyList.insertBefore(historyItem, historyList.firstChild);
}

// Tính toán giá trị rút tiền
function calculateWithdrawValue() {
  const amount = parseInt(document.getElementById('withdraw-amount').value) || 0;
  const fee = Math.floor(amount * 0.05); // Phí 5%
  const received = amount - fee;
  
  document.getElementById('withdraw-value').textContent = (received * 10).toLocaleString(); // Tỉ lệ 1:10
}

// Tạo mã giới thiệu
function generateReferralCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return 'XU' + result;
}

// Hiển thị auth section
function showAuthSection() {
  authSection.style.display = 'flex';
  mainApp.style.display = 'none';
}

// Hiển thị main app
function showMainApp() {
  authSection.style.display = 'none';
  mainApp.style.display = 'flex';
}

// Chuyển tab auth
function switchAuthTab(e) {
  const tab = e.target.dataset.tab;
  
  document.querySelectorAll('.tab-button').forEach(button => {
    button.classList.remove('active');
  });
  
  document.querySelectorAll('.form-section').forEach(section => {
    section.classList.remove('active');
  });
  
  e.target.classList.add('active');
  document.getElementById(`${tab}-form`).classList.add('active');
}

// Chuyển tab content
function switchContentTab(e) {
  const tab = e.currentTarget.dataset.tab;
  
  document.querySelectorAll('.content-tab, .nav-item').forEach(button => {
    button.classList.remove('active');
  });
  
  document.querySelectorAll('.tab-content').forEach(section => {
    section.classList.remove('active');
  });
  
  e.currentTarget.classList.add('active');
  document.getElementById(`tab-${tab}`).classList.add('active');
  
  // Account subtabs
  if (tab === 'taikhoan') {
    document.querySelector('.account-tab[data-tab="withdraw"]').click();
  }
}

// Hiển thị loading
function showLoading(form) {
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';
}

// Ẩn loading
function hideLoading(form) {
  const button = form.querySelector('button[type="submit"]');
  button.disabled = false;
  
  if (form.id === 'login-form-data') {
    button.innerHTML = '<i class="fas fa-sign-in-alt"></i> Đăng Nhập';
  } else if (form.id === 'register-form-data') {
    button.innerHTML = '<i class="fas fa-user-plus"></i> Đăng Ký Tài Khoản';
  } else if (form.id === 'withdraw-form') {
    button.innerHTML = '<i class="fas fa-paper-plane"></i> Gửi yêu cầu rút tiền';
  }
}

// Hiển thị thông báo
function showNotification(type, message) {
  const notificationArea = document.getElementById('notification-area');
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  
  let icon = '';
  switch (type) {
    case 'success': icon = 'check-circle'; break;
    case 'error': icon = 'exclamation-circle'; break;
    case 'warning': icon = 'exclamation-triangle'; break;
    default: icon = 'info-circle';
  }
  
  notification.innerHTML = `
    <i class="fas fa-${icon}"></i>
    <span>${message}</span>
  `;
  
  notificationArea.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 5000);
}

// Hiển thị toast
function showToast(message, type = 'info') {
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// Toggle password visibility
function togglePasswordVisibility(e) {
  const targetId = e.target.dataset.target;
  const input = document.getElementById(targetId);
  const icon = e.target;
  
  if (input.type === 'password') {
    input.type = 'text';
    icon.classList.replace('fa-eye-slash', 'fa-eye');
  } else {
    input.type = 'password';
    icon.classList.replace('fa-eye', 'fa-eye-slash');
  }
}

// Debounce save để giảm số lần gọi API
let saveTimeout = null;
function debounceSave() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    saveUserData();
  }, 2000);
}

// Thêm realtime listener cho thông báo
function setupRealtimeListener() {
  const channel = supabase
    .channel('notifications')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${currentUser.id}`
      },
      (payload) => {
        // Hiển thị thông báo mới
        showNotification('info', payload.new.message);
        
        // Cập nhật badge
        const badge = document.querySelector('.notification-btn .badge');
        if (badge) {
          badge.textContent = parseInt(badge.textContent || '0') + 1;
        }
      }
    )
    .subscribe();
}

// Khởi tạo realtime listener khi đăng nhập
if (currentUser) {
  setupRealtimeListener();
}