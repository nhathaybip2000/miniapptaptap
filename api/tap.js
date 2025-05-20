import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Thiếu ID người dùng' });
  }

  const { data: user, error: getError } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();

  if (getError || !user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (user.energy <= 0) {
    return res.status(400).json({ error: 'Hết năng lượng' });
  }

  const newCoin = user.coin + 1;
  const newEnergy = user.energy - 1;

  const { error: updateError } = await supabase
    .from('users')
    .update({ coin: newCoin, energy: newEnergy })
    .eq('id', id);

  if (updateError) {
    return res.status(500).json({ error: updateError.message });
  }

  return res.status(200).json({ coin: newCoin, energy: newEnergy });
}
