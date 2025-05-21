import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { id, count } = req.body;

  if (!id || !count || count < 1) {
    return res.status(400).json({ error: 'Thiếu id hoặc số lần tap không hợp lệ' });
  }

  // 🔍 Lấy đầy đủ dữ liệu người dùng
  const { data: user, error: getError } = await supabase
    .from('users')
    .select('coin, last_tap_at, tap_level, energy_level')
    .eq('id', id)
    .single();

  if (getError || !user) {
    return res.status(404).json({ error: 'Không tìm thấy người dùng' });
  }

  const now = Date.now();
  const last = user.last_tap_at ? new Date(user.last_tap_at).getTime() : 0;
  const elapsed = now - last;

  // ⚡ Hồi năng lượng dựa theo cấp độ
  const energyCap = 500 + (user.energy_level - 1) * 200; // mỗi cấp thêm 200 năng lượng
  const recoveryDuration = 30 * 60 * 1000; // 30 phút để hồi đầy
  const recoveryRate = recoveryDuration / energyCap;

  const energyRecovered = Math.min(energyCap, Math.floor((elapsed / recoveryDuration) * energyCap));
  const remainingEnergy = energyRecovered - count;

  if (remainingEnergy < 0) {
    return res.status(400).json({ error: 'Không đủ năng lượng để Tap' });
  }

  // ✅ Tính số xu nhận dựa vào cấp độ tap
  const coinPerTap = user.tap_level || 1;
  const coinEarned = coinPerTap * count;

  // ⚠️ Cập nhật lại last_tap_at dựa trên năng lượng còn lại
  const newLastTapAt = new Date(now - remainingEnergy * recoveryRate).toISOString();

  // ✅ Cập nhật lại vào database
  const { error: updateError } = await supabase
    .from('users')
    .update({
      coin: user.coin + coinEarned,
      last_tap_at: newLastTapAt
    })
    .eq('id', id);

  if (updateError) {
    return res.status(500).json({ error: 'Lỗi khi cập nhật dữ liệu' });
  }

  return res.status(200).json({
    coin: user.coin + coinEarned,
    last_tap_at: newLastTapAt
  });
}
