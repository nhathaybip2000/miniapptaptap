// ===== SUPABASE CONFIGURATION =====

const SUPABASE_URL = 'https://mujmuntmnplkwmsjbfig.supabase.co'; // VD: https://your-project.supabase.co
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11am11bnRtbnBsa3dtc2piZmlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3MDk4NTUsImV4cCI6MjA2MzI4NTg1NX0.ve7SYqOoyavg1hVvAGsnoO3O6eKqv66hbQ1pu1qcUpI';


const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ===== GLOBAL VARIABLES =====
let currentUser = null;
let gameData = {
  coins: 0,
  energy: 500,
  maxEnergy: 500,
  tapLevel: 1,
  energyLevel: 1,
  referralBonus: 0,
  referralCount: 0,
  referrals: []
};

// ===== UTILITY FUNCTIONS =====
function showMessage(message, type = 'success') {
  const messageElement = document.getElementById(type === 'success' ? 'success-message' : 'error-message');
  const otherMessageElement = document.getElementById(type === 'success' ? 'error-message' : 'success-message');
  
  otherMessageElement.style.display = 'none';
  messageElement.textContent = message;
  messageElement.style.display = 'block';
  
  setTimeout(() => {
    messageElement.style.display = 'none';
  }, 5000);
}

function generateReferralCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// ===== AUTH FUNCTIONS =====
function switchTab(tab) {
  // Reset messages
  document.getElementById('success-message').style.display = 'none';
  document.getElementById('error-message').style.display = 'none';
  
  // Switch tab buttons
  document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
  document.querySelector(`[onclick="switchTab('${tab}')"]`).classList.add('active');
  
  // Switch forms
  document.querySelectorAll('.form-section').forEach(form => form.classList.remove('active'));
  document.getElementById(`${tab}-form`).classList.add('active');
}

function togglePassword(inputId, icon) {
  const input = document.getElementById(inputId);
  if (input.type === 'password') {
    input.type = 'text';
    icon.classList.remove('fa-eye');
    icon.classList.add('fa-eye-slash');
  } else {
    input.type = 'password';
    icon.classList.remove('fa-eye-slash');
    icon.classList.add('fa-eye');
  }
}

async function handleRegister(event) {
  event.preventDefault();
  
  const username = document.getElementById('register-username').value.trim();
  const email = document.getElementById('register-email').value.trim();
  const password = document.getElementById('register-password').value;
  const confirmPassword = document.getElementById('register-confirm').value;
  const referralCode = document.getElementById('register-referral').value.trim();
  
  // Validation
  if (password !== confirmPassword) {
    showMessage('Mật khẩu xác nhận không khớp!', 'error');
    return;
  }
  
  if (password.length < 6) {
    showMessage('Mật khẩu phải có ít nhất 6 ký tự!', 'error');
    return;
  }
  
  try {
    // Check if username exists
    const { data: existingUser } = await supabaseClient
      .from('users')
      .select('username')
      .eq('username', username)
      .single();
    
    if (existingUser) {
      showMessage('Tên đăng nhập đã tồn tại!', 'error');
      return;
    }
    
    // Create user account
    const { data: authData, error: authError } = await supabaseClient.auth.signUp({
      email: email,
      password: password
    });
    
    if (authError) {
      throw authError;
    }
    
    // Generate referral code for new user
    const userReferralCode = generateReferralCode();
    
    // Create user profile
    const userData = {
      id: authData.user.id,
      username: username,
      email: email,
      coins: 1000, // Starting coins
      energy: 500,
      max_energy: 500,
      tap_level: 1,
      energy_level: 1,
      referral_code: userReferralCode,
      referral_bonus: 0,
      referral_count: 0,
      referred_by: referralCode || null,
      created_at: new Date().toISOString()
    };
    
    const { error: insertError } = await supabaseClient
      .from('users')
      .insert([userData]);
    
    if (insertError) {
      throw insertError;
    }
    
    // If user was referred, update referrer's data
    if (referralCode) {
      await handleReferralBonus(referralCode, username);
    }
    
    showMessage('Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.', 'success');
    
    // Clear form
    document.getElementById('register-form').querySelector('form').reset();
    
  } catch (error) {
    console.error('Registration error:', error);
    showMessage(error.message || 'Có lỗi xảy ra khi đăng ký!', 'error');
  }
}

