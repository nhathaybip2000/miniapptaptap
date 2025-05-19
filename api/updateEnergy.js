const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

module.exports = async (req, res) => {
  const { user_id, energy, coin } = req.body;

  const { error } = await supabase
    .from('users')
    .update({ energy, coin })
    .eq('user_id', user_id);

  if (error) return res.status(500).json({ error: error.message });

  res.status(200).json({ message: 'Updated successfully' });
};
