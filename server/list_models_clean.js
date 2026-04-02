import https from 'https';

const apiKey = 'AIzaSyBL9LR8fPbY-ehOwr7HLaBuKnndYMBD-m8';
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

https.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      if (json.models) {
        json.models.forEach(m => {
          console.log(`${m.name} : ${m.displayName}`);
        });
      } else {
        console.log('No models found or error in response:', JSON.stringify(json, null, 2));
      }
    } catch (e) {
      console.error('Error parsing JSON:', e);
    }
  });
}).on('error', (err) => {
  console.error('Error:', err.message);
});
