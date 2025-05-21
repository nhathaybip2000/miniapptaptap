import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { id, tapLevel, energyLevel } = req.body;

  if (!id) return res.status(400).json({ error: 'Thiếu ID người dùng' });

  const { data: user, error: getError } = await supabase
    .from('users')
    .select('coin, tap_level, energy_level')
    .eq('id', id)
    .single();

  if (getError || !user) {
    return res.status(404).json({ error: 'Không tìm thấy người dùng' });
  }

  let updates = {};
  let cost = 0;

  if (tapLevel && tapLevel > user.tap_level) {
    const tapUpgradeCosts = [0, 100, 200, 400, 700, 1000, 1500, 2000];
    cost = tapUpgradeCosts[tapLevel] || 0;

    if (user.coin < cost) return res.status(400).json({ error: 'Không đủ xu nâng cấp tap' });

    updates.tap_level = tapLevel;
  }

  if (energyLevel && energyLevel > user.energy_level) {
    const energyUpgradeCosts = [0, 100, 300, 600, 1000, 1500, 2100, 2800];
    cost = energyUpgradeCosts[energyLevel] || 0;

    if (user.coin < cost) return res.status(400).json({ error: 'Không đủ xu nâng cấp năng lượng' });

    updates.energy_level = energyLevel;
  }

  updates.coin = user.coin - cost;

  const { error: updateError } = await supabase
    .from('users')
    .update(updates)
    .eq('id', id);

  if (updateError) {
    return res.status(500).json({ error: 'Lỗi khi cập nhật nâng cấp' });
  }

  return res.status(200).json({ success: true });
}
