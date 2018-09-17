const photoSize = {
    width: 60 * 3,
    height: 45 * 3
};

const clockDuration = 80;

let timeout;

let color = "", x = 0, y = 0;

let analyser = null, freqs = null, binToFreqsConst = null;

const canvas = document.createElement("canvas");
canvas.width = photoSize.width;
canvas.height = photoSize.height;
document.body.appendChild(canvas);

const ctx = canvas.getContext("2d");
reset();


navigator.mediaDevices.getUserMedia({video: false, audio: true})
    .then(stream => {
        const ac = new AudioContext();
        const ms = ac.createMediaStreamSource(stream);
        const filter = ac.createBiquadFilter(); //lowpass to cut noise
               
        analyser = ac.createAnalyser();
        analyser.fftSize = 4096;
        analyser.smoothingTimeConstant = 1e-6;
        ms.connect(analyser);
        
        freqs = new Uint8Array(analyser.frequencyBinCount);
        binToFreqsConst = ac.sampleRate / 2 / analyser.frequencyBinCount;

        listenAndDraw();
    })
    .catch(err => alert(err));


function listenAndDraw() {
    timeout = setTimeout(listenAndDraw, clockDuration);

    analyser.getByteFrequencyData(freqs);

    let maxFrq = freqs.indexOf(Math.max(...freqs)) * binToFreqsConst;
    if(maxFrq > 300 && maxFrq < 1000){
        let currentValue = maxFrq < 600 ? 0 : 1;
        console.log(currentValue, maxFrq);
    }
    
   
}

function round(float) {
    return Math.round((float | 0) / 50) * 50;
}

function reset() {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

/** Bind UI events */
document.getElementById("resetButton").addEventListener("click", reset);