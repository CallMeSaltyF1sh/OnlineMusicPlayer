function $(s){
    return document.querySelectorAll(s);
}
let lis = $('#list li');
let size = 64;
let Dots = [];
let height,width;
let canvas = document.createElement('canvas');
let ctx = canvas.getContext('2d');
let box = $('#box')[0];
box.appendChild(canvas);
let line;

/**
 * 实例化MusicVisualizer
 */
let mv = new MusicVisualizer({
    size: size,
    visualizer: draw
});

/**
 * 获取曲目列表-播放
 */
for(let i=0,n=lis.length;i<n;i++){
    lis[i].onclick = function(){
        for(let j=0;j<n;j++){
            lis[j].className = '';
        }
        this.className = 'selected';
        //mv.load('/media/'+this.title);
        mv.play('/media/'+this.title);
    }
}

$('#volume')[0].onmousemove = function(){
    mv.changeVolume(this.value/this.max);
}

/*
let xhr = new XMLHttpRequest();
let ac = new (window.AudioContext || window.webkitAudioContext)();
let gainNode = ac[ac.createGain?'createGain':'createGainNode']();
gainNode.connect(ac.destination);

let analyser = ac.createAnalyser();

analyser.fftSize = size * 2;
analyser.connect(gainNode);

let source = null;
let count = 0;

function load(url){
    let num = ++count;
    if(count>1000){
        count = 0;
    }
    source && source[source.stop ? 'stop' : 'noteOff'](0);
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
*/


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


/**
 * 画在canvas上
 */
function draw(arr){
    ctx.clearRect(0,0,width,height);
    let w = width/size;
    let capW = w * 0.6;
    let capH = capW > 6 ? 6 : capW;
    ctx.fillStyle = line;

    for(let i=0;i<size;i++){
        let o = Dots[i];
        if(draw.type == 'column'){
            let h = arr[i]/256 * height;
            ctx.fillRect(w*i, height-h,capW,h);
            ctx.fillRect(w*i,height-o.cap-capH,capW,capH);
            o.cap--;
            if(o.cap<0){
                o.cap = 0;
            }
            if(h > 0 && o.cap < h + 40){
                o.cap = ((h + 40) > (height-capH)) ? (height-capH) : (h + 40);
            }
        }else if(draw.type == 'dot'){
            ctx.beginPath();
            
            let r = 10 + arr[i]/256 * (height>width ? width : height)/10;
            ctx.arc(o.x,o.y,r,0,Math.PI*2,true);
            //ctx.strokeStyle = o.color;
            //ctx.stroke();
            let g = ctx.createRadialGradient(o.x,o.y,0,o.x,o.y,r);
            g.addColorStop(0,o.color);
            g.addColorStop(1,o.color);
            ctx.fillStyle = g;
            ctx.fill();
            o.x += o.dx;
            o.x = o.x > width ? 0 : o.x;
            o.y += o.dy;
            o.y = o.y > height ? 0 : o.y;
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
        let color = 'rgba('+random(0,255)+','+random(0,255)+','+random(0,255)+',0.6)';
        Dots.push({
            x: x,
            y: y,
            dx: random(1,2),
            dy: random(0,1),
            color: color,
            cap: 0   //柱状图上的小帽距离最低端的距离
        });
    }
}

/**
 * 曲目上传
 */
/*
$('#upload').onchange = function upload(){
    let file = this.files[0];
    let fr = new FileReader();

    fr.onload = function(e){
        mv.play(e.target.result);
    }
    fr.readAsArrayBuffer(file);
    
}
*/