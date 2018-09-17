
navigator.mediaDevices.getUserMedia({video: false, audio: true})
    .then(stream => {
        const ac = new AudioContext();
        const ms = ac.createMediaStreamSource(stream);
        const analyser = ac.createAnalyser();
        ms.connect(analyser);
        //analyser.connect(ac.destination); // to speaker

        const lp = ac.createBiquadFilter(); //lowpass to cut noise
        lp.connect(ac.destination);
        
        const canvas = document.createElement("canvas");
        canvas.width = 800;
        canvas.height = 600;
        document.body.appendChild(canvas);
        
        const ctx = canvas.getContext("2d");
    
        const tds = new Uint8Array(analyser.fftSize);
        const freqs = new Uint8Array(analyser.frequencyBinCount);
        
        (function draw() {
            requestAnimationFrame(_ => {
                analyser.getByteFrequencyData(freqs);
                analyser.getByteTimeDomainData(tds);
                
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.save();
                ctx.scale(canvas.width / analyser.fftSize, canvas.height / 640);
                const key = freqs.reduce((r, v, i) => r.v < v ? {v, i} : r, {v: 0, i: 0}).i;

                ctx.fillStyle = `hsl(${indexHue(key)}, 50%, 50%)`;
                for (let i = 0; i < analyser.fftSize; i++) {
                    const v = tds[i];
                    ctx.fillRect(i, 256 - v, 1, v); 
                }
                
                for (let i = 0; i < analyser.frequencyBinCount / 10; i++) {
                    const v = freqs[i];
                    ctx.fillStyle = `hsl(${indexHue(i)}, 50%, 50%)`;
                    ctx.fillRect(i * 20, 612 - v, 20, v); 
                }

                ctx.font = `24px serif`;
                ctx.fillStyle = `#fff`;
                for (let i = 0; i < analyser.frequencyBinCount / 10; i+=10) {
                    const freq = roundTo50(i * ac.sampleRate / 2 / analyser.frequencyBinCount);
                    ctx.fillText(freq, i*20, 632);
                }
                
                ctx.restore();
                draw();
            });
        })();
    })
    .catch(err => alert(err));

function indexHue(index) {
    return (Math.log2(index) % 1) * 360; // coloring by octave 
}

var roundTo50 = function(float) {
    return Math.round((float | 0) / 50) * 50;
}