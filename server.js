const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');
const multer = require('multer');
const path = require('path');

dotenv.config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// REGISTRACIJA
app.post('/api/registracija', async (req, res) => {
  const { email, lozinka, ime, prezime } = req.body;
  if (!email || !lozinka || !ime || !prezime) return res.status(400).json({ greska: 'Popuni sva polja' });
  const { data, error } = await supabase.auth.signUp({ email, password: lozinka, options: { data: { ime, prezime } } });
  if (error) return res.status(400).json({ greska: error.message });
  if (data.user) {
    await supabase.from('profiles').update({ ime, prezime }).eq('id', data.user.id);
  }
  res.json({ uspeh: true });
});

// LOGIN
app.post('/api/login', async (req, res) => {
  const { email, lozinka } = req.body;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: lozinka });
  if (error) return res.status(400).json({ greska: 'Pogrešan email ili lozinka' });
  res.json({ uspeh: true, session: data.session, korisnik: data.user });
});

// PROFIL
app.get('/api/profil/:id', async (req, res) => {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', req.params.id).single();
  if (error) return res.status(400).json({ greska: error.message });
  res.json(data);
});

app.put('/api/profil/:id', async (req, res) => {
  const { data, error } = await supabase.from('profiles').update(req.body).eq('id', req.params.id).select();
  if (error) return res.status(400).json({ greska: error.message });
  res.json({ uspeh: true, profil: data[0] });
});

// UPLOAD SLIKE
app.post('/api/slika/:id', upload.single('slika'), async (req, res) => {
  const fajl = req.file;
  const ime = `${req.params.id}/${Date.now()}${path.extname(fajl.originalname)}`;
  const { error } = await supabase.storage.from('avatars').upload(ime, fajl.buffer, { contentType: fajl.mimetype });
  if (error) return res.status(400).json({ greska: error.message });
  const { data } = supabase.storage.from('avatars').getPublicUrl(ime);
  await supabase.from('profiles').update({ avatar_url: data.publicUrl }).eq('id', req.params.id);
  res.json({ uspeh: true, url: data.publicUrl });
});

// OGLASI
app.get('/api/oglasi', async (req, res) => {
  const { grad, drzava, budzet_max } = req.query;
  let query = supabase.from('profiles').select('*').eq('aktivan', true).neq('destinacija_grad', '').neq('ime', '');
  if (grad) query = query.ilike('destinacija_grad', `%${grad}%`);
  if (drzava) query = query.ilike('destinacija_drzava', `%${drzava}%`);
  if (budzet_max) query = query.lte('budzet_max', budzet_max);
  const { data, error } = await query;
  if (error) return res.status(400).json({ greska: error.message });
  res.json(data);
});

// KONVERZACIJE
app.get('/api/konverzacije/:id', async (req, res) => {
  const id = req.params.id;
  const { data, error } = await supabase.from('poruke').select('*')
    .or(`posiljalac_id.eq.${id},primalac_id.eq.${id}`)
    .order('created_at', { ascending: true });
  if (error) return res.status(400).json({ greska: error.message });
  const konvMap = {};
  for (const p of data) {
    const drugiId = p.posiljalac_id === id ? p.primalac_id : p.posiljalac_id;
    if (!konvMap[drugiId]) konvMap[drugiId] = { drugiId, poruke: [] };
    konvMap[drugiId].poruke.push(p);
  }
  const konvList = [];
  for (const [drugiId, konv] of Object.entries(konvMap)) {
    const { data: profil } = await supabase.from('profiles').select('ime,prezime,avatar_url').eq('id', drugiId).single();
    konvList.push({ ...konv, profil });
  }
  res.json(konvList);
});

// PORUKE JEDNE KONVERZACIJE
app.get('/api/poruke/:moj_id/:drugi_id', async (req, res) => {
  const { moj_id, drugi_id } = req.params;
  const { data, error } = await supabase.from('poruke').select('*')
    .or(`and(posiljalac_id.eq.${moj_id},primalac_id.eq.${drugi_id}),and(posiljalac_id.eq.${drugi_id},primalac_id.eq.${moj_id})`)
    .order('created_at', { ascending: true });
  if (error) return res.status(400).json({ greska: error.message });
  res.json(data);
});

// POSALJI PORUKU
app.post('/api/poruka', async (req, res) => {
  const { posiljalac_id, primalac_id, tekst } = req.body;
  if (!tekst?.trim()) return res.status(400).json({ greska: 'Poruka je prazna' });
  const { data, error } = await supabase.from('poruke').insert({ posiljalac_id, primalac_id, tekst }).select();
  if (error) return res.status(400).json({ greska: error.message });
  res.json({ uspeh: true, poruka: data[0] });
});

// ADMIN
app.get('/api/admin/korisnici', async (req, res) => {
  const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
  if (error) return res.status(400).json({ greska: error.message });
  res.json(data);
});

app.put('/api/admin/korisnik/:id', async (req, res) => {
  const { aktivan } = req.body;
  const { data, error } = await supabase.from('profiles').update({ aktivan }).eq('id', req.params.id).select();
  if (error) return res.status(400).json({ greska: error.message });
  res.json({ uspeh: true, profil: data[0] });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Balkans server radi na portu ${PORT}`));
