import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { id, tapCount } = req.body;

  if (!id || !tapCount || tapCount < 1) {
    return res.status(400).json({ error: 'Thiếu id hoặc số lần tap không hợp lệ' });
  }

  // Lấy dữ liệu người dùng
  const { data: user, error: getError } = await supabase
    .from('users')
    .select('coin, last_tap_at, tap_level, energy_level')
    .eq('id', id)
    .single();

  if (getError || !user) {
    return res.status(404).json({ error: 'Không tìm thấy người dùng' });
  }

  const now = Date.now();
  const lastTap = user.last_tap_at ? new Date(user.last_tap_at).getTime() : 0;
  const elapsed = now - lastTap;

  const energyLevel = user.energy_level || 1;
  const tapLevel = user.tap_level || 1;

  const energyCap = 500 + (energyLevel - 1) * 200;
  const recoveryDuration = 30 * 60 * 1000; // 30 phút hồi full
  const recoveryPerMs = energyCap / recoveryDuration;

  const recoveredEnergy = Math.min(
    energyCap,
    Math.floor(elapsed * recoveryPerMs)
  );

  if (recoveredEnergy < tapCount) {
    return res.status(400).json({ error: 'Không đủ năng lượng để Tap' });
  }

  const coinPerTap = tapLevel;
  const totalCoinEarned = coinPerTap * tapCount;

  // Cập nhật last_tap_at để phản ánh năng lượng đã dùng
  const energyUsed = tapCount;
  const remainingEnergy = recoveredEnergy - energyUsed;
  const newLastTapAt = new Date(now - remainingEnergy / recoveryPerMs).toISOString();

  const newCoin = user.coin + totalCoinEarned;

  const { error: updateError } = await supabase
    .from('users')
    .update({
      coin: newCoin,
      last_tap_at: newLastTapAt
    })
    .eq('id', id);

  if (updateError) {
    return res.status(500).json({ error: 'Lỗi khi cập nhật dữ liệu' });
  }

  // Lấy lại dữ liệu mới nhất để client đồng bộ ngay
  const { data: updatedUser, error: fetchError } = await supabase
    .from('users')
    .select('coin, last_tap_at, tap_level, energy_level')
    .eq('id', id)
    .single();

  if (fetchError || !updatedUser) {
    return res.status(500).json({ error: 'Lỗi khi tải lại dữ liệu người dùng' });
  }

  return res.status(200).json({ success: true, user: updatedUser });
}
