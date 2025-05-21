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

  const { data: user, error: getError } = await supabase
    .from('users')
    .select('coin, last_tap_at')
    .eq('id', id)
    .single();

  if (getError || !user) {
    return res.status(404).json({ error: 'Không tìm thấy người dùng' });
  }

  const now = Date.now();
  const last = user.last_tap_at ? new Date(user.last_tap_at).getTime() : 0;
  const elapsed = now - last;
  const maxEnergy = 500;
  const energy = Math.floor(maxEnergy * Math.min(1, elapsed / (30 * 60 * 1000)));

  if (energy < count) {
    return res.status(400).json({ error: 'Không đủ năng lượng để Tap' });
  }

  const remainingEnergy = energy - count;

  const updateFields = {
    coin: user.coin + count
  };

  if (remainingEnergy <= 0) {
    updateFields.last_tap_at = new Date().toISOString(); // Chỉ cập nhật nếu đã dùng hết
  }

  const { error: updateError } = await supabase
    .from('users')
    .update(updateFields)
    .eq('id', id);

  if (updateError) {
    return res.status(500).json({ error: 'Lỗi khi cập nhật dữ liệu' });
  }

  return res.status(200).json({
    coin: user.coin + count,
    last_tap_at: updateFields.last_tap_at || user.last_tap_at
  });
}
