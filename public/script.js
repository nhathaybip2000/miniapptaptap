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

let miningCooldown = 600;
let miningTimer = null;
let remainingTime = 0;
let user = JSON.parse(localStorage.getItem("user")) || {};
let isMiningReady = true;
function calculateCooldown() {
  const base = 600; // 10 phút
  const reduction = (user.speed_level || 1) * 30; // mỗi cấp giảm 30s
  return Math.max(60, base - reduction); // tối thiểu còn 1 phút
}
function calculateReward() {
  const base = 100; 
  const bonus = (user.production_level || 1) * 10;
  return base + bonus;
}
function updateCountdownUI(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  document.getElementById("mining-countdown").textContent =
    `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}
function startMiningCooldown() {
  isMiningReady = false;
  document.getElementById("start-mining").disabled = true;
  remainingTime = calculateCooldown();
  updateCountdownUI(remainingTime);
  miningTimer = setInterval(() => {
    remainingTime--;
    updateCountdownUI(remainingTime);
    if (remainingTime <= 0) {
      clearInterval(miningTimer);
      isMiningReady = true;
      document.getElementById("start-mining").disabled = false;
      showNotification("Bạn có thể khai thác lại!", "success");
    }
  }, 1000);
}
document.getElementById("start-mining").addEventListener("click", () => {
  if (!isMiningReady) return;
  const reward = calculateReward();
  user.tcd_balance += reward;
  document.getElementById("tcd-balance").textContent = user.tcd_balance;
  document.getElementById("tcd-balance-display").textContent = user.tcd_balance;
  document.getElementById("account-tcd-balance").textContent = user.tcd_balance;
  showNotification(`Khai thác thành công! +${reward} TCD`, "success");
  localStorage.setItem("user", JSON.stringify(user));
  startMiningCooldown();
});
function initMiningUI() {
  if (!user || !user.username) return;
  document.getElementById("speed-level").textContent = user.speed_level || 1;
  document.getElementById("speed-reduction").textContent = (user.speed_level || 1) * 0.5;
  document.getElementById("mining-level").textContent = user.production_level || 1;
  document.getElementById("mining-bonus").textContent = (user.production_level || 1) * 10;
  document.getElementById("speed-cost").textContent = 500;
  document.getElementById("mining-cost").textContent = 300;
  document.getElementById("tcd-balance").textContent = user.tcd_balance || 0;
  document.getElementById("tcd-balance-display").textContent = user.tcd_balance || 0;
  document.getElementById("account-tcd-balance").textContent = user.tcd_balance || 0;
  isMiningReady = true;
  document.getElementById("start-mining").disabled = false;
}

document.getElementById("upgrade-speed").addEventListener("click", () => {
  const cost = 500;
  if (user.tcd_balance >= cost) {
    user.tcd_balance -= cost;
    user.speed_level += 1;

    showNotification("Đã nâng cấp tốc độ!", "success");
    localStorage.setItem("user", JSON.stringify(user));
    initMiningUI();
  } else {
    showNotification("Không đủ TCD để nâng cấp!", "error");
  }
});

document.getElementById("upgrade-mining").addEventListener("click", () => {
  const cost = 300;
  if (user.tcd_balance >= cost) {
    user.tcd_balance -= cost;
    user.production_level += 1;

    showNotification("Đã nâng cấp sản lượng!", "success");
    localStorage.setItem("user", JSON.stringify(user));
    initMiningUI();
  } else {
    showNotification("Không đủ TCD để nâng cấp!", "error");
  }
});
