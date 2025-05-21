import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  const { id, first_name, username } = req.body;

  // Lấy user hiện tại
  const { data: user, error: getError } = await supabase
    .from('users')
    .select('id, username, first_name, coin, energy, last_tap_at')
    .eq('id', id)
    .single();

  if (getError && getError.code !== 'PGRST116') {
    return res.status(500).json({ error: getError.message });
  }

  const maxEnergy = 500;
  let updatedUser = user;

  if (user) {
    const now = Date.now();
    const lastTap = new Date(user.last_tap_at || 0).getTime();
    const elapsed = now - lastTap;

    // Tính năng hồi năng lượng theo thời gian (30 phút hồi đầy)
    const regen = Math.floor((elapsed / (30 * 60 * 1000)) * maxEnergy);
    const currentEnergy = Math.min(maxEnergy, user.energy + regen);

    // Nếu năng lượng cần cập nhật → ghi lại DB
    if (currentEnergy !== user.energy) {
      const { data: updated, error: updateError } = await supabase
        .from('users')
        .update({ energy: currentEnergy })
        .eq('id', id)
        .select('id, username, first_name, coin, energy, last_tap_at')
        .single();

      if (updateError) return res.status(500).json({ error: updateError.message });
      updatedUser = updated;
    }

    return res.status(200).json(updatedUser);
  }

  // Nếu chưa có → tạo mới
  const { data: created, error: insertError } = await supabase
    .from('users')
    .insert([{ id, first_name, username, coin: 0, energy: 500, last_tap_at: null }])
    .select('id, username, first_name, coin, energy, last_tap_at')
    .single();

  if (insertError) return res.status(500).json({ error: insertError.message });

  return res.status(200).json(created);
}
