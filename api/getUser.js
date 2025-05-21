import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Hàm tính lại năng lượng dựa trên last_tap_at
function calculateEnergy(lastTapAt, maxEnergy = 500) {
  if (!lastTapAt) return maxEnergy;
  const now = Date.now();
  const last = new Date(lastTapAt).getTime();
  const elapsed = now - last;
  const percent = Math.min(1, elapsed / (30 * 60 * 1000)); // 30 phút hồi full
  return Math.floor(maxEnergy * percent);
}

export default async function handler(req, res) {
  const { id, first_name, username } = req.body;

  const { data: existing, error: getError } = await supabase
    .from('users')
    .select('id, username, first_name, coin, energy, last_tap_at')
    .eq('id', id)
    .single();

  if (getError && getError.code !== 'PGRST116') {
    return res.status(500).json({ error: getError.message });
  }

  if (existing) {
    // ✅ Tính lại năng lượng
    const newEnergy = calculateEnergy(existing.last_tap_at);

    // ✅ Cập nhật vào DB nếu giá trị mới khác
    if (newEnergy !== existing.energy) {
      await supabase
        .from('users')
        .update({ energy: newEnergy })
        .eq('id', id);
    }

    return res.status(200).json({
      ...existing,
      energy: newEnergy // Trả về energy đã tính
    });
  }

  // Nếu chưa có user → tạo mới
  const { data: created, error: insertError } = await supabase
    .from('users')
    .insert([{ id, first_name, username, coin: 0, energy: 500, last_tap_at: null }])
    .select('id, username, first_name, coin, energy, last_tap_at')
    .single();

  if (insertError) return res.status(500).json({ error: insertError.message });

  return res.status(200).json(created);
}
