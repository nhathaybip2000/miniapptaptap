import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  const { id, username, first_name } = req.body;

  // Kiểm tra xem user đã tồn tại chưa
  const { data: existingUser, error: fetchError } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();

  if (!existingUser) {
    const { error: insertError } = await supabase.from('users').insert([
      {
        id,
        username,
        first_name,
        coins: 0,
        energy: 100,
      },
    ]);

    if (insertError) {
      return res.status(500).json({ error: insertError.message });
    }
  }

  res.status(200).json({ success: true });
}
