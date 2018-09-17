const photoSize = {
    width: 24,
    height: 18
};

const clockDuration = 68;

let timeout;

let color = "", x = 0, y = 0, q = 0;

let analyser = null, freqs = null, binToFreqsConst = null;

const canvas = document.createElement("canvas");
canvas.width = photoSize.width * 4;
canvas.height = photoSize.height * 4;
document.body.appendChild(canvas);

const ctx = canvas.getContext("2d");
ctx.fillStyle = "#ffffff";
ctx.fillRect(0, 0, canvas.width, canvas.height);
ctx.scale(4, 4);


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


let newLineFalg = false;
let previousColor = "";
function listenAndDraw() {
    timeout = setTimeout(listenAndDraw, clockDuration);

    analyser.getByteFrequencyData(freqs);
    let maxFrq = freqs.indexOf(Math.max(...freqs)) * binToFreqsConst;
    let currentValue = (round(maxFrq) - 400) / 50;

    if(currentValue === 22) { 
        q = -1;
        x = 0;
        y = 0;
        color = ""; 
        console.log("init", currentValue);
        return;
    }

    q++;
    if(currentValue === 18) {
        if(color.length > 0){
            color = previousColor;
        } else {
            console.log("silence");
            return;
        }        
    }
    if(currentValue === 17) { 
        if(!newLineFalg){
            color = "";
            y += 1;
            x = 0;
            newLineFalg = true;
            console.log("new line");
        }
        return;
    }

    newLineFalg = false;
    if(currentValue >= 0 && currentValue < 16){
        color += currentValue.toString(16);
    }
    
    if(currentValue >=0) console.log(q, x, y, currentValue.toString(16));

    if(color.length === 2) {
        previousColor = color;
        requestAnimationFrame((function(color) {
            return () => {
                if(x > photoSize.width + 4) {
                    x = 0;
                    y += 1;
                }
                ctx.fillStyle = "#" + color.repeat(3);
                ctx.fillRect(x, y, 1, 1);
                x += 1;
            }
        })(color));

        color = "";
    }
}

function round(float) {
    return Math.round((float | 0) / 50) * 50;
}

function reset() {
    window.location.reload();
}

/** Bind UI events */
document.getElementById("resetButton").addEventListener("click", reset);