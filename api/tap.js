import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { id, count } = req.body;
  if (!id || !count) return res.status(400).json({ error: 'Thiếu id hoặc count' });

  // Lấy dữ liệu người dùng
  const { data: user, error: getError } = await supabase
    .from('users')
    .select('coin, last_tap_at')
    .eq('id', id)
    .single();

  if (getError || !user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Tính lại năng lượng dựa trên last_tap_at
  const now = Date.now();
  const last = user.last_tap_at ? new Date(user.last_tap_at).getTime() : 0;
  const elapsed = now - last;
  const maxEnergy = 500;
  const recovered = Math.min(1, elapsed / (30 * 60 * 1000)); // 30 phút hồi đầy
  let energy = Math.floor(maxEnergy * recovered);

  // Nếu không đủ năng lượng → từ chối
  if (energy < count) {
    return res.status(400).json({ error: 'Không đủ năng lượng để tap' });
  }

  // ✅ Nếu tap làm hết năng lượng → cập nhật last_tap_at = now
  let newLastTapAt = user.last_tap_at;
  if (energy === count) {
    newLastTapAt = new Date().toISOString();
  }

  // Cộng coin + cập nhật last_tap_at nếu cần
  const { error: updateError } = await supabase
    .from('users')
    .update({
      coin: user.coin + count,
      last_tap_at: newLastTapAt
    })
    .eq('id', id);

  if (updateError) return res.status(500).json({ error: updateError.message });

  return res.status(200).json({
    coin: user.coin + count,
    last_tap_at: newLastTapAt
  });
}
