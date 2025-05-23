// ============ TELEGRAM INTEGRATION ============
const tg = window.Telegram?.WebApp;
if (tg) {
  tg.expand();
  tg.ready();
}

const user = tg?.initDataUnsafe?.user;

// ============ GAME STATE ============
class GameState {
  constructor() {
    this.coin = 0;
    this.energy = 0;
    this.maxEnergy = 500;
    this.tapLevel = 1;
    this.energyLevel = 1;
    this.maxLevel = 7;
    this.lastTapAt = null;
    this.pendingTaps = 0;
    this.isLoading = false;
    
    // Constants
    this.tapUpgradeCosts = [0, 100, 200, 400, 700, 1000, 1500, 2000];
    this.energyUpgradeCosts = [0, 100, 300, 600, 1000, 1500, 2100, 2800];
    this.energyLevels = [0, 500, 700, 900, 1100, 1300, 1500, 1700];
    this.energyRegenRate = 30 * 60 * 1000; // 30 minutes to full
  }

  calculateEnergy(lastTime) {
    if (!lastTime) return this.maxEnergy;
    const now = Date.now();
    const last = new Date(lastTime).getTime();
    const elapsed = now - last;
    return Math.min(this.maxEnergy, Math.floor(this.maxEnergy * (elapsed / this.energyRegenRate)));
  }

  getCurrentEnergy() {
    return Math.max(0, this.calculateEnergy(this.lastTapAt) - this.pendingTaps * this.tapLevel);
  }

  canTap() {
    return this.getCurrentEnergy() >= this.tapLevel && !this.isLoading;
  }

  canUpgradeTap() {
    return this.tapLevel < this.maxLevel && 
           this.coin >= this.tapUpgradeCosts[this.tapLevel + 1] && 
           !this.isLoading;
  }

  canUpgradeEnergy() {
    return this.energyLevel < this.maxLevel && 
           this.coin >= this.energyUpgradeCosts[this.energyLevel + 1] && 
           !this.isLoading;
  }
}

// ============ DOM MANAGER ============
class DOMManager {
  constructor() {
    this.elements = this.cacheElements();
    this.setupEventListeners();
  }

  cacheElements() {
    return {
      // Main game elements
      coinCount: document.getElementById('coin-count'),
      energyFill: document.querySelector('.fill'),
      energyLabel: document.getElementById('energy-label'),
      bigCoin: document.getElementById('big-coin'), // Pet image
      greeting: document.getElementById('greeting'),
      
      // Upgrade elements
      tapLevel: document.getElementById('tap-level'),
      energyMax: document.getElementById('energy-max'),
      tapCost: document.getElementById('tap-cost'),
      energyCost: document.getElementById('energy-cost'),
      upgradeTap: document.getElementById('upgrade-tap'),
      upgradeEnergy: document.getElementById('upgrade-energy'),
      
      // Referral elements
      inviteLink: document.getElementById('invite-link'),
      copyLink: document.getElementById('copy-link'),
      refBonus: document.getElementById('ref-bonus'),
      refCount: document.getElementById('ref-count'),
      referralsList: document.getElementById('referrals'),
      
      // Modal elements
      modal: document.getElementById('referral-modal'),
      refInput: document.getElementById('referral-input'),
      confirmBtn: document.getElementById('referral-confirm'),
      skipBtn: document.getElementById('referral-skip')
    };
  }

  setupEventListeners() {
    // Tab navigation với data-tab chính xác
    document.querySelectorAll('nav.menu button').forEach(button => {
      button.addEventListener('click', this.handleTabClick.bind(this));
    });

    // Prevent double-tap zoom on mobile
    if (this.elements.bigCoin) {
      this.elements.bigCoin.addEventListener('touchstart', (e) => {
        e.preventDefault();
      }, { passive: false });
    }
  }

  handleTabClick(e) {
    const button = e.currentTarget;
    const targetTab = button.getAttribute('data-tab');
    if (!targetTab) return;

    // Remove active class from all tabs
    document.querySelectorAll('.tab').forEach(tab => 
      tab.classList.remove('active')
    );
    
    // Add active class to target tab với ID chính xác
    const targetElement = document.getElementById('tab-' + targetTab);
    if (targetElement) {
      targetElement.classList.add('active');
    }

    // Load referrals when switching to moibanbe tab
    if (targetTab === 'moibanbe' && user) {
      referralManager.loadReferrals(user.id);
    }
  }