async function handleLogin(event) {
  event.preventDefault();
  
  const emailOrUsername = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  
  try {
    let email = emailOrUsername;
    
    // If input is not email format, get email from username
    if (!emailOrUsername.includes('@')) {
      const { data: userData } = await supabaseClient
        .from('users')
        .select('email')
        .eq('username', emailOrUsername)
        .single();
      
      if (!userData) {
        showMessage('Tên đăng nhập không tồn tại!', 'error');
        return;
      }
      
      email = userData.email;
    }
    
    // Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
      email: email,
      password: password
    });
    
    if (authError) {
      throw authError;
    }
    
    // Get user data
    const { data: userData, error: userError } = await supabaseClient
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();
    
    if (userError) {
      throw userError;
    }
    
    // Set current user and game data
    currentUser = userData;
    gameData = {
      coins: userData.coins || 0,
      energy: userData.energy || 500,
      maxEnergy: userData.max_energy || 500,
      tapLevel: userData.tap_level || 1,
      energyLevel: userData.energy_level || 1,
      referralBonus: userData.referral_bonus || 0,
      referralCount: userData.referral_count || 0,
      referrals: []
    };
    
    // Load referrals
    await loadReferrals();
    
    // Hide auth form and show main app
    document.querySelector('.auth-container').style.display = 'none';
    document.getElementById('main-app').style.display = 'block';
    
    // Initialize game UI
    initializeGame();
    
    showMessage('Đăng nhập thành công!', 'success');
    
  } catch (error) {
    console.error('Login error:', error);
    showMessage(error.message || 'Đăng nhập thất bại!', 'error');
  }
}

async function handleReferralBonus(referralCode, newUserName) {
  try {
    // Find referrer
    const { data: referrer } = await supabaseClient
      .from('users')
      .select('*')
      .eq('referral_code', referralCode)
      .single();
    
    if (referrer) {
      // Add bonus coins and increment referral count
      const newCoins = (referrer.coins || 0) + 1000; // 1000 coins bonus
      const newReferralCount = (referrer.referral_count || 0) + 1;
      const newReferralBonus = (referrer.referral_bonus || 0) + 1000;
      
      await supabaseClient
        .from('users')
        .update({
          coins: newCoins,
          referral_count: newReferralCount,
          referral_bonus: newReferralBonus
        })
        .eq('id', referrer.id);
      
      // Add to referrals list
      const { data: existingReferrals } = await supabaseClient
        .from('referrals')
        .select('*')
        .eq('referrer_id', referrer.id);
      
      await supabaseClient
        .from('referrals')
        .insert([{
          referrer_id: referrer.id,
          referred_username: newUserName,
          bonus_coins: 1000,
          created_at: new Date().toISOString()
        }]);
    }
  } catch (error) {
    console.error('Referral bonus error:', error);
  }
}

// ===== GAME FUNCTIONS =====
function initializeGame() {
  updateUI();
  setupEventListeners();
  
  // Set referral link
  document.getElementById('invite-link').value = `${window.location.origin}?ref=${currentUser.referral_code}`;
  
  // Start energy regeneration
  startEnergyRegeneration();
  
  // Check for referral code in URL
  checkReferralFromURL();
}

function updateUI() {
  // Update coin displays
  document.getElementById('coin-count').textContent = gameData.coins.toLocaleString();
  document.getElementById('account-coin').textContent = gameData.coins.toLocaleString();
  
  // Update energy
  document.getElementById('energy-label').textContent = `${gameData.energy} / ${gameData.maxEnergy}`;
  document.querySelector('.energy-bar .fill').style.width = `${(gameData.energy / gameData.maxEnergy) * 100}%`;
  
  // Update upgrade buttons
  document.getElementById('tap-level').textContent = gameData.tapLevel;
  document.getElementById('tap-cost').textContent = (gameData.tapLevel * 100).toLocaleString();
  document.getElementById('energy-max').textContent = gameData.maxEnergy;
  document.getElementById('energy-cost').textContent = (gameData.energyLevel * 100).toLocaleString();
  
  // Update referral info
  document.getElementById('ref-bonus').textContent = gameData.referralBonus.toLocaleString();
  document.getElementById('ref-count').textContent = gameData.referralCount;
}

