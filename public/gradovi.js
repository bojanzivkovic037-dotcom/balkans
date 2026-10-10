// Svi gradovi po drzavama - jedan izvor za filtere, formu oglasa i zastavice
const EVROPA = [
  { drzava: 'Srbija', flag: '🇷🇸', gradovi: ['Beograd', 'Novi Sad', 'Niš', 'Kragujevac', 'Subotica', 'Čačak', 'Kraljevo', 'Zrenjanin', 'Pančevo', 'Novi Pazar'] },
  { drzava: 'Bosna i Hercegovina', flag: '🇧🇦', gradovi: ['Sarajevo', 'Banja Luka', 'Tuzla', 'Mostar', 'Zenica', 'Bijeljina'] },
  { drzava: 'Hrvatska', flag: '🇭🇷', gradovi: ['Zagreb', 'Split', 'Rijeka', 'Osijek', 'Zadar', 'Pula', 'Dubrovnik'] },
  { drzava: 'Crna Gora', flag: '🇲🇪', gradovi: ['Podgorica', 'Budva', 'Nikšić', 'Bar', 'Herceg Novi', 'Kotor'] },
  { drzava: 'Severna Makedonija', flag: '🇲🇰', gradovi: ['Skoplje', 'Bitolj', 'Ohrid'] },
  { drzava: 'Slovenija', flag: '🇸🇮', gradovi: ['Ljubljana', 'Maribor', 'Koper', 'Kranj'] },
  { drzava: 'Albanija', flag: '🇦🇱', gradovi: ['Tirana', 'Drač'] },
  { drzava: 'Bugarska', flag: '🇧🇬', gradovi: ['Sofija', 'Plovdiv', 'Varna'] },
  { drzava: 'Rumunija', flag: '🇷🇴', gradovi: ['Bukurešt', 'Temišvar', 'Kluž'] },
  { drzava: 'Grčka', flag: '🇬🇷', gradovi: ['Atina', 'Solun'] },
  { drzava: 'Austrija', flag: '🇦🇹', gradovi: ['Beč', 'Grac', 'Linc', 'Salcburg', 'Insbruk', 'Klagenfurt'] },
  { drzava: 'Nemačka', flag: '🇩🇪', gradovi: ['Minhen', 'Berlin', 'Hamburg', 'Frankfurt', 'Štutgart', 'Diseldorf', 'Keln', 'Dortmund', 'Lajpcig', 'Bremen', 'Nirnberg', 'Hanover', 'Esen', 'Drezden'] },
  { drzava: 'Švajcarska', flag: '🇨🇭', gradovi: ['Cirih', 'Ženeva', 'Bazel', 'Bern', 'Lozana', 'Lucern'] },
  { drzava: 'Holandija', flag: '🇳🇱', gradovi: ['Amsterdam', 'Rotterdam', 'Hag', 'Utreht', 'Ajndhoven'] },
  { drzava: 'Belgija', flag: '🇧🇪', gradovi: ['Brisel', 'Antverpen', 'Gent'] },
  { drzava: 'Luksemburg', flag: '🇱🇺', gradovi: ['Luksemburg'] },
  { drzava: 'Francuska', flag: '🇫🇷', gradovi: ['Pariz', 'Lion', 'Marselj', 'Nica', 'Tuluz', 'Strazbur'] },
  { drzava: 'Italija', flag: '🇮🇹', gradovi: ['Milano', 'Rim', 'Turin', 'Bolonja', 'Firenca', 'Napulj', 'Venecija', 'Trst'] },
  { drzava: 'Španija', flag: '🇪🇸', gradovi: ['Madrid', 'Barselona', 'Valensija', 'Sevilja', 'Malaga'] },
  { drzava: 'Portugalija', flag: '🇵🇹', gradovi: ['Lisabon', 'Porto'] },
  { drzava: 'Malta', flag: '🇲🇹', gradovi: ['Valeta'] },
  { drzava: 'UK', flag: '🇬🇧', gradovi: ['London', 'Mančester', 'Birmingham', 'Edinburg', 'Glazgov'] },
  { drzava: 'Irska', flag: '🇮🇪', gradovi: ['Dublin', 'Kork'] },
  { drzava: 'Danska', flag: '🇩🇰', gradovi: ['Kopenhagen', 'Orhus'] },
  { drzava: 'Švedska', flag: '🇸🇪', gradovi: ['Stokholm', 'Geteborg', 'Malme'] },
  { drzava: 'Norveška', flag: '🇳🇴', gradovi: ['Oslo', 'Bergen'] },
  { drzava: 'Finska', flag: '🇫🇮', gradovi: ['Helsinki'] },
  { drzava: 'Island', flag: '🇮🇸', gradovi: ['Rejkjavik'] },
  { drzava: 'Češka', flag: '🇨🇿', gradovi: ['Prag', 'Brno'] },
  { drzava: 'Slovačka', flag: '🇸🇰', gradovi: ['Bratislava', 'Košice'] },
  { drzava: 'Mađarska', flag: '🇭🇺', gradovi: ['Budimpešta', 'Segedin'] },
  { drzava: 'Poljska', flag: '🇵🇱', gradovi: ['Varšava', 'Krakov', 'Vroclav', 'Gdanjsk'] },
  { drzava: 'Litvanija', flag: '🇱🇹', gradovi: ['Viljnus'] },
  { drzava: 'Letonija', flag: '🇱🇻', gradovi: ['Riga'] },
  { drzava: 'Estonija', flag: '🇪🇪', gradovi: ['Talin'] },
  { drzava: 'Kipar', flag: '🇨🇾', gradovi: ['Nikozija', 'Limasol'] },
  { drzava: 'Turska', flag: '🇹🇷', gradovi: ['Istanbul'] },
];

function popuniGradove(select, { saDrzavom = false } = {}) {
  EVROPA.forEach(({ drzava, flag, gradovi }) => {
    const grupa = document.createElement('optgroup');
    grupa.label = `${flag} ${drzava}`;
    gradovi.forEach(grad => {
      const o = document.createElement('option');
      o.textContent = grad;
      o.value = saDrzavom ? `${grad}|${drzava}` : grad;
      grupa.appendChild(o);
    });
    select.appendChild(grupa);
  });
}

function popuniDrzave(select) {
  EVROPA.forEach(({ drzava, flag }) => {
    const o = document.createElement('option');
    o.value = drzava;
    o.textContent = `${flag} ${drzava}`;
    select.appendChild(o);
  });
}
