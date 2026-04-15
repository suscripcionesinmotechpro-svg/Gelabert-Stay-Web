fetch('https://pixabay.com/videos/search/villa%20drone/', {
  headers: {
    'User-Agent': 'Mozilla/5.0'
  }
}).then(r => r.text()).then(t => {
  const matches = t.match(/https:\/\/cdn\.pixabay\.com\/video\/[^"]+\.mp4/g);
  if (matches) {
    console.log(Array.from(new Set(matches)).slice(0, 5));
  } else {
    console.log("No Pixabay videos found");
  }
}).catch(console.error);
