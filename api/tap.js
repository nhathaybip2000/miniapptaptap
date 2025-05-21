// /api/tap.js
const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

router.post('/', async (req, res) => {
  const { id, count } = req.body;
  if (!id || !count) return res.status(400).json({ error: 'Missing id or count' });

  // Lấy thông tin user
  const { data: user, error } = await supabase
    .from('users')
    .select('coin, energy, last_tap_at')
    .eq('id', id)
    .single();

  if (error || !user) return res.status(500).json({ error: 'User not found' });

  const maxEnergy = 500;
  const now = Date.now();
  const lastTap = new Date(user.last_tap_at || 0).getTime();
  const elapsed = now - lastTap;

  // Hồi năng lượng dựa vào thời gian (30 phút hồi đầy)
  const regen = Math.floor((elapsed / (30 * 60 * 1000)) * maxEnergy);
  let currentEnergy = Math.min(maxEnergy, user.energy + regen);

  // Nếu không đủ năng lượng để tap
  if (currentEnergy <= 0) {
    return res.json({
      coin: user.coin,
      energy: 0,
      last_tap_at: user.last_tap_at
    });
  }

  // Chỉ được tap bằng năng lượng hiện có
  const actualTaps = Math.min(count, currentEnergy);
  const newCoin = user.coin + actualTaps;
  const newEnergy = currentEnergy - actualTaps;
  const lastTapAt = new Date().toISOString();

  // Cập nhật vào Supabase
  const { error: updateError } = await supabase
    .from('users')
    .update({
      coin: newCoin,
      energy: newEnergy,
      last_tap_at: lastTapAt
    })
    .eq('id', id);

  if (updateError) {
    console.error('Lỗi khi cập nhật dữ liệu:', updateError);
    return res.status(500).json({ error: 'Cập nhật thất bại' });
  }

  // Gửi lại kết quả
  res.json({
    coin: newCoin,
    energy: newEnergy,
    last_tap_at: lastTapAt
  });
});

module.exports = router;
