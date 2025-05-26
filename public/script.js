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
        showNotification("Đăng nhập thành công", "success");
        localStorage.setItem("user", JSON.stringify(data.user));
        setTimeout(() => {
          window.location.href = "/home.html";
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
});
