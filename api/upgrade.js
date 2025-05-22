import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { id, tapLevel, energyLevel } = req.body;

  if (!id) return res.status(400).json({ error: 'Thiếu ID người dùng' });

  // Lấy thông tin người dùng
  const { data: user, error: getError } = await supabase
    .from('users')
    .select('coin, tap_level, energy_level')
    .eq('id', id)
    .single();

  if (getError || !user) {
    return res.status(404).json({ error: 'Không tìm thấy người dùng' });
  }

  const tapUpgradeCosts = [0, 100, 200, 400, 700, 1000, 1500, 2000];
  const energyUpgradeCosts = [0, 100, 300, 600, 1000, 1500, 2100, 2800];
  const maxLevel = 7;

  let totalCost = 0;
  const updates = {};

  // Xử lý nâng cấp tap
  if (tapLevel && tapLevel > user.tap_level && tapLevel <= maxLevel) {
    const tapCost = tapUpgradeCosts[tapLevel] || 0;
    totalCost += tapCost;
    updates.tap_level = tapLevel;
  }

  // Xử lý nâng cấp năng lượng
  if (energyLevel && energyLevel > user.energy_level && energyLevel <= maxLevel) {
    const energyCost = energyUpgradeCosts[energyLevel] || 0;
    totalCost += energyCost;
    updates.energy_level = energyLevel;
  }

  if (totalCost === 0) {
    return res.status(400).json({ error: 'Không có nâng cấp hợp lệ' });
  }

  if (user.coin < totalCost) {
    return res.status(400).json({ error: 'Không đủ xu để nâng cấp' });
  }

  updates.coin = user.coin - totalCost;

  // Cập nhật vào database
  const { error: updateError } = await supabase
    .from('users')
    .update(updates)
    .eq('id', id);

  if (updateError) {
    return res.status(500).json({ error: 'Lỗi khi cập nhật nâng cấp' });
  }

  // Trả về dữ liệu mới
  const { data: updatedUser, error: fetchError } = await supabase
    .from('users')
    .select('coin, tap_level, energy_level')
    .eq('id', id)
    .single();

  if (fetchError || !updatedUser) {
    return res.status(500).json({ error: 'Lỗi khi tải lại thông tin người dùng sau nâng cấp' });
  }

  return res.status(200).json({ success: true, user: updatedUser });
}
