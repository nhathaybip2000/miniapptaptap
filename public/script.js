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

  // ========================= KHAI THÁC & NÂNG CẤP =========================
  let miningCooldown = 600;
  let miningTimer = null;
  let remainingTime = 0;
  let isMiningReady = true;
  let user = JSON.parse(localStorage.getItem("user")) || {};

  function calculateCooldown() {
    const base = 600;
    const reduction = (user.speed_level || 1) * 30;
    return Math.max(60, base - reduction);
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

  document.getElementById("start-mining")?.addEventListener("click", async () => {
    if (!isMiningReady) return;
    const reward = calculateReward();
    user.tcd_balance += reward;

    document.getElementById("tcd-balance").textContent = user.tcd_balance;
    document.getElementById("tcd-balance-display").textContent = user.tcd_balance;
    document.getElementById("account-tcd-balance").textContent = user.tcd_balance;

    showNotification(`Khai thác thành công! +${reward} TCD`, "success");

    localStorage.setItem("user", JSON.stringify(user));

    await fetch('/api/mining', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: user.id,
        tcd_balance: user.tcd_balance,
        speed_level: user.speed_level,
        production_level: user.production_level
      })
    });

    startMiningCooldown();
  });

  document.getElementById("upgrade-speed")?.addEventListener("click", async () => {
    const cost = 500;
    if (user.tcd_balance >= cost) {
      user.tcd_balance -= cost;
      user.speed_level = (user.speed_level || 1) + 1;
      showNotification("Đã nâng cấp tốc độ!", "success");
      localStorage.setItem("user", JSON.stringify(user));
      initMiningUI();
      await fetch('/api/mining', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: user.id,
          tcd_balance: user.tcd_balance,
          speed_level: user.speed_level,
          production_level: user.production_level
        })
      });
    } else {
      showNotification("Không đủ TCD để nâng cấp!", "error");
    }
  });

  document.getElementById("upgrade-mining")?.addEventListener("click", async () => {
    const cost = 300;
    if (user.tcd_balance >= cost) {
      user.tcd_balance -= cost;
      user.production_level = (user.production_level || 1) + 1;
      showNotification("Đã nâng cấp sản lượng!", "success");
      localStorage.setItem("user", JSON.stringify(user));
      initMiningUI();
      await fetch('/api/mining', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: user.id,
          tcd_balance: user.tcd_balance,
          speed_level: user.speed_level,
          production_level: user.production_level
        })
      });
    } else {
      showNotification("Không đủ TCD để nâng cấp!", "error");
    }
  });

  // ====================== TAB, ĐĂNG XUẤT ======================
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

  function userLogout() {
    localStorage.removeItem("user");
    document.getElementById("main-app").style.display = "none";
    document.getElementById("auth-section").style.display = "block";
    document.querySelector(".admin-container").style.display = "none";
  }

  function adminLogout() {
    localStorage.removeItem("user");
    document.querySelector(".admin-container").style.display = "none";
    document.getElementById("auth-section").style.display = "block";
    document.getElementById("main-app").style.display = "none";
  }

  // ====================== TỰ ĐỘNG ĐĂNG NHẬP ======================
  const savedUser = localStorage.getItem("user");
  if (savedUser) {
    user = JSON.parse(savedUser);
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
