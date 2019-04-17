function $(s){
    return document.querySelectorAll(s);
}

let lis = $('#list li');

for(let i=0,n=lis.length;i<n;i++){
    lis[i].onclick = function(){
        for(let j=0;j<n;j++){
            lis[j].className = '';
        }
        this.className = 'selected';
        load('/media/'+this.title);
    }
}

let xhr = new XMLHttpRequest();
let ac = new (window.AudioContext || window.webkitAudioContext)();
let gainNode = ac[ac.createGain?'createGain':'createGainNode']();
gainNode.connect(ac.destination);

let analyser = ac.createAnalyser();
let size = 128;
analyser.fftSize = size * 2;
analyser.connect(gainNode);

let Dots = [];

let source = null;
let count = 0;

function load(url){
    let num = ++count;
    if(count>1000){
        count = 0;
    }
    source && source[source.stop ? 'stop' : 'noteOff']();
    xhr.abort();
    xhr.open('get',url);
    xhr.responseType = 'arraybuffer';
    xhr.onload = function(){
        //console.log(xhr.response);
        if(num != count) return;
        ac.decodeAudioData(xhr.response, function(buffer){
            if(num != count) return;
            let bufferSource = ac.createBufferSource();
            bufferSource.buffer = buffer;
            bufferSource.connect(analyser);
            bufferSource[bufferSource.start?'start':'noteOn'](0);
            source = bufferSource;
        },function(err){
            console.log(err);
        });
    }
    xhr.send();
}

function changeVolume(percent){
    gainNode.gain.value = percent * percent;
}

$('#volume')[0].onmousemove = function(){
    changeVolume(this.value/this.max);
}

function visualizer(){
    let arr = new Uint8Array(analyser.frequencyBinCount);
    requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame;

    function v(){
        analyser.getByteFrequencyData(arr);
        draw(arr);
        requestAnimationFrame(v);
    }
    requestAnimationFrame(v);
}
visualizer();

let height,width;
let canvas = document.createElement('canvas')
let ctx = canvas.getContext('2d');
let box = $('#box')[0];
box.appendChild(canvas);

let line;
function resize(){
    height = box.clientHeight;
    width = box.clientWidth;
    canvas.height = height;
    canvas.width = width;
    line = ctx.createLinearGradient(0,0,0,height);
    line.addColorStop(0,'red');
    line.addColorStop(0.5,'yellow');
    line.addColorStop(1,'green');
    //ctx.fillStyle = line;
    getDots();
}
resize();
window.onresize = resize;

function draw(arr){
    ctx.clearRect(0,0,width,height);
    let w = width/size;
    ctx.fillStyle = line;

    for(let i=0;i<size;i++){
        if(draw.type == 'column'){
            let h = arr[i]/256 * height;
            ctx.fillRect(w*i, height-h,w*0.6,h);
        }else if(draw.type == 'dot'){
            ctx.beginPath();
            var o = Dots[i];
            var r = arr[i]/256 * 50;
            ctx.arc(o.x,o.y,r,0,Math.PI*2,true);
            //ctx.strokeStyle = o.color;
            //ctx.stroke();
            let g = ctx.createRadialGradient(o.x,o.y,0,o.x,o.y,r);
            g.addColorStop(0,'#fff');
            g.addColorStop(1,o.color);
            ctx.fillStyle = g;
            ctx.fill();
        }
        
    }
}
draw.type = 'column';

/*顶部切换样式*/
let types = $('#type li');
for(let i=0,n=types.length;i<n;i++){
    types[i].onclick = function(){
        for(let j=0;j<n;j++){
            types[j].className = '';
        }
        this.className = 'selected';
        draw.type = this.getAttribute('data-type');
    }
} 


/**
 * 点状可视化
 */


function random(m,n){
    return Math.round(Math.random()*(n-m)+m);
}
function getDots(){
    Dots = [];
    for(let i=0;i<size;i++){
        let x = random(0,width);
        let y = random(0,height);
        let color = 'rgb('+random(0,255)+','+random(0,255)+','+random(0,255)+')';
        Dots.push({
            x: x,
            y: y,
            color: color
        });
    }
}