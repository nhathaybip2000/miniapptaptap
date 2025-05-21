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

  const energyCap = 500 + (user.energy_level - 1) * 200;
  const recoveryDuration = 30 * 60 * 1000;
  const recoveryRate = recoveryDuration / energyCap;

  const energyRecovered = Math.min(energyCap, Math.floor((elapsed / recoveryDuration) * energyCap));
  const remainingEnergy = energyRecovered - tapCount;

  if (remainingEnergy < 0) {
    return res.status(400).json({ error: 'Không đủ năng lượng để Tap' });
  }

  const coinPerTap = user.tap_level || 1;
  const coinEarned = coinPerTap * tapCount;

  const newLastTapAt = new Date(now - remainingEnergy * recoveryRate).toISOString();

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
