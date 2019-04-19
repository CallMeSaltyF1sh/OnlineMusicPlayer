function MusicVisualizer(obj) {
    this.source = null;
    this.count = 0;
    this.size = obj.size || 64;
    this.duration = 0;
    this.currentMin = 0;
    this.currentSec = 0;
    this.minutes = 0;
    this.seconds = 0;

    this.audio = new Audio();
    this.audioSource = MusicVisualizer.ac.createMediaElementSource(this.audio);

    this.gainNode = MusicVisualizer.ac[MusicVisualizer.ac.createGain ? 'createGain' : 'createGainNode']();
    this.gainNode.connect(MusicVisualizer.ac.destination);

    this.analyser = MusicVisualizer.ac.createAnalyser();
    this.size = obj.size;
    this.analyser.fftSize = this.size * 2;
    this.analyser.connect(this.gainNode);

    this.xhr = new XMLHttpRequest();
    this.visualizer = obj.visualizer;
    this.visualize();
}

MusicVisualizer.ac = new (window.AudioContext || window.webkitAudioContext)();

MusicVisualizer.prototype.load = function load(url, func) {
    let self = this;

    this.xhr.abort();
    this.xhr.open('get', url);
    this.xhr.responseType = 'arraybuffer';
    this.xhr.onload = function () {
        func(self.xhr.response);
    }
    this.xhr.send();
}

MusicVisualizer.prototype.decode = function decode(arraybuffer, func) {
    MusicVisualizer.ac.decodeAudioData(arraybuffer, function (buffer) {
        func(buffer);
    }, function (err) {
        console.log(err);
        let pause = document.getElementById('pause');
        if(pause.classList.contains('fa-pause')){
            pause.classList.remove('fa-pause');
            pause.classList.add('fa-play');
        }
        
    });
}


MusicVisualizer.prototype.play = function play(path) {
    let self = this;
    let num = ++this.count;
    if (this.count > 1000) this.count = 0;

    let pause = document.getElementById('pause');
    if(pause.classList.contains('fa-play')){
        pause.classList.remove('fa-play');
        pause.classList.add('fa-pause');
        if(this.source){
            this.resume();
        }
    }

    this.source && this.stop();

    if (path instanceof ArrayBuffer) {
        self.decode(path, function (buffer) {
            let bufferSourceNode = MusicVisualizer.ac.createBufferSource();
            bufferSourceNode.buffer = buffer;
            bufferSourceNode.loop = true;
            bufferSourceNode.connect(self.analyser);
            //MusicVisualizer.play(self);
            bufferSourceNode[bufferSourceNode.start ? 'start' : 'noteOn'](0);
            self.duration = Math.round(bufferSourceNode.buffer.duration);
            self.minutes = parseInt(self.duration / 60);
            self.seconds = self.duration % 60;
            //console.log(self.duration);
            console.log(self.minutes + ':' + self.seconds);
            self.source = bufferSourceNode;
        });
    }
    if (typeof (path) === 'string') {
        this.load(path, function (arraybuffer) {
            if (num != self.count) return;
            self.decode(arraybuffer, function (buffer) {
                if (num != self.count) return;
                let bufferSource = MusicVisualizer.ac.createBufferSource();
                bufferSource.buffer = buffer;
                bufferSource.loop = true;
                bufferSource.connect(self.analyser);
                bufferSource[bufferSource.start ? 'start' : 'noteOn'](0);
                self.duration = Math.round(bufferSource.buffer.duration);
                self.minutes = parseInt(self.duration / 60);
                self.seconds = self.duration % 60;
                //console.log(self.duration);
                console.log(self.minutes + ':' + self.seconds);
                self.source = bufferSource;
            });
        });
    }


}

MusicVisualizer.prototype.stop = function stop() {
    this.source[this.source.stop ? 'stop' : 'noteOff'](0);
}

MusicVisualizer.prototype.resume = function resume(){
    if(this.source){
        MusicVisualizer.ac.resume();
    }
   
}

MusicVisualizer.prototype.suspend = function suspend(){
    if(this.source){
        MusicVisualizer.ac.suspend();
    }
    
}

MusicVisualizer.prototype.changeVolume = function changeVolume(percent) {
    this.gainNode.gain.value = percent * percent;
}

MusicVisualizer.prototype.visualize = function visualize() {
    let arr = new Uint8Array(this.analyser.frequencyBinCount);
    requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame;
    let self = this;

    function v() {
        self.analyser.getByteFrequencyData(arr);
        self.visualizer(arr);
        requestAnimationFrame(v);
    }

    requestAnimationFrame(v);
}

