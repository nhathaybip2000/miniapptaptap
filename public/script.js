    // Game state
    let gameState = {
        coins: 0,
        energy: 100,
        maxEnergy: 200,
        tapPower: 1,
        tapLevel: 1,
        energyLevel: 1,
        userLevel: 1,
        username: 'Player',
        totalEarned: 0,
        referralCode: 'XU123456',
        friends: []
      };
  
      // DOM elements
      const authSection = document.getElementById('auth-section');
      const mainApp = document.getElementById('main-app');
      const coinCountEl = document.getElementById('coin-count');
      const energyFillEl = document.getElementById('energy-fill');
      const energyTextEl = document.getElementById('energy-text');
      const miningPet = document.getElementById('mining-pet');
      const tapFeedback = document.getElementById('tap-feedback');
      const toast = document.getElementById('toast');
  
      // Initialize app
      document.addEventListener('DOMContentLoaded', function() {
        initializeApp();
        setupEventListeners();
        updateUI();
      });
  
      function initializeApp() {
        // Check if user is logged in (simplified)
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
          const userData = JSON.parse(savedUser);
          gameState.username = userData.username;
          showMainApp();
        }
      }
  
      function setupEventListeners() {
        // Auth form listeners
        document.getElementById('login-form-data').addEventListener('submit', handleLogin);
        document.getElementById('register-form-data').addEventListener('submit', handleRegister);
        
        // Tab switching
        document.querySelectorAll('.tab-button').forEach(btn => {
          btn.addEventListener('click', switchAuthTab);
        });
        
        document.querySelectorAll('.content-tab, .nav-item').forEach(btn => {
          btn.addEventListener('click', switchMainTab);
        });
        
        document.querySelectorAll('.account-tab').forEach(btn => {
          btn.addEventListener('click', switchAccountTab);
        });
  
        // Password toggle
        document.querySelectorAll('.password-toggle').forEach(btn => {
          btn.addEventListener('click', togglePassword);
        });
  
        // Mining pet tap
        miningPet.addEventListener('click', handleTap);
        
        // Upgrade buttons
        document.getElementById('upgrade-tap').addEventListener('click', upgradeTapPower);
        document.getElementById('upgrade-energy').addEventListener('click', upgradeEnergy);
        
        // Copy referral code
        document.getElementById('copy-referral').addEventListener('click', copyReferralCode);
        
        // Withdraw form
        document.getElementById('withdraw-form').addEventListener('submit', handleWithdraw);
        document.getElementById('withdraw-amount').addEventListener('input', updateWithdrawPreview);
        
        // Logout
        document.getElementById('logout-btn').addEventListener('click', handleLogout);
        
        // Modal close
        document.querySelectorAll('.close-modal').forEach(btn => {
          btn.addEventListener('click', closeModal);
        });
      }
  
      function handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        // Simplified login - in real app, this would make API call
        if (email && password) {
          const userData = { username: email.split('@')[0] || email };
          localStorage.setItem('currentUser', JSON.stringify(userData));
          gameState.username = userData.username;
          showNotification('Đăng nhập thành công!', 'success');
          setTimeout(showMainApp, 1000);
        } else {
          showNotification('Vui lòng nhập đầy đủ thông tin!', 'error');
        }
      }
  
      function handleRegister(e) {
        e.preventDefault();
        const username = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm').value;
        
        if (password !== confirmPassword) {
          showNotification('Mật khẩu xác nhận không khớp!', 'error');
          return;
        }
        
        // Simplified registration
        const userData = { username, email };
        localStorage.setItem('currentUser', JSON.stringify(userData));
        gameState.username = username;
        showNotification('Đăng ký thành công!', 'success');
        setTimeout(showMainApp, 1000);
      }
  
      function showMainApp() {
        authSection.style.display = 'none';
        mainApp.style.display = 'block';
        document.getElementById('username-display').textContent = gameState.username;
        updateUI();
        startEnergyRegeneration();
      }
  
      function switchAuthTab(e) {
        const targetTab = e.target.dataset.tab;
        
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.form-section').forEach(section => section.classList.remove('active'));
        
        e.target.classList.add('active');
        document.getElementById(`${targetTab}-form`).classList.add('active');
      }
  
      function switchMainTab(e) {
        const targetTab = e.currentTarget.dataset.tab;
        
        document.querySelectorAll('.content-tab, .nav-item').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        document.querySelectorAll(`[data-tab="${targetTab}"]`).forEach(el => el.classList.add('active'));
        document.getElementById(`tab-${targetTab}`).classList.add('active');
      }
  
      function switchAccountTab(e) {
        const targetTab = e.currentTarget.dataset.tab;
        
        document.querySelectorAll('.account-tab').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.account-tab-content').forEach(content => content.classList.remove('active'));
        
        e.currentTarget.classList.add('active');
        document.getElementById(`${targetTab}-content`).classList.add('active');
      }
  
      function togglePassword(e) {
        const targetId = e.target.dataset.target;
        const input = document.getElementById(targetId);
        const icon = e.target;
        
        if (input.type === 'password') {
          input.type = 'text';
          icon.classList.remove('fa-eye-slash');
          icon.classList.add('fa-eye');
        } else {
          input.type = 'password';
          icon.classList.remove('fa-eye');
          icon.classList.add('fa-eye-slash');
        }
      }
  
      function handleTap(e) {
        if (gameState.energy <= 0) {
          showToast('Không đủ năng lượng!');
          return;
        }
        
        gameState.coins += gameState.tapPower;
        gameState.energy = Math.max(0, gameState.energy - 1);
        gameState.totalEarned += gameState.tapPower;
        
        // Show tap feedback
        showTapFeedback(e);
        
        // Pet animation
        miningPet.style.transform = 'scale(0.95)';
        setTimeout(() => {
          miningPet.style.transform = 'scale(1)';
        }, 100);
        
        updateUI();
      }
  
      function showTapFeedback(e) {
        const rect = miningPet.getBoundingClientRect();
        tapFeedback.textContent = `+${gameState.tapPower}`;
        tapFeedback.style.opacity = '1';
        tapFeedback.style.transform = 'translate(-50%, -60%)';
        
        setTimeout(() => {
          tapFeedback.style.opacity = '0';
          tapFeedback.style.transform = 'translate(-50%, -50%)';
        }, 800);
      }
  
      function upgradeTapPower() {
        const cost = gameState.tapLevel * 100;
        if (gameState.coins >= cost) {
          gameState.coins -= cost;
          gameState.tapLevel++;
          gameState.tapPower++;
          updateUI();
          showToast('Nâng cấp sức mạnh thành công!');
        } else {
          showToast('Không đủ xu để nâng cấp!');
        }
      }
  
      function upgradeEnergy() {
        const cost = gameState.energyLevel * 150;
        if (gameState.coins >= cost) {
          gameState.coins -= cost;
          gameState.energyLevel++;
          gameState.maxEnergy += 50;
          gameState.energy = gameState.maxEnergy;
          updateUI();
          showToast('Nâng cấp năng lượng thành công!');
        } else {
          showToast('Không đủ xu để nâng cấp!');
        }
      }
  
      function copyReferralCode() {
        navigator.clipboard.writeText(gameState.referralCode).then(() => {
          showToast('Đã copy mã giới thiệu!');
        });
      }
  
      function handleWithdraw(e) {
        e.preventDefault();
        const amount = parseInt(document.getElementById('withdraw-amount').value);
        
        if (amount < 1000) {
          showToast('Số xu rút tối thiểu là 1,000!');
          return;
        }
        
        if (amount > gameState.coins) {
          showToast('Không đủ xu để rút!');
          return;
        }
        
        gameState.coins -= amount;
        updateUI();
        document.getElementById('withdraw-modal').style.display = 'flex';
        showToast('Yêu cầu rút tiền thành công!');
      }
  
      function updateWithdrawPreview() {
        const amount = parseInt(document.getElementById('withdraw-amount').value) || 0;
        const vndValue = (amount * 10 * 0.95); // 10 VND per coin, 5% fee
        document.getElementById('withdraw-value').textContent = vndValue.toLocaleString();
      }
  
      function handleLogout() {
        localStorage.removeItem('currentUser');
        location.reload();
      }
  
      function closeModal() {
        document.querySelectorAll('.modal').forEach(modal => {
          modal.style.display = 'none';
        });
      }
  
      function startEnergyRegeneration() {
        setInterval(() => {
          if (gameState.energy < gameState.maxEnergy) {
            gameState.energy = Math.min(gameState.maxEnergy, gameState.energy + 1);
            updateUI();
          }
        }, 10000); // Regenerate 1 energy per 10 seconds
      }
  
      function updateUI() {
        // Update coin count
        if (coinCountEl) coinCountEl.textContent = gameState.coins.toLocaleString();
        
        // Update energy
        if (energyFillEl) {
          const energyPercentage = (gameState.energy / gameState.maxEnergy) * 100;
          energyFillEl.style.width = `${energyPercentage}%`;
        }
        if (energyTextEl) {
          energyTextEl.textContent = `${gameState.energy}/${gameState.maxEnergy}`;
        }
        
        // Update tap power
        const tapPowerEl = document.getElementById('tap-power');
        if (tapPowerEl) tapPowerEl.textContent = gameState.tapPower;
        
        // Update levels and costs
        const tapLevelEl = document.getElementById('tap-level');
        if (tapLevelEl) tapLevelEl.textContent = gameState.tapLevel;
        
        const tapCostEl = document.getElementById('tap-cost');
        if (tapCostEl) tapCostEl.textContent = gameState.tapLevel * 100;
        
        const energyLevelEl = document.getElementById('energy-level');
        if (energyLevelEl) energyLevelEl.textContent = gameState.energyLevel;
        
        const energyCostEl = document.getElementById('energy-cost');
        if (energyCostEl) energyCostEl.textContent = gameState.energyLevel * 150;
        
        const energyMaxEl = document.getElementById('energy-max');
        if (energyMaxEl) energyMaxEl.textContent = gameState.maxEnergy;
        
        // Update account info
        const accountBalanceEl = document.getElementById('account-balance');
        if (accountBalanceEl) accountBalanceEl.textContent = `${gameState.coins.toLocaleString()} 💰`;
        
        const totalEarnedEl = document.getElementById('total-earned');
        if (totalEarnedEl) totalEarnedEl.textContent = `${gameState.totalEarned.toLocaleString()} 💰`;
      }
  
      function showNotification(message, type = 'info') {
        const notificationArea = document.getElementById('notification-area');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        notificationArea.appendChild(notification);
        
        setTimeout(() => {
          notification.remove();
        }, 3000);
      }
  
      function showToast(message) {
        toast.textContent = message;
        toast.classList.add('show');
        
        setTimeout(() => {
          toast.classList.remove('show');
        }, 2000);
      }