  updateUI(gameState) {
    const currentEnergy = gameState.getCurrentEnergy();
    
    // Update coin count with animation
    if (this.elements.coinCount) {
      this.animateNumber(this.elements.coinCount, gameState.coin);
    }
    
    // Update energy bar
    if (this.elements.energyFill && this.elements.energyLabel) {
      const percent = Math.max(0, (currentEnergy / gameState.maxEnergy) * 100);
      this.elements.energyFill.style.width = `${percent}%`;
      this.elements.energyLabel.textContent = `${currentEnergy} / ${gameState.maxEnergy}`;
      
      // Add visual feedback for low energy
      this.elements.energyFill.classList.toggle('low-energy', percent < 20);
    }
    
    // Update upgrade info
    if (this.elements.tapLevel) this.elements.tapLevel.textContent = gameState.tapLevel;
    if (this.elements.energyMax) this.elements.energyMax.textContent = gameState.maxEnergy;
    
    // Update upgrade costs and button states
    this.updateUpgradeButtons(gameState);
  }

  updateUpgradeButtons(gameState) {
    // Tap upgrade
    if (this.elements.tapCost && this.elements.upgradeTap) {
      const tapCost = gameState.tapUpgradeCosts[gameState.tapLevel + 1];
      this.elements.tapCost.textContent = tapCost || 'MAX';
      this.elements.upgradeTap.disabled = !gameState.canUpgradeTap();
      this.elements.upgradeTap.classList.toggle('disabled', !gameState.canUpgradeTap());
    }
    
    // Energy upgrade
    if (this.elements.energyCost && this.elements.upgradeEnergy) {
      const energyCost = gameState.energyUpgradeCosts[gameState.energyLevel + 1];
      this.elements.energyCost.textContent = energyCost || 'MAX';
      this.elements.upgradeEnergy.disabled = !gameState.canUpgradeEnergy();
      this.elements.upgradeEnergy.classList.toggle('disabled', !gameState.canUpgradeEnergy());
    }
  }

  animateNumber(element, targetValue) {
    const currentValue = parseInt(element.textContent) || 0;
    if (currentValue === targetValue) return;

    const duration = 300;
    const startTime = performance.now();
    const difference = targetValue - currentValue;

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const current = Math.round(currentValue + difference * easeOutQuart);
      
      element.textContent = current.toLocaleString();
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }

  showTapEffect(tapValue, event) {
    if (!this.elements.bigCoin) return;

    // Pet shake animation
    this.elements.bigCoin.classList.add('shake');
    setTimeout(() => this.elements.bigCoin.classList.remove('shake'), 300);

    // +coins floating effect
    const plusOne = document.createElement('div');
    plusOne.textContent = `+${tapValue}`;
    plusOne.className = 'plus-one';
    
    // Position based on click/touch location or center of pet
    const rect = this.elements.bigCoin.getBoundingClientRect();
    const x = event ? (event.clientX || event.touches?.[0]?.clientX) : (rect.left + rect.width / 2);
    const y = event ? (event.clientY || event.touches?.[0]?.clientY) : (rect.top + rect.height / 2);
    
    plusOne.style.cssText = `
      position: fixed;
      left: ${x}px;
      top: ${y}px;
      transform: translate(-50%, -50%);
      color: #ffd700;
      font-weight: bold;
      font-size: 20px;
      pointer-events: none;
      z-index: 1000;
      animation: floatUp 1s ease-out forwards;
    `;
    
    document.body.appendChild(plusOne);
    setTimeout(() => plusOne.remove(), 1000);
  }

  showNotification(message, type = 'info') {
    // Use alert as fallback but with better UX
    if (tg?.showAlert) {
      tg.showAlert(message);
    } else {
      // Create custom notification
      let notification = document.getElementById('game-notification');
      if (!notification) {
        notification = document.createElement('div');
        notification.id = 'game-notification';
        notification.style.cssText = `
          position: fixed;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          padding: 12px 24px;
          border-radius: 8px;
          color: white;
          font-weight: 500;
          z-index: 10000;
          transition: all 0.3s ease;
          opacity: 0;
          font-family: 'Fredoka', sans-serif;
        `;
        document.body.appendChild(notification);
      }

      // Set colors based on type
      const colors = {
        info: '#3498db',
        success: '#2ecc71',
        warning: '#f39c12',
        error: '#e74c3c'
      };

      notification.style.backgroundColor = colors[type] || colors.info;
      notification.textContent = message;
      notification.style.opacity = '1';

      // Auto hide after 3 seconds
      setTimeout(() => {
        notification.style.opacity = '0';
      }, 3000);
    }
  }
}

