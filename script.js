const tg = window.Telegram.WebApp;
tg.expand(); // Mở rộng giao diện

const user = tg.initDataUnsafe?.user;

if (user) {
  document.getElementById('greeting').textContent =
    `Xin chào ${user.first_name} (ID: ${user.id}) 👋`;
} else {
  document.getElementById('greeting').textContent =
    'Không thể lấy thông tin người dùng.';
}
