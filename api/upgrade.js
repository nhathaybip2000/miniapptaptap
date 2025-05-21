import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Giá nâng cấp theo cấp độ (index = cấp hiện tại)
const tapUpgradeCost = [0, 1000, 2000, 4000, 8000, 15000, 30000]; // từ cấp 1→2, 2→3,...
const energyUpgradeCost = [0, 1000, 2000, 4000, 8000, 15000, 30000];

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { id, type } = req.body;

  if (!id || !['tap', 'energy'].includes(type)) {
    return res.status(400).json({ error: 'Dữ liệu không hợp lệ' });
  }

  const { data: user, error: getError } = await supabase
    .from('users')
    .select('coin, tap_level, energy_level')
    .eq('id', id)
    .single();

  if (getError || !user) {
    return res.status(404).json({ error: 'Không tìm thấy người dùng' });
  }

  let level = type === 'tap' ? user.tap_level || 1 : user.energy_level || 1;

  if (level >= 7) {
    return res.status(400).json({ error: 'Đã đạt cấp tối đa' });
  }

  const cost = type === 'tap' ? tapUpgradeCost[level] : energyUpgradeCost[level];

  if (user.coin < cost) {
    return res.status(400).json({ error: 'Không đủ xu để nâng cấp' });
  }

  const updates = {
    coin: user.coin - cost
  };
  if (type === 'tap') updates.tap_level = level + 1;
  else updates.energy_level = level + 1;

  const { error: updateError } = await supabase
    .from('users')
    .update(updates)
    .eq('id', id);

  if (updateError) {
    return res.status(500).json({ error: 'Lỗi khi cập nhật dữ liệu' });
  }

  return res.status(200).json({
    coin: user.coin - cost,
    new_level: level + 1,
    type
  });
}
