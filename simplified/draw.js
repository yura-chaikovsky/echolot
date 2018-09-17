const photoSize = {
    width: 600,
    height: 100
};

const clockDuration = 70;

let timeout;

let color = "", x = 0;

let analyser = null, freqs = null, binToFreqsConst = null;

const canvas = document.createElement("canvas");
canvas.width = photoSize.width;
canvas.height = photoSize.height;
document.body.appendChild(canvas);

const ctx = canvas.getContext("2d");
ctx.clearRect(0, 0, canvas.width, canvas.height);


navigator.mediaDevices.getUserMedia({video: false, audio: true})
    .then(stream => {
        const ac = new AudioContext();
        const ms = ac.createMediaStreamSource(stream);
        const lp = ac.createBiquadFilter(); //lowpass to cut noise
        lp.connect(ac.destination);
        
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
    let currentValue = (roundTo50(maxFrq) - 400) / 50;

    if(currentValue >= 0 && currentValue < 16){
        color = "#" + currentValue.toString(16).repeat("6");
    }
    
    if(color){
        requestAnimationFrame((function(color) {
            return () => {
                ctx.fillStyle = color;
                ctx.fillRect(x, 0, 30, 30);
                x += 30;
                console.log(color, x)
            }
        })(color));
    }
    color = "";
}

function roundTo50(float) {
    return Math.round((float | 0) / 50) * 50;
}

function reset() {
    window.location.reload();
}

/** Bind UI events */
document.getElementById("resetButton").addEventListener("click", reset);