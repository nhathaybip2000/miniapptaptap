document.addEventListener("DOMContentLoaded", () => {
  const tabButtons = document.querySelectorAll(".tab-button");
  const formSections = document.querySelectorAll(".form-section");
  tabButtons.forEach(button => {
    button.addEventListener("click", () => {
      tabButtons.forEach(btn => btn.classList.remove("active"));
      button.classList.add("active");

      formSections.forEach(section => section.classList.remove("active"));
      const target = document.getElementById(`${button.dataset.tab}-form`);
      if (target) target.classList.add("active");
    });
  });
  document.querySelectorAll(".password-toggle").forEach(icon => {
    icon.addEventListener("click", () => {
      const targetInput = document.getElementById(icon.dataset.target);
      if (targetInput.type === "password") {
        targetInput.type = "text";
        icon.classList.remove("fa-eye-slash");
        icon.classList.add("fa-eye");
      } else {
        targetInput.type = "password";
        icon.classList.add("fa-eye-slash");
        icon.classList.remove("fa-eye");
      }
    });
  });
  document.getElementById("register-form-data").addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("register-username").value.trim();
    const email = document.getElementById("register-email").value.trim();
    const password = document.getElementById("register-password").value;
    const confirm = document.getElementById("register-confirm").value;
    const ref_by = document.getElementById("register-referral").value.trim();
    const termsChecked = document.getElementById("terms-agree").checked;
    if (!termsChecked) {
      return showNotification("Bạn phải đồng ý với điều khoản.", "error");
    }
    if (password !== confirm) {
      return showNotification("Mật khẩu xác nhận không khớp", "error");
    }
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password, referral: ref_by }),
      });
      const data = await res.json();
      if (res.ok) {
        showNotification("Đăng ký thành công! Bạn có thể đăng nhập", "success");
        document.querySelector('[data-tab="login"]').click();
      } else {
        showNotification(data.message || data.error || "Lỗi đăng ký", "error");
      }
    } catch (err) {
      showNotification("Lỗi kết nối máy chủ", "error");
    }
  });
  document.getElementById("login-form-data").addEventListener("submit", async (e) => {
    e.preventDefault();
    const emailOrUsername = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailOrUsername, password }),
      });
      const data = await res.json();
      if (res.ok) {
        const user = data.user;
        showNotification("Đăng nhập thành công", "success");
        localStorage.setItem("user", JSON.stringify(user));
        setTimeout(() => {
          document.getElementById("auth-section").style.display = "none";
          if (user.role === "admin") {
            document.querySelector(".admin-container").style.display = "block";
            document.getElementById("main-app").style.display = "none";
          } else {
            document.getElementById("main-app").style.display = "block";
            document.querySelector(".admin-container").style.display = "none";
            document.getElementById("username-display").textContent = user.username;
            document.getElementById("tcd-balance").textContent = user.tcd_balance;
            document.getElementById("tcd-balance-display").textContent = user.tcd_balance;
            document.getElementById("vndc-balance-display").textContent = user.vndc_balance;
            document.getElementById("account-tcd-balance").textContent = user.tcd_balance;
            document.getElementById("account-vndc-balance").textContent = user.vndc_balance;
            initMiningUI();
          }
        }, 800);
      } else {
        showNotification(data.message || data.error || "Lỗi đăng nhập", "error");
      }
    } catch (err) {
      showNotification("Lỗi kết nối máy chủ", "error");
    }
  });
  function showNotification(message, type = "info") {
    const area = document.getElementById("notification-area");
    area.innerHTML = `<div class="notification ${type}">${message}</div>`;
    setTimeout(() => {
      area.innerHTML = "";
    }, 4000);
  }
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', function() {
      const tabName = this.getAttribute('data-tab');
      switchTab(tabName);
    });
  });
  const exchangeTabs = document.querySelectorAll('.exchange-tab');
  exchangeTabs.forEach(tab => {
    tab.addEventListener('click', function() {
      const tabName = this.getAttribute('data-tab');
      switchExchangeTab(tabName);
    });
  });
  const accountTabs = document.querySelectorAll('.account-tab');
  accountTabs.forEach(tab => {
    tab.addEventListener('click', function() {
      const tabName = this.getAttribute('data-tab');
      switchAccountTab(tabName);
    });
  });
  const adminTabs = document.querySelectorAll('.admin-tab');
  adminTabs.forEach(tab => {
    tab.addEventListener('click', function() {
      const onclickAttr = this.getAttribute('onclick');
      if (onclickAttr) {
        const tabName = onclickAttr.match(/showTab\('(.+?)'\)/)[1];
        showTab(tabName);
      }
    });
  });
  document.getElementById('logout-btn')?.addEventListener('click', userLogout);
  document.querySelector('.logout-btn')?.addEventListener('click', adminLogout);
});
function showTab(tabName) {
  const adminTabs = document.querySelectorAll('.admin-tab');
  adminTabs.forEach(tab => tab.classList.remove('active'));
  const adminTabContents = document.querySelectorAll('.admin-container .tab-content');
  adminTabContents.forEach(content => content.classList.remove('active'));
  event.target.classList.add('active');
  const targetTab = document.getElementById(tabName + '-tab');
  if (targetTab) {
    targetTab.classList.add('active');
  }
}
function switchTab(tabName) {
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => item.classList.remove('active'));
  const tabContents = document.querySelectorAll('.tab-contents .tab-content');
  tabContents.forEach(content => content.classList.remove('active'));
  const activeNavItem = document.querySelector(`[data-tab="${tabName}"]`);
  if (activeNavItem) {
    activeNavItem.classList.add('active');
  }
  const targetContent = document.getElementById(`tab-${tabName}`);
  if (targetContent) {
    targetContent.classList.add('active');
  }
}
function switchExchangeTab(tabName) {
  const exchangeTabs = document.querySelectorAll('.exchange-tab');
  exchangeTabs.forEach(tab => tab.classList.remove('active'));
  const exchangeContents = document.querySelectorAll('.exchange-tab-content');
  exchangeContents.forEach(content => content.classList.remove('active'));
  event.target.classList.add('active');
  const targetContent = document.getElementById(tabName);
  if (targetContent) {
    targetContent.classList.add('active');
  }
}
function switchAccountTab(tabName) {
  const accountTabs = document.querySelectorAll('.account-tab');
  accountTabs.forEach(tab => tab.classList.remove('active'));
  const accountContents = document.querySelectorAll('.account-tab-content');
  accountContents.forEach(content => content.classList.remove('active'));
  event.target.classList.add('active');
  const targetContent = document.getElementById(`${tabName}-content`);
  if (targetContent) {
    targetContent.classList.add('active');
  }
}
function adminLogout() {
  localStorage.removeItem("user");
  document.querySelector(".admin-container").style.display = "none";
  document.getElementById("auth-section").style.display = "block";
  document.getElementById("main-app").style.display = "none";
}
function userLogout() {
  localStorage.removeItem("user");
  document.getElementById("main-app").style.display = "none";
  document.getElementById("auth-section").style.display = "block";
  document.querySelector(".admin-container").style.display = "none";
}
function getCurrentTab() {
  const activeTab = document.querySelector('.nav-item.active');
  return activeTab ? activeTab.getAttribute('data-tab') : null;
}
function getCurrentAdminTab() {
  const activeTab = document.querySelector('.admin-tab.active');
  return activeTab ? activeTab.textContent.trim() : null;
}
function goToTab(tabName) {
  switchTab(tabName);
}
function goToAdminTab(tabName) {
  showTab(tabName);
}
window.TcdMiningTabs = {
  switchTab,
  switchExchangeTab,
  switchAccountTab,
  showTab,
  goToTab,
  goToAdminTab,
  getCurrentTab,
  getCurrentAdminTab,
  adminLogout,
  userLogout
};
const savedUser = localStorage.getItem("user");
if (savedUser) {
  const user = JSON.parse(savedUser);
  document.getElementById("auth-section").style.display = "none";
  if (user.role === "admin") {
    document.querySelector(".admin-container").style.display = "block";
    document.getElementById("main-app").style.display = "none";
  } else {
    document.getElementById("main-app").style.display = "block";
    document.querySelector(".admin-container").style.display = "none";
    document.getElementById("username-display").textContent = user.username;
    document.getElementById("tcd-balance").textContent = user.tcd_balance;
    document.getElementById("tcd-balance-display").textContent = user.tcd_balance;
    document.getElementById("vndc-balance-display").textContent = user.vndc_balance;
    document.getElementById("account-tcd-balance").textContent = user.tcd_balance;
    document.getElementById("account-vndc-balance").textContent = user.vndc_balance;
    initMiningUI();
  }
}

