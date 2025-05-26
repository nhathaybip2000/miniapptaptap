document.addEventListener("DOMContentLoaded", () => {
  // Chuyển tab login/register
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

  // Toggle hiện/ẩn mật khẩu
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

  // Gửi form đăng ký
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

  // Gửi form đăng nhập
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
          // Ẩn form login/register
          document.getElementById("auth-section").style.display = "none";

          if (user.role === "admin") {
            // Hiện giao diện admin
            document.querySelector(".admin-container").style.display = "block";
            document.getElementById("main-app").style.display = "none";
          } else {
            // Hiện giao diện người dùng
            document.getElementById("main-app").style.display = "block";
            document.querySelector(".admin-container").style.display = "none";

            // Cập nhật tên và số dư
            document.getElementById("username-display").textContent = user.username;
            document.getElementById("tcd-balance").textContent = user.tcd_balance;
            document.getElementById("tcd-balance-display").textContent = user.tcd_balance;
            document.getElementById("vndc-balance-display").textContent = user.vndc_balance;
            document.getElementById("account-tcd-balance").textContent = user.tcd_balance;
            document.getElementById("account-vndc-balance").textContent = user.vndc_balance;
          }
        }, 800);
      } else {
        showNotification(data.message || data.error || "Lỗi đăng nhập", "error");
      }
    } catch (err) {
      showNotification("Lỗi kết nối máy chủ", "error");
    }
  });

  // Hiển thị thông báo
  function showNotification(message, type = "info") {
    const area = document.getElementById("notification-area");
    area.innerHTML = `<div class="notification ${type}">${message}</div>`;
    setTimeout(() => {
      area.innerHTML = "";
    }, 4000);
  }

  // ===== TAB NAVIGATION FUNCTIONS =====
  
  // Main app bottom navigation
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', function() {
      const tabName = this.getAttribute('data-tab');
      switchTab(tabName);
    });
  });
  
  // Exchange tabs
  const exchangeTabs = document.querySelectorAll('.exchange-tab');
  exchangeTabs.forEach(tab => {
    tab.addEventListener('click', function() {
      const tabName = this.getAttribute('data-tab');
      switchExchangeTab(tabName);
    });
  });
  
  // Account tabs
  const accountTabs = document.querySelectorAll('.account-tab');
  accountTabs.forEach(tab => {
    tab.addEventListener('click', function() {
      const tabName = this.getAttribute('data-tab');
      switchAccountTab(tabName);
    });
  });
  
  // Admin tabs
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

  // Logout buttons
  document.getElementById('logout-btn')?.addEventListener('click', userLogout);
  document.querySelector('.logout-btn')?.addEventListener('click', adminLogout);
});

// ===== ADMIN TAB NAVIGATION =====
function showTab(tabName) {
  // Remove active class from all admin tabs
  const adminTabs = document.querySelectorAll('.admin-tab');
  adminTabs.forEach(tab => tab.classList.remove('active'));
  
  // Remove active class from all admin tab contents
  const adminTabContents = document.querySelectorAll('.admin-container .tab-content');
  adminTabContents.forEach(content => content.classList.remove('active'));
  
  // Add active class to clicked tab
  event.target.classList.add('active');
  
  // Show corresponding tab content
  const targetTab = document.getElementById(tabName + '-tab');
  if (targetTab) {
    targetTab.classList.add('active');
  }
}

// ===== USER APP TAB NAVIGATION =====
function switchTab(tabName) {
  // Remove active class from all nav items
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => item.classList.remove('active'));
  
  // Remove active class from all tab contents
  const tabContents = document.querySelectorAll('.tab-contents .tab-content');
  tabContents.forEach(content => content.classList.remove('active'));
  
  // Add active class to clicked nav item
  const activeNavItem = document.querySelector(`[data-tab="${tabName}"]`);
  if (activeNavItem) {
    activeNavItem.classList.add('active');
  }
  
  // Show corresponding tab content
  const targetContent = document.getElementById(`tab-${tabName}`);
  if (targetContent) {
    targetContent.classList.add('active');
  }
}

// ===== EXCHANGE TAB NAVIGATION =====
function switchExchangeTab(tabName) {
  // Remove active class from all exchange tabs
  const exchangeTabs = document.querySelectorAll('.exchange-tab');
  exchangeTabs.forEach(tab => tab.classList.remove('active'));
  
  // Remove active class from all exchange tab contents
  const exchangeContents = document.querySelectorAll('.exchange-tab-content');
  exchangeContents.forEach(content => content.classList.remove('active'));
  
  // Add active class to clicked tab
  event.target.classList.add('active');
  
  // Show corresponding exchange content
  const targetContent = document.getElementById(tabName);
  if (targetContent) {
    targetContent.classList.add('active');
  }
}

// ===== ACCOUNT TAB NAVIGATION =====
function switchAccountTab(tabName) {
  // Remove active class from all account tabs
  const accountTabs = document.querySelectorAll('.account-tab');
  accountTabs.forEach(tab => tab.classList.remove('active'));
  
  // Remove active class from all account tab contents
  const accountContents = document.querySelectorAll('.account-tab-content');
  accountContents.forEach(content => content.classList.remove('active'));
  
  // Add active class to clicked tab
  event.target.classList.add('active');
  
  // Show corresponding account content
  const targetContent = document.getElementById(`${tabName}-content`);
  if (targetContent) {
    targetContent.classList.add('active');
  }
}

// ===== LOGOUT FUNCTIONS =====
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

// ===== UTILITY FUNCTIONS =====

// Function to get current active tab
function getCurrentTab() {
  const activeTab = document.querySelector('.nav-item.active');
  return activeTab ? activeTab.getAttribute('data-tab') : null;
}

// Function to get current active admin tab
function getCurrentAdminTab() {
  const activeTab = document.querySelector('.admin-tab.active');
  return activeTab ? activeTab.textContent.trim() : null;
}

// Function to programmatically switch to a specific tab
function goToTab(tabName) {
  switchTab(tabName);
}

// Function to programmatically switch to a specific admin tab
function goToAdminTab(tabName) {
  showTab(tabName);
}

// Export functions for external use
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