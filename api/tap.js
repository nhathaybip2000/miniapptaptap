import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { id, tapCount, tapLevel } = req.body;

  if (!id || !tapCount || tapCount < 1 || !tapLevel || tapLevel < 1) {
    return res.status(400).json({ error: 'Dữ liệu không hợp lệ' });
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
  const tapLvl = user.tap_level || 1;

  const energyCap = 500 + (energyLevel - 1) * 200;
  const recoveryDuration = 30 * 60 * 1000; // 30 phút hồi full
  const recoveryPerMs = energyCap / recoveryDuration;

  const recoveredEnergy = Math.min(
    energyCap,
    Math.floor(elapsed * recoveryPerMs)
  );

  // Tính năng lượng cần dùng = số lần tap * năng lượng mỗi tap
  const energyRequired = tapCount * tapLevel;

  if (recoveredEnergy < energyRequired) {
    return res.status(400).json({ error: 'Không đủ năng lượng để Tap' });
  }

  const totalCoinEarned = tapCount * tapLevel;

  // Tính lại thời gian `last_tap_at` mới
  const remainingEnergy = recoveredEnergy - energyRequired;
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

  // Lấy lại dữ liệu mới nhất
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
