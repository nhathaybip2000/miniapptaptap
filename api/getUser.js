import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
  const { id, first_name, username } = req.body;

  const { data: existing } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();

  if (existing) return res.status(200).json(existing);

  const { data, error } = await supabase
    .from('users')
    .insert([{ id, first_name, username }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  res.status(200).json(data);
}