function setupEventListeners() {
  // Coin tap
  document.getElementById('big-coin').addEventListener('click', handleCoinTap);
  
  // Upgrades
  document.getElementById('upgrade-tap').addEventListener('click', upgradeTap);
  document.getElementById('upgrade-energy').addEventListener('click', upgradeEnergy);
  
  // Tab navigation
  document.querySelectorAll('[data-tab]').forEach(button => {
    button.addEventListener('click', () => switchGameTab(button.dataset.tab));
  });
  
  // Account tabs
  document.querySelectorAll('.account-tab-btn').forEach(button => {
    button.addEventListener('click', () => switchAccountTab(button.dataset.target));
  });
  
  // Copy referral link
  document.getElementById('copy-link').addEventListener('click', copyReferralLink);
  
  // Withdraw form
  document.getElementById('withdraw-form').addEventListener('submit', handleWithdraw);
}

async function handleCoinTap() {
  if (gameData.energy <= 0) return;
  
  gameData.coins += gameData.tapLevel;
  gameData.energy -= 1;
  
  // Add visual effects
  const coin = document.getElementById('big-coin');
  coin.style.transform = 'scale(0.95)';
  setTimeout(() => {
    coin.style.transform = 'scale(1)';
  }, 100);
  
  // Create floating coin effect
  createFloatingCoin();
  
  updateUI();
  
  // Save to database every 10 taps
  if (gameData.coins % 10 === 0) {
    await saveGameData();
  }
}

function createFloatingCoin() {
  const floatingCoin = document.createElement('div');
  floatingCoin.textContent = `+${gameData.tapLevel}`;
  floatingCoin.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: #FFD700;
    font-weight: bold;
    font-size: 20px;
    pointer-events: none;
    z-index: 1000;
    animation: floatUp 1s ease-out forwards;
  `;
  
  document.body.appendChild(floatingCoin);
  
  setTimeout(() => {
    floatingCoin.remove();
  }, 1000);
}

async function upgradeTap() {
  const cost = gameData.tapLevel * 100;
  if (gameData.coins >= cost) {
    gameData.coins -= cost;
    gameData.tapLevel += 1;
    updateUI();
    await saveGameData();
  }
}

async function upgradeEnergy() {
  const cost = gameData.energyLevel * 100;
  if (gameData.coins >= cost) {
    gameData.coins -= cost;
    gameData.energyLevel += 1;
    gameData.maxEnergy += 100;
    gameData.energy = gameData.maxEnergy; // Refill energy
    updateUI();
    await saveGameData();
  }
}

function startEnergyRegeneration() {
  setInterval(() => {
    if (gameData.energy < gameData.maxEnergy) {
      gameData.energy += 1;
      updateUI();
    }
  }, 3000); // Regenerate 1 energy every 3 seconds
}

async function saveGameData() {
  if (!currentUser) return;
  
  try {
    await supabaseClient
      .from('users')
      .update({
        coins: gameData.coins,
        energy: gameData.energy,
        max_energy: gameData.maxEnergy,
        tap_level: gameData.tapLevel,
        energy_level: gameData.energyLevel,
        referral_bonus: gameData.referralBonus,
        referral_count: gameData.referralCount,
        updated_at: new Date().toISOString()
      })
      .eq('id', currentUser.id);
  } catch (error) {
    console.error('Save error:', error);
  }
}

async function loadReferrals() {
  if (!currentUser) return;
  
  try {
    const { data: referrals } = await supabaseClient
      .from('referrals')
      .select('*')
      .eq('referrer_id', currentUser.id)
      .order('created_at', { ascending: false });
    
    gameData.referrals = referrals || [];
    updateReferralsList();
  } catch (error) {
    console.error('Load referrals error:', error);
  }
}

function updateReferralsList() {
  const referralsList = document.getElementById('referrals');
  referralsList.innerHTML = '';
  
  if (gameData.referrals.length === 0) {
    referralsList.innerHTML = '<li>Chưa có bạn bè nào được mời</li>';
    return;
  }
  
  gameData.referrals.forEach(referral => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span class="ref-name">${referral.referred_username}</span>
      <span class="ref-coins">+${referral.bonus_coins} 💰</span>
    `;
    referralsList.appendChild(li);
  });
}

// ===== UI FUNCTIONS =====
function switchGameTab(tabName) {
  // Hide all tabs
  document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
  
  // Show selected tab
  document.getElementById(`tab-${tabName}`).classList.add('active');
  
  // Update menu buttons
  document.querySelectorAll('[data-tab]').forEach(btn => btn.classList.remove('active'));
  document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
}