// ============ API MANAGER ============
class APIManager {
  constructor() {
    this.baseUrl = '';
    this.requestQueue = [];
    this.isProcessing = false;
  }

  async request(endpoint, data = {}) {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ endpoint, data, resolve, reject });
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.isProcessing || this.requestQueue.length === 0) return;
    
    this.isProcessing = true;
    
    while (this.requestQueue.length > 0) {
      const { endpoint, data, resolve, reject } = this.requestQueue.shift();
      
      try {
        const response = await fetch(`/api/${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        
        const result = await response.json();
        resolve(result);
      } catch (error) {
        console.error(`API Error (${endpoint}):`, error);
        reject(error);
      }
      
      // Small delay between requests to prevent overwhelming server
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    this.isProcessing = false;
  }

  // Specific API methods
  async getUser(userData) {
    return this.request('getUser', userData);
  }

  async tap(userId, tapCount, tapLevel) {
    return this.request('tap', { id: userId, tapCount, tapLevel });
  }

  async upgrade(userId, upgradeData) {
    return this.request('upgrade', { id: userId, ...upgradeData });
  }

  async getReferrals(userId) {
    return this.request('getReferrals', { id: userId });
  }

  async setRefBy(userId, refBy) {
    return this.request('setRefBy', { id: userId, ref_by: refBy });
  }

  async setModal(userId) {
    return this.request('setModal', { id: userId });
  }
}

// ============ REFERRAL MANAGER ============
class ReferralManager {
  constructor(domManager, apiManager) {
    this.dom = domManager;
    this.api = apiManager;
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Copy invite link
    if (this.dom.elements.copyLink) {
      this.dom.elements.copyLink.addEventListener('click', this.copyInviteLink.bind(this));
    }

    // Modal actions
    if (this.dom.elements.confirmBtn) {
      this.dom.elements.confirmBtn.addEventListener('click', this.confirmReferral.bind(this));
    }
    
    if (this.dom.elements.skipBtn) {
      this.dom.elements.skipBtn.addEventListener('click', this.skipReferral.bind(this));
    }
  }

  async loadReferrals(userId) {
    try {
      const data = await this.api.getReferrals(userId);
      this.updateReferralUI(data);
    } catch (error) {
      console.error('Error loading referrals:', error);
      this.dom.showNotification('Không thể tải danh sách bạn bè', 'error');
    }
  }

  updateReferralUI(data) {
    // Update referral bonus and count
    if (this.dom.elements.refBonus) {
      this.dom.elements.refBonus.textContent = data.ref_bonus || 0;
    }
    if (this.dom.elements.refCount) {
      this.dom.elements.refCount.textContent = data.list?.length || 0;
    }

    // Update referrals list
    if (this.dom.elements.referralsList) {
      this.dom.elements.referralsList.innerHTML = '';

      if (!data.list || data.list.length === 0) {
        this.dom.elements.referralsList.innerHTML = 
          '<li>Bạn chưa mời ai cả. Hãy chia sẻ link để nhận thưởng 💰</li>';
        return;
      }

      data.list.forEach(friend => {
        const li = document.createElement('li');
        li.innerHTML = `
          <span class="ref-name">${friend.first_name || 'Người dùng'}</span>
          <span class="ref-coins">${friend.coin || 0} 💰</span>
        `;
        this.dom.elements.referralsList.appendChild(li);
      });
    }
  }

  async copyInviteLink() {
    const link = this.dom.elements.inviteLink?.value;
    if (!link) return;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(link);
      } else {
        // Fallback for older browsers
        this.dom.elements.inviteLink.select();
        document.execCommand('copy');
      }
      
      this.dom.showNotification('Đã sao chép link mời!', 'success');
      
      // Haptic feedback if available
      if (tg?.HapticFeedback) {
        tg.HapticFeedback.notificationOccurred('success');
      }
    } catch (error) {
      console.error('Copy failed:', error);
      this.dom.showNotification('Không thể sao chép link', 'error');
    }
  }

  showModal() {
    if (this.dom.elements.modal) {
      this.dom.elements.modal.classList.add('show');
      // Focus on input for better UX
      setTimeout(() => {
        if (this.dom.elements.refInput) {
          this.dom.elements.refInput.focus();
        }
      }, 300);
    }
  }

  async confirmReferral() {
    const refId = parseInt(this.dom.elements.refInput?.value.trim());
    
    if (!refId || isNaN(refId) || refId === user?.id) {
      this.dom.showNotification('Vui lòng nhập ID hợp lệ (không phải chính bạn)', 'warning');
      return;
    }

    try {
      const data = await this.api.setRefBy(user.id, refId);
      
      if (data.success) {
        await this.api.setModal(user.id);
        this.dom.showNotification('🎉 Nhập mã mời thành công!', 'success');
        this.hideModal();
      } else {
        this.dom.showNotification(data.error || 'Đã xảy ra lỗi', 'error');
      }
    } catch (error) {
      console.error('Referral confirmation error:', error);
      this.dom.showNotification('Không thể xác nhận mã mời', 'error');
    }
  }

  async skipReferral() {
    try {
      await this.api.setModal(user.id);
      this.hideModal();
    } catch (error) {
      console.error('Skip referral error:', error);
      this.dom.showNotification('Không thể bỏ qua', 'error');
    }
  }

  hideModal() {
    if (this.dom.elements.modal) {
      this.dom.elements.modal.classList.remove('show');
    }
  }
}

// ============ GAME CONTROLLER ============
class GameController {
  constructor() {
    this.gameState = new GameState();
    this.domManager = new DOMManager();
    this.apiManager = new APIManager();
    this.referralManager = new ReferralManager(this.domManager, this.apiManager);
    
    this.tapDebounceTimeout = null;
    this.updateInterval = null;
    
    this.initialize();
  }

  async initialize() {
    if (!user) {
      this.domManager.elements.greeting.textContent = 'Không thể lấy thông tin người dùng.';
      return;
    }

    // Show greeting
    this.domManager.elements.greeting.innerHTML = 
      `Xin chào <b>${user.first_name}</b> (ID: <span style="color: orange">${user.id}</span>) 👋`;

    try {
      // Load user data
      const userData = await this.apiManager.getUser({
        id: user.id,
        username: user.username,
        first_name: user.first_name
      });

      this.updateGameState(userData);
      this.setupGameplay();
      this.startUpdateLoop();
      
      // Setup invite link - chỉ ID của user
      if (this.domManager.elements.inviteLink) {
        this.domManager.elements.inviteLink.value = user.id.toString();
      }

      // Load referrals
      await this.referralManager.loadReferrals(user.id);

      // Show referral modal if needed
      if (userData.modal === 'no') {
        this.referralManager.showModal();
      }

    } catch (error) {
      console.error('Initialization error:', error);
      this.domManager.showNotification('Lỗi khi khởi tạo game', 'error');
    }
  }

  updateGameState(userData) {
    this.gameState.coin = userData.coin || 0;
    this.gameState.tapLevel = userData.tap_level || 1;
    this.gameState.energyLevel = userData.energy_level || 1;
    this.gameState.maxEnergy = this.gameState.energyLevels[this.gameState.energyLevel];
    this.gameState.lastTapAt = userData.last_tap_at;
    this.domManager.updateUI(this.gameState);
  }

  setupGameplay() {
    // Tap functionality - Pet image
    if (this.domManager.elements.bigCoin) {
      this.domManager.elements.bigCoin.addEventListener('click', this.handleTap.bind(this));
      this.domManager.elements.bigCoin.addEventListener('touchend', this.handleTap.bind(this));
    }

    // Upgrade buttons
    if (this.domManager.elements.upgradeTap) {
      this.domManager.elements.upgradeTap.addEventListener('click', () => this.handleUpgrade('tap'));
    }
    
    if (this.domManager.elements.upgradeEnergy) {
      this.domManager.elements.upgradeEnergy.addEventListener('click', () => this.handleUpgrade('energy'));
    }
  }

  handleTap(event) {
    event.preventDefault();
    
    if (!this.gameState.canTap()) {
      if (tg?.HapticFeedback) {
        tg.HapticFeedback.notificationOccurred('error');
      }
      this.domManager.showNotification('Bạn đã hết năng lượng! Hãy đợi hồi năng lượng nhé.', 'warning');
      return;
    }

    // Optimistic update
    this.gameState.pendingTaps++;
    this.gameState.coin += this.gameState.tapLevel;
    
    // Visual feedback
    this.domManager.showTapEffect(this.gameState.tapLevel, event);
    this.domManager.updateUI(this.gameState);
    
    // Haptic feedback
    if (tg?.HapticFeedback) {
      tg.HapticFeedback.impactOccurred('light');
    }

    // Debounced server sync
    this.debounceTapSync();
  }

  debounceTapSync() {
    clearTimeout(this.tapDebounceTimeout);
    this.tapDebounceTimeout = setTimeout(async () => {
      if (this.gameState.pendingTaps === 0) return;

      try {
        const response = await this.apiManager.tap(
          user.id, 
          this.gameState.pendingTaps, 
          this.gameState.tapLevel
        );

        if (response.success && response.user) {
          // Reset pending taps first
          this.gameState.pendingTaps = 0;
          // Then update with server data
          this.updateGameState(response.user);
        } else {
          console.error('Tap sync error:', response);
          this.domManager.showNotification('Lỗi đồng bộ - thử lại', 'error');
        }
      } catch (error) {
        console.error('Tap request failed:', error);
        this.domManager.showNotification('Mất kết nối - đang thử lại...', 'warning');
      }
    }, 1000);
  }

  async handleUpgrade(type) {
    if (this.gameState.isLoading) return;

    const upgradeData = type === 'tap' 
      ? { tapLevel: this.gameState.tapLevel + 1 }
      : { energyLevel: this.gameState.energyLevel + 1 };

    const canUpgrade = type === 'tap' 
      ? this.gameState.canUpgradeTap() 
      : this.gameState.canUpgradeEnergy();

    if (!canUpgrade) {
      const reason = type === 'tap' 
        ? (this.gameState.tapLevel >= this.gameState.maxLevel ? 'Đã đạt cấp tối đa!' : 'Không đủ xu để nâng cấp.')
        : (this.gameState.energyLevel >= this.gameState.maxLevel ? 'Đã đạt cấp tối đa!' : 'Không đủ xu để nâng cấp.');
      
      this.domManager.showNotification(reason, 'warning');
      return;
    }

    this.gameState.isLoading = true;
    this.domManager.updateUI(this.gameState);

    try {
      const response = await this.apiManager.upgrade(user.id, upgradeData);
      
      if (response.success && response.user) {
        this.updateGameState(response.user);
        const upgradeType = type === 'tap' ? 'tap' : 'năng lượng';
        this.domManager.showNotification(`Nâng cấp ${upgradeType} thành công!`, 'success');
        
        if (tg?.HapticFeedback) {
          tg.HapticFeedback.notificationOccurred('success');
        }
      } else {
        this.domManager.showNotification(`Lỗi nâng cấp ${type}.`, 'error');
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      this.domManager.showNotification('Không thể nâng cấp - thử lại', 'error');
    } finally {
      this.gameState.isLoading = false;
      this.domManager.updateUI(this.gameState);
    }
  }

  startUpdateLoop() {
    // Update UI every 5 seconds
    this.updateInterval = setInterval(() => {
      this.domManager.updateUI(this.gameState);
    }, 5000);

    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
      if (this.updateInterval) {
        clearInterval(this.updateInterval);
      }
      if (this.tapDebounceTimeout) {
        clearTimeout(this.tapDebounceTimeout);
      }
    });
  }
}

// ============ INITIALIZE GAME ============
let gameController;
let referralManager; // Global reference for tab switching

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    gameController = new GameController();
    referralManager = gameController.referralManager;
  });
} else {
  gameController = new GameController();
  referralManager = gameController.referralManager;
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes floatUp {
    0% {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }
    100% {
      opacity: 0;
      transform: translate(-50%, -150%) scale(1.2);
    }
  }
  
  .shake {
    animation: shake 0.3s ease-in-out;
  }
  
  @keyframes shake {
    0%, 100% { transform: scale(1) rotate(0deg); }
    25% { transform: scale(1.05) rotate(-2deg); }
    75% { transform: scale(1.05) rotate(2deg); }
  }
  
  .low-energy {
    background: linear-gradient(90deg, #e74c3c, #c0392b) !important;
  }
  
  .disabled {
    opacity: 0.6;
    pointer-events: none;
  }
`;
document.head.appendChild(style);