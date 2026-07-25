const tracks = [
    {title: 'Music soundtrack', url: 'https://musicfun.it-incubator.app/api/samurai-way-soundtrack.mp3'},
    {title: 'Music soundtrack instrumental', url: 'https://musicfun.it-incubator.app/api/samurai-way-soundtrack-instrumental.mp3'}
]


// Add tracks
const rootEl = document.getElementById('root');
const headerEl1 = document.createElement('h1')
headerEl1.append('Music Player');
rootEl.append(headerEl1);

const tracksEl = document.createElement('ul')
tracks.forEach((track) => {
    const trackEl = document.createElement('li');
    const trackTitleEl = document.createElement('div');
    trackTitleEl.append(track.title);
    trackEl.append(trackTitleEl);

    const trackPlayerEl = document.createElement('audio');
    trackPlayerEl.controls = true;
    trackPlayerEl.src = track.url;
    trackEl.append(trackPlayerEl);

    tracksEl.append(trackEl);
})

rootEl.append(tracksEl);