function switchAccountTab(targetId) {
  // Update buttons
  document.querySelectorAll('.account-tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelector(`[data-target="${targetId}"]`).classList.add('active');
  
  // Update content
  document.querySelectorAll('.account-content').forEach(content => content.classList.remove('active'));
  document.getElementById(targetId).classList.add('active');
}

function copyReferralLink() {
  const link = document.getElementById('invite-link');
  link.select();
  link.setSelectionRange(0, 99999);
  document.execCommand('copy');
  
  const button = document.getElementById('copy-link');
  const originalText = button.textContent;
  button.textContent = 'Đã Copy!';
  setTimeout(() => {
    button.textContent = originalText;
  }, 2000);
}

async function handleWithdraw(event) {
  event.preventDefault();
  
  const bankAccount = document.getElementById('bank-account').value;
  const receiverName = document.getElementById('receiver-name').value;
  const bankName = document.getElementById('bank-name').value;
  const amount = parseInt(document.getElementById('withdraw-amount').value);
  
  const messageElement = document.getElementById('withdraw-message');
  
  if (amount < 1000) {
    messageElement.textContent = 'Số xu tối thiểu để rút là 1000!';
    messageElement.style.color = 'red';
    return;
  }
  
  if (amount > gameData.coins) {
    messageElement.textContent = 'Số xu không đủ!';
    messageElement.style.color = 'red';
    return;
  }
  
  try {
    // Save withdraw request
    await supabaseClient
      .from('withdraw_requests')
      .insert([{
        user_id: currentUser.id,
        username: currentUser.username,
        amount: amount,
        bank_account: bankAccount,
        receiver_name: receiverName,
        bank_name: bankName,
        status: 'pending',
        created_at: new Date().toISOString()
      }]);
    
    // Deduct coins
    gameData.coins -= amount;
    await saveGameData();
    updateUI();
    
    messageElement.textContent = 'Yêu cầu rút tiền đã được gửi! Chúng tôi sẽ xử lý trong 24-48 giờ.';
    messageElement.style.color = 'green';
    
    // Clear form
    document.getElementById('withdraw-form').reset();
    
  } catch (error) {
    console.error('Withdraw error:', error);
    messageElement.textContent = 'Có lỗi xảy ra! Vui lòng thử lại.';
    messageElement.style.color = 'red';
  }
}

function checkReferralFromURL() {
  const urlParams = new URLSearchParams(window.location.search);
  const refCode = urlParams.get('ref');
  if (refCode) {
    document.getElementById('register-referral').value = refCode;
    switchTab('register');
  }
}

// ===== ADD REQUIRED CSS FOR ANIMATIONS =====
const style = document.createElement('style');
style.textContent = `
  @keyframes floatUp {
    0% {
      opacity: 1;
      transform: translate(-50%, -50%) translateY(0);
    }
    100% {
      opacity: 0;
      transform: translate(-50%, -50%) translateY(-100px);
    }
  }
  
  #big-coin {
    transition: transform 0.1s ease;
    cursor: pointer;
  }
  
  .submit-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;
document.head.appendChild(style);

// ===== INITIALIZE APP =====
document.addEventListener('DOMContentLoaded', () => {
  // Check if user is already logged in
  supabaseClient.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session) {
      // User is logged in, load their data
      const { data: userData } = await supabaseClient
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      if (userData) {
        currentUser = userData;
        gameData = {
          coins: userData.coins || 0,
          energy: userData.energy || 500,
          maxEnergy: userData.max_energy || 500,
          tapLevel: userData.tap_level || 1,
          energyLevel: userData.energy_level || 1,
          referralBonus: userData.referral_bonus || 0,
          referralCount: userData.referral_count || 0,
          referrals: []
        };
        
        await loadReferrals();
        
        document.querySelector('.auth-container').style.display = 'none';
        document.getElementById('main-app').style.display = 'block';
        
        initializeGame();
      }
    }
  });
  
  // Check for referral code in URL
  checkReferralFromURL();
});

// ===== AUTO SAVE GAME DATA =====
setInterval(async () => {
  if (currentUser) {
    await saveGameData();
  }
}, 30000); // Auto save every 30 seconds