// Mining System - Fixed Version
let miningCooldown = 600; // 10 phút mặc định
let miningTimer = null;
let remainingTime = 0;
let user = JSON.parse(localStorage.getItem("user")) || {};
let isMiningReady = true;

// Hàm tính toán thời gian hồi chiêu
function calculateCooldown() {
  const base = 600; // 10 phút = 600 giây
  const speedLevel = user.speed_level || 1;
  const reduction = speedLevel * 30; // mỗi cấp giảm 30 giây
  return Math.max(60, base - reduction); // tối thiểu 1 phút
}

// Hàm tính toán phản thưởng
function calculateReward() {
  const base = 100; 
  const productionLevel = user.production_level || 1;
  const bonus = productionLevel * 10;
  return base + bonus;
}

// Cập nhật giao diện đếm ngược
function updateCountdownUI(seconds) {
  const countdownElement = document.getElementById("mining-countdown");
  if (!countdownElement) return;
  
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  countdownElement.textContent = 
    `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

// Cập nhật số dư trên giao diện
function updateBalanceUI() {
  const balanceElements = [
    "tcd-balance",
    "tcd-balance-display", 
    "account-tcd-balance"
  ];
  
  balanceElements.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = user.tcd_balance || 0;
    }
  });
}

// Bắt đầu thời gian hồi chiêu
function startMiningCooldown() {
  isMiningReady = false;
  const miningButton = document.getElementById("start-mining");
  if (miningButton) {
    miningButton.disabled = true;
    miningButton.textContent = "Đang hồi chiêu...";
  }
  
  remainingTime = calculateCooldown();
  updateCountdownUI(remainingTime);
  
  // Clear timer cũ nếu có
  if (miningTimer) {
    clearInterval(miningTimer);
  }
  
  miningTimer = setInterval(() => {
    remainingTime--;
    updateCountdownUI(remainingTime);
    
    if (remainingTime <= 0) {
      clearInterval(miningTimer);
      miningTimer = null;
      isMiningReady = true;
      
      const miningButton = document.getElementById("start-mining");
      if (miningButton) {
        miningButton.disabled = false;
        miningButton.textContent = "Bắt đầu khai thác";
      }
      
      // Hiện thông báo
      if (typeof showNotification === 'function') {
        showNotification("Bạn có thể khai thác lại!", "success");
      }
    }
  }, 1000);
}

// Xử lý sự kiện khai thác
function handleMining() {
  if (!isMiningReady) {
    if (typeof showNotification === 'function') {
      showNotification("Vui lòng chờ hết thời gian hồi chiêu!", "error");
    }
    return;
  }
  
  // Cập nhật user từ localStorage để đồng bộ
  const savedUser = localStorage.getItem("user");
  if (savedUser) {
    user = JSON.parse(savedUser);
  }
  
  const reward = calculateReward();
  user.tcd_balance = (user.tcd_balance || 0) + reward;
  
  // Cập nhật giao diện
  updateBalanceUI();
  
  // Hiện thông báo thành công
  if (typeof showNotification === 'function') {
    showNotification(`Khai thác thành công! +${reward} TCD`, "success");
  }
  
  // Lưu vào localStorage
  localStorage.setItem("user", JSON.stringify(user));
  
  // Bắt đầu hồi chiêu
  startMiningCooldown();
}

// Khởi tạo giao diện khai thác
function initMiningUI() {
  // Cập nhật user từ localStorage
  const savedUser = localStorage.getItem("user");
  if (savedUser) {
    user = JSON.parse(savedUser);
  }
  
  if (!user || !user.username) return;
  
  // Cập nhật thông tin cấp độ
  const speedLevelElement = document.getElementById("speed-level");
  if (speedLevelElement) {
    speedLevelElement.textContent = user.speed_level || 1;
  }
  
  const speedReductionElement = document.getElementById("speed-reduction");
  if (speedReductionElement) {
    speedReductionElement.textContent = (user.speed_level || 1) * 0.5;
  }
  
  const miningLevelElement = document.getElementById("mining-level");
  if (miningLevelElement) {
    miningLevelElement.textContent = user.production_level || 1;
  }
  
  const miningBonusElement = document.getElementById("mining-bonus");
  if (miningBonusElement) {
    miningBonusElement.textContent = (user.production_level || 1) * 10;
  }
  
  // Cập nhật giá nâng cấp
  const speedCostElement = document.getElementById("speed-cost");
  if (speedCostElement) {
    const speedCost = 500 * (user.speed_level || 1);
    speedCostElement.textContent = speedCost;
  }
  
  const miningCostElement = document.getElementById("mining-cost");
  if (miningCostElement) {
    const miningCost = 300 * (user.production_level || 1);
    miningCostElement.textContent = miningCost;
  }
  
  // Cập nhật số dư
  updateBalanceUI();
  
  // Reset trạng thái khai thác
  isMiningReady = true;
  const miningButton = document.getElementById("start-mining");
  if (miningButton) {
    miningButton.disabled = false;
    miningButton.textContent = "Bắt đầu khai thác";
  }
  
  // Clear countdown
  const countdownElement = document.getElementById("mining-countdown");
  if (countdownElement) {
    countdownElement.textContent = "00:00";
  }
}

// Nâng cấp tốc độ
function upgradeSpeed() {
  const savedUser = localStorage.getItem("user");
  if (savedUser) {
    user = JSON.parse(savedUser);
  }
  
  const currentLevel = user.speed_level || 1;
  const cost = 500 * currentLevel;
  
  if ((user.tcd_balance || 0) >= cost) {
    user.tcd_balance -= cost;
    user.speed_level = currentLevel + 1;
    
    if (typeof showNotification === 'function') {
      showNotification(`Đã nâng cấp tốc độ lên cấp ${user.speed_level}!`, "success");
    }
    
    localStorage.setItem("user", JSON.stringify(user));
    initMiningUI();
  } else {
    if (typeof showNotification === 'function') {
      showNotification(`Không đủ TCD! Cần ${cost} TCD để nâng cấp.`, "error");
    }
  }
}

// Nâng cấp sản lượng
function upgradeProduction() {
  const savedUser = localStorage.getItem("user");
  if (savedUser) {
    user = JSON.parse(savedUser);
  }
  
  const currentLevel = user.production_level || 1;
  const cost = 300 * currentLevel;
  
  if ((user.tcd_balance || 0) >= cost) {
    user.tcd_balance -= cost;
    user.production_level = currentLevel + 1;
    
    if (typeof showNotification === 'function') {
      showNotification(`Đã nâng cấp sản lượng lên cấp ${user.production_level}!`, "success");
    }
    
    localStorage.setItem("user", JSON.stringify(user));
    initMiningUI();
  } else {
    if (typeof showNotification === 'function') {
      showNotification(`Không đủ TCD! Cần ${cost} TCD để nâng cấp.`, "error");
    }
  }
}

// Gán sự kiện khi DOM đã sẵn sàng
document.addEventListener("DOMContentLoaded", () => {
  // Sự kiện nút khai thác
  const miningButton = document.getElementById("start-mining");
  if (miningButton) {
    miningButton.addEventListener("click", handleMining);
  }
  
  // Sự kiện nâng cấp tốc độ
  const upgradeSpeedButton = document.getElementById("upgrade-speed");
  if (upgradeSpeedButton) {
    upgradeSpeedButton.addEventListener("click", upgradeSpeed);
  }
  
  // Sự kiện nâng cấp sản lượng  
  const upgradeMiningButton = document.getElementById("upgrade-mining");
  if (upgradeMiningButton) {
    upgradeMiningButton.addEventListener("click", upgradeProduction);
  }
});

// Export functions for global access
window.MiningSystem = {
  initMiningUI,
  handleMining,
  upgradeSpeed,
  upgradeProduction,
  calculateCooldown,
  calculateReward
};