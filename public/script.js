document.addEventListener("DOMContentLoaded", () => {
  let user = null;

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

    if (!termsChecked) return showNotification("Bạn phải đồng ý với điều khoản.", "error");
    if (password !== confirm) return showNotification("Mật khẩu xác nhận không khớp", "error");

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
        user = data.user;
        localStorage.setItem("user", JSON.stringify(user));
        showNotification("Đăng nhập thành công", "success");
        setTimeout(() => {
          showAppUI();
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

  function showAppUI() {
    document.getElementById("auth-section").style.display = "none";
    if (user.role === "admin") {
      document.querySelector(".admin-container").style.display = "block";
      document.getElementById("main-app").style.display = "none";
    } else {
      document.getElementById("main-app").style.display = "block";
      document.querySelector(".admin-container").style.display = "none";

      document.getElementById("username-display").textContent = user.username;
      document.getElementById("tcd-balance").textContent = user.tcd_balance || 0;
      document.getElementById("tcd-balance-display").textContent = user.tcd_balance || 0;
      document.getElementById("vndc-balance-display").textContent = user.vndc_balance || 0;
      document.getElementById("account-tcd-balance").textContent = user.tcd_balance || 0;
      document.getElementById("account-vndc-balance").textContent = user.vndc_balance || 0;
      initMiningUI();
    }
  }

  function initMiningUI() {
    document.getElementById("speed-level").textContent = user.speed_level || 1;
    document.getElementById("speed-reduction").textContent = ((user.speed_level || 1) * 0.5).toFixed(1);
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

  async function refreshUserData() {
    try {
      const res = await fetch(`/api/user/${user.id}`);
      const data = await res.json();
      if (res.ok) {
        user = data.user;
        localStorage.setItem("user", JSON.stringify(user));
        showAppUI();
      }
    } catch (err) {
      console.error("Failed to refresh user data", err);
    }
  }

  function userLogout() {
    localStorage.removeItem("user");
    user = null;
    document.getElementById("main-app").style.display = "none";
    document.getElementById("auth-section").style.display = "block";
    document.querySelector(".admin-container").style.display = "none";
  }

  function adminLogout() {
    localStorage.removeItem("user");
    user = null;
    document.querySelector(".admin-container").style.display = "none";
    document.getElementById("auth-section").style.display = "block";
    document.getElementById("main-app").style.display = "none";
  }

  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => switchTab(item.dataset.tab));
  });

  document.getElementById('logout-btn')?.addEventListener('click', userLogout);
  document.querySelector('.logout-btn')?.addEventListener('click', adminLogout);

  function switchTab(tabName) {
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    document.querySelectorAll('.tab-contents .tab-content').forEach(c => c.classList.remove('active'));
    document.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');
    document.getElementById(`tab-${tabName}`)?.classList.add('active');
  }

  // Auto-login nếu có localStorage
  const savedUser = localStorage.getItem("user");
  if (savedUser) {
    user = JSON.parse(savedUser);
    showAppUI();
  }
});
