const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

module.exports = async (req, res) => {
  const { user_id, amount } = req.body;

  const { data, error } = await supabase
    .from('users')
    .select('coin')
    .eq('user_id', user_id)
    .single();

  if (error) return res.status(500).json({ error: error.message });
  if (data.coin < amount) return res.status(400).json({ error: 'Không đủ xu' });

  await supabase
    .from('users')
    .update({ coin: data.coin - amount })
    .eq('user_id', user_id);

  res.status(200).json({ message: 'Đã rút thành công' });
};
