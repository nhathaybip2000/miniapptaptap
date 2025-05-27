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
    if (!termsChecked) return showNotification("Bạn phải đồng ý với điều khoản.", "error");
    if (password !== confirm) return showNotification("Mật khẩu xác nhận không khớp", "error");

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password, referral: ref_by })
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
        body: JSON.stringify({ emailOrUsername, password })
      });
      const data = await res.json();
      if (res.ok) {
        const user = data.user;
        showNotification("Đăng nhập thành công", "success");
        localStorage.setItem("user", JSON.stringify(user));
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
      } else {
        showNotification(data.message || data.error || "Lỗi đăng nhập", "error");
      }
    } catch (err) {
      showNotification("Lỗi kết nối máy chủ", "error");
    }
  });

  document.getElementById("start-mining")?.addEventListener("click", async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    const now = Date.now();
    if (now < user.next_mine_at) {
      showNotification("Bạn chưa thể khai thác ngay lúc này.", "error");
      return;
    }

    const reward = 100 + (user.production_level || 1) * 10;
    const updatedUser = { ...user, tcd_balance: user.tcd_balance + reward, next_mine_at: now + Math.max(600 - (user.speed_level || 1) * 30, 60) * 1000 };
    localStorage.setItem("user", JSON.stringify(updatedUser));
    document.getElementById("tcd-balance").textContent = updatedUser.tcd_balance;
    await fetch("/api/mining", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedUser)
    });
    showNotification(`Khai thác thành công! +${reward} TCD`, "success");
  });

  document.getElementById("upgrade-speed")?.addEventListener("click", async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    const cost = 500;
    if (user.tcd_balance >= cost) {
      user.tcd_balance -= cost;
      user.speed_level = (user.speed_level || 1) + 1;
      localStorage.setItem("user", JSON.stringify(user));
      await fetch("/api/mining", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user)
      });
      initMiningUI();
      showNotification("Đã nâng cấp tốc độ!", "success");
    } else {
      showNotification("Không đủ TCD để nâng cấp!", "error");
    }
  });

  document.getElementById("upgrade-mining")?.addEventListener("click", async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    const cost = 300;
    if (user.tcd_balance >= cost) {
      user.tcd_balance -= cost;
      user.production_level = (user.production_level || 1) + 1;
      localStorage.setItem("user", JSON.stringify(user));
      await fetch("/api/mining", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user)
      });
      initMiningUI();
      showNotification("Đã nâng cấp sản lượng!", "success");
    } else {
      showNotification("Không đủ TCD để nâng cấp!", "error");
    }
  });

  function initMiningUI() {
    const user = JSON.parse(localStorage.getItem("user"));
    document.getElementById("speed-level").textContent = user.speed_level || 1;
    document.getElementById("speed-reduction").textContent = ((user.speed_level || 1) * 0.5).toFixed(1);
    document.getElementById("mining-level").textContent = user.production_level || 1;
    document.getElementById("mining-bonus").textContent = (user.production_level || 1) * 10;
    document.getElementById("tcd-balance").textContent = user.tcd_balance;
    document.getElementById("tcd-balance-display").textContent = user.tcd_balance;
    document.getElementById("account-tcd-balance").textContent = user.tcd_balance;
  }

  function showNotification(message, type = "info") {
    const area = document.getElementById("notification-area");
    area.innerHTML = `<div class="notification ${type}">${message}</div>`;
    setTimeout(() => {
      area.innerHTML = "";
    }, 4000);
  }

  function switchTab(tabName) {
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    document.querySelectorAll('.tab-contents .tab-content').forEach(c => c.classList.remove('active'));
    document.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');
    document.getElementById(`tab-${tabName}`)?.classList.add('active');
  }

  document.getElementById('logout-btn')?.addEventListener('click', () => {
    localStorage.removeItem("user");
    document.getElementById("main-app").style.display = "none";
    document.getElementById("auth-section").style.display = "block";
    document.querySelector(".admin-container").style.display = "none";
  });

  document.querySelector('.logout-btn')?.addEventListener('click', () => {
    localStorage.removeItem("user");
    document.getElementById("main-app").style.display = "none";
    document.getElementById("auth-section").style.display = "block";
    document.querySelector(".admin-container").style.display = "none";
  });

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
});
