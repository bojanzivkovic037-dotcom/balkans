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

// REGISTRACIJA - koristi signUp da posalje verifikacioni email
app.post('/api/registracija', async (req, res) => {
  const { email, lozinka, ime, prezime } = req.body;
  
  // Registruj korisnika - Supabase ce poslati verifikacioni email
  const { data, error } = await supabase.auth.signUp({
    email, 
    password: lozinka,
    options: {
      data: { ime, prezime }
    }
  });
  
  if (error) return res.status(400).json({ greska: error.message });
  
  // Kreiraj profil
  if (data.user) {
    await supabase.from('profiles').insert({
      id: data.user.id, email, ime, prezime,
      odakle: '', destinacija_grad: '', destinacija_drzava: ''
    });
  }
  
  res.json({ uspeh: true, verifikacija: true, korisnik: data.user });
});

// LOGIN
app.post('/api/login', async (req, res) => {
  const { email, lozinka } = req.body;
  const { data, error } = await supabase.auth.signInWithPassword({
    email, password: lozinka
  });
  if (error) return res.status(400).json({ greska: error.message });
  res.json({ uspeh: true, session: data.session, korisnik: data.user });
});

// UZMI PROFIL
app.get('/api/profil/:id', async (req, res) => {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', req.params.id).single();
  if (error) return res.status(400).json({ greska: error.message });
  res.json(data);
});

// AZURIRAJ PROFIL
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

// PRETRAGA OGLASA
app.get('/api/oglasi', async (req, res) => {
  const { grad, drzava, budzet_max } = req.query;
  let query = supabase.from('profiles').select('*').eq('aktivan', true);
  if (grad) query = query.ilike('destinacija_grad', `%${grad}%`);
  if (drzava) query = query.ilike('destinacija_drzava', `%${drzava}%`);
  if (budzet_max) query = query.lte('budzet_max', budzet_max);
  const { data, error } = await query;
  if (error) return res.json([]);
  res.json(data || []);
});

// POSALJI PORUKU
app.post('/api/poruka', async (req, res) => {
  const { posiljalac_id, primalac_id, tekst } = req.body;
  const { data, error } = await supabase.from('poruke').insert({ posiljalac_id, primalac_id, tekst }).select();
  if (error) return res.status(400).json({ greska: error.message });
  res.json({ uspeh: true, poruka: data[0] });
});

// UZMI PORUKE
app.get('/api/poruke/:korisnik_id', async (req, res) => {
  const id = req.params.korisnik_id;
  const { data, error } = await supabase.from('poruke').select('*')
    .or(`posiljalac_id.eq.${id},primalac_id.eq.${id}`)
    .order('created_at', { ascending: true });
  if (error) return res.json([]);
  res.json(data || []);
});

// ADMIN - svi korisnici
app.get('/api/admin/korisnici', async (req, res) => {
  const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
  if (error) return res.status(400).json({ greska: error.message });
  res.json(data);
});

// ADMIN - aktiviraj ili blokiraj
app.put('/api/admin/korisnik/:id', async (req, res) => {
  const { aktivan } = req.body;
  const { data, error } = await supabase.from('profiles').update({ aktivan }).eq('id', req.params.id).select();
  if (error) return res.status(400).json({ greska: error.message });
  res.json({ uspeh: true, profil: data[0] });
});


// GOOGLE OAUTH
app.post('/api/google-auth', async (req, res) => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: 'https://balkansapp.com'
    }
  });
  if (error) return res.status(400).json({ greska: error.message });
  res.json({ data });
});

// GOOGLE CALLBACK - handle session from URL
app.post('/api/google-session', async (req, res) => {
  const { access_token, refresh_token } = req.body;
  const { data, error } = await supabase.auth.setSession({ access_token, refresh_token });
  if (error) return res.status(400).json({ greska: error.message });
  
  // Kreiraj profil ako ne postoji
  const user = data.user;
  if (user) {
    const { data: existing } = await supabase.from('profiles').select('id').eq('id', user.id).single();
    if (!existing) {
      const ime = user.user_metadata?.full_name?.split(' ')[0] || 'Korisnik';
      const prezime = user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '';
      await supabase.from('profiles').insert({
        id: user.id,
        email: user.email,
        ime, prezime,
        odakle: '', destinacija_grad: '', destinacija_drzava: '',
        avatar_url: user.user_metadata?.avatar_url || null
      });
    }
  }
  
  res.json({ uspeh: true, session: data.session, korisnik: data.user });
});

// HEALTH CHECK
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Balkans server radi na portu ${PORT}`));
