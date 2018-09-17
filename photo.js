const canvas = document.getElementById("canvas");
const ctx = canvas.getContext('2d');

let imageCapture = null;
let imageData = null;
let photoCapabilities = null;
let photoSize = {
    width: 0,
    height: 0
};
let stopTransferPhoto = () => {};

// navigator.mediaDevices.getUserMedia({video: {facingMode: { exact: "environment" }}})
navigator.mediaDevices.getUserMedia({video: true})
    .then(mediaStream => {
        const video = document.querySelector('video');
        video.srcObject = mediaStream;
        video.play();
        
        const track = mediaStream.getVideoTracks()[0];
        imageCapture = new ImageCapture(track);

        return imageCapture.getPhotoCapabilities();
    })
    .then(devicePhotoCapabilities => {
        photoCapabilities = devicePhotoCapabilities;
        
        photoSize.width = 24;
        photoSize.height = photoSize.width * devicePhotoCapabilities.imageHeight.min / devicePhotoCapabilities.imageWidth.min | 0;
        
        return imageCapture.getPhotoSettings();
    })
    .catch(error => alert(error));


function takePhoto() {
    imageCapture.takePhoto({imageWidth: photoCapabilities.imageWidth.min, imageHeight: photoCapabilities.imageHeight.min})
        .then(blob => createImageBitmap(blob, 0, 0, photoCapabilities.imageWidth.min, photoCapabilities.imageHeight.min, {resizeQuality: "high"}))
        .then(imageBitmap => {

            canvas.width = photoSize.width;
            canvas.height = photoSize.height;
            canvas.style.width = photoSize.width + "px";
            canvas.style.height = photoSize.height + "px";
            document.body.classList.add("shot");

            ctx.drawImage(imageBitmap, 0, 0, photoSize.width, photoSize.height);

            imageData = ctx.getImageData(0, 0, photoSize.width, photoSize.height);

            grayscaleImage(imageData);

            ctx.putImageData(imageData, 0, 0);

        })
        .catch(error => alert(error));
}

function transferVideo() {
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.connect(gain);
    oscillator.frequency.value = 1400;
    gain.connect(context.destination)
    oscillator.start(0);

    stopTransferPhoto = () => {
        oscillator.frequency.value = 1400;
        oscillator.stop(context.currentTime + 1);
        clearTimeout(timeout);
    }
    const clockDuration = 70; 
    let timeout = null;
    let q = 0;
    let imageMap = convertToHex(imageData);
    const transfer = (point, index, q) => {
        let duration = clockDuration;
        if(point === imageMap.length) {
            stopTransferPhoto();
            return;
        }

        if(index < 2 || index == 3) {
            if(index == 3) index = 0;
            console.log(q, imageMap[point][0], imageMap[point][1], imageMap[point][2][index])
            oscillator.frequency.value = 400 + parseInt(imageMap[point][2][index], 16) * 50;
            index ++;
        } else if(index === 2) {
            point ++;
            index ++;
            if(point % photoSize.width === 0) {
                console.log("new line");
                oscillator.frequency.value =  1250;
            }else{
                console.log("silence");
                oscillator.frequency.value =  1300;
            }
        } else {
            point ++;
            index = 0;
        }
       
        timeout = setTimeout(transfer.bind(null, point, index, ++q), duration);
    };

    timeout = setTimeout(transfer.bind(null, 0, 0, 0), clockDuration * 3);
}

function reset() {
    document.body.classList.remove("shot");
    ctx.fillStyle = `#000`;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    stopTransferPhoto();
}

function grayscaleImage(imageData) {

    for(let i = 0; i < imageData.data.length; i += 4) {
        let brightness =  0.34 * imageData.data[i] 
                        + 0.5 * imageData.data[i + 1] 
                        + 0.16 * imageData.data[i + 2];
        imageData.data[i] = brightness;
        imageData.data[i + 1] = brightness;
        imageData.data[i + 2] = brightness;
    }

}

function convertToHex(imageData) {
    let imageMap = [];
    for(let y = 0; y < imageData.height; y++) {
        for(let x = 0; x < imageData.width; x++) {
            imageMap.push([x, y, getColor(x, y, imageData)]);
        }
    }
    return imageMap;
}

function getColor(x, y, image) {
    const index = y * (image.width * 4) + x * 4;
    return image.data[index].toString(16).padStart(2, '0')
            + image.data[index + 1].toString(16).padStart(2, '0')
            + image.data[index + 2].toString(16).padStart(2, '0');
};


/** Bind UI events */
document.getElementById("shotButton").addEventListener("click", takePhoto);
document.getElementById("transferButton").addEventListener("click", transferVideo);
document.getElementById("resetButton").addEventListener("click", reset);