function $(s) {
    return document.querySelectorAll(s);
}
let lis = $('#list li');
let size = 64;
let Dots = [];
let height, width;   //canvas宽高
let canvas = document.createElement('canvas');
let ctx = canvas.getContext('2d');
let box = $('#box')[0];
box.appendChild(canvas);
let line;
let newSongs = [];  //存放本地上传的歌曲
let newSongsNum = 0;
let state = 'PAUSE';

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
for (let i = 0, n = lis.length; i < n; i++) {
    lis[i].onclick = function () {
        let list = $('#list li');
        for (let j = 0, num = list.length; j < num; j++) {
            list[j].className = '';
        }
        this.className = 'selected';
        //mv.load('/media/'+this.title);
        mv.play('/media/' + this.title);
    }
}

$('#volume')[0].onmousemove = function () {
    mv.changeVolume(this.value / this.max);
}

$('#pause')[0].onclick = function(){
    if(this.classList.contains('fa-pause')){
        this.classList.remove('fa-pause');
        this.classList.add('fa-play');
        mv.suspend();
    }else if(this.classList.contains('fa-play')){
        this.classList.remove('fa-play');
        this.classList.add('fa-pause');
        mv.resume();
    }
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


function resize() {
    height = box.clientHeight;
    width = box.clientWidth;
    canvas.height = height;
    canvas.width = width;
    line = ctx.createLinearGradient(0, 0, 0, height);
    line.addColorStop(0, 'red');
    line.addColorStop(0.5, 'yellow');
    line.addColorStop(1, 'green');
    //ctx.fillStyle = line;
    getDots();
}
resize();
window.onresize = resize;


/**
 * 画在canvas上，使音乐可视化
 */
function draw(arr) {
    ctx.clearRect(0, 0, width, height);
    let w = width / size;
    let capW = w * 0.6;
    let capH = capW > 6 ? 6 : capW;
    ctx.fillStyle = line;

    for (let i = 0; i < size; i++) {
        let o = Dots[i];
        if (draw.type == 'column') {
            let h = arr[i] / 256 * height;
            /**
             * ctx.fillRect(x,y,width,height);
             * x,y分别为左上角的横纵坐标
             */
            ctx.fillRect(w * i, height - h, capW, h);   //画columns
            ctx.fillRect(w * i, height - o.cap - capH, capW, capH);    //画小帽
            o.cap--;
            if (o.cap < 0) {
                o.cap = 0;
            }
            //如果小帽离column距离大于40px则匀速下落，否则设置其高度为h+40;
            //并且为了保证小帽不会超出canvas的高度，增加(h + 40) > (height - capH)这个判断
            if (h > 0 && o.cap < h + 40) {
                o.cap = ((h + 40) > (height - capH)) ? (height - capH) : (h + 40);
            }
        } else if (draw.type == 'dot') {
            ctx.beginPath();   //重置当前的路径

            let r = 10 + arr[i] / 256 * (height > width ? width : height) / 10;  //保证半径最小为10，大小随音频频率变化而变化
            /**
             * context.arc(x,y,r,sAngle,eAngle,counterclockwise);
             */
            ctx.arc(o.x, o.y, r, 0, Math.PI * 2, true);
            //ctx.strokeStyle = o.color;
            //ctx.stroke();
            let g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, r);
            g.addColorStop(0, o.color);
            g.addColorStop(1, o.color);
            ctx.fillStyle = g;
            ctx.fill();
            o.x += o.dx;
            o.x = o.x > width ? 0 : o.x;  //dot的x大于canvas宽度则置零
            o.y += o.dy;
            o.y = o.y > height ? 0 : o.y;
        }else if(draw.type == 'star') {
            let r = 5 + arr[i]/256 * (height>width?width:height)/60;
            let R = 8 + arr[i]/256 * (height>width?width:height)/30;
            
            drawStar(ctx,r,R,o.x,o.y,o.rot);
            /*
            if(o.direction==0){
                o.x += o.dx;
                o.x = o.x>width ? 0:o.x;
            }else{
                o.x -= o.dx;
                o.x = o.x<0 ? width:o.x;
            }
            */
            o.y -= o.dy;
            o.y = o.y < 0 ? height : o.y;  //dot的x大于canvas宽度则置零
        }

    }
}

function drawStar(ctx,r,R,x,y,rot){
    ctx.beginPath();
    for(let i=0;i<5;i++){
        ctx.lineTo(Math.cos((18+i*72-rot)/180 * Math.PI)*R + x,-Math.sin((18+i*72-rot)/180*Math.PI)*R+y);
        ctx.lineTo(Math.cos((54+i*72-rot)/180 * Math.PI)*r + x,-Math.sin((54+i*72-rot)/180*Math.PI)*r+y);
    }
    ctx.closePath();
    let g = ctx.createRadialGradient(x, y, 0, x, y, R);
    g.addColorStop(0, '#eee');
    g.addColorStop(1, 'rgba(229,208,3,1)');
    ctx.fillStyle = g;
    ctx.fill();
}


draw.type = 'column';
/*顶部切换样式*/
let types = $('#type li');
for (let i = 0, n = types.length; i < n; i++) {
    types[i].onclick = function () {
        for (let j = 0; j < n; j++) {
            types[j].className = '';
        }
        this.className = 'selected';
        draw.type = this.getAttribute('data-type');
    }
}


/**
 * 点状可视化
 */
function random(m, n) {
    return Math.round(Math.random() * (n - m) + m);
}
function getDots() {
    Dots = [];
    for (let i = 0; i < size; i++) {
        let x = random(0, width);
        let y = random(0, height);
        let color = 'rgba(' + random(0, 255) + ',' + random(0, 255) + ',' + random(0, 255) + ',0.6)';
        Dots.push({
            x: x,
            y: y,
            dx: Math.random()*1.6+0.2,
            dy: Math.random()+0.1,
            color: color,
            cap: 0,   //柱状图上的小帽距离最低端的距离
            rot: random(0,360),
            direction: random(0,1)
        });
    }
}


/*
$('#upload').onchange = function() {
    alert('change');
    console.log(this.files);
    if (this.files.length !== 0) {
        let file = this.files[0];
        let fr = new FileReader();

        fr.onload = function (e) {
            mv.play(e.target.result);
        }
        fr.readAsArrayBuffer(file);

        let newMusic = document.createElement('<li title="' + file.name + '">' + file.name + '</li>');
        $('#list').appendChild(newMusic);

        let list = $('#list li');
        for (let i = 0, n = list.length; i < n; i++) {
            list[i].className = '';
        }
        newMusic.className = 'selected';
    }
}
*/

/**
 * 曲目上传
 */
function upload(f) {
    console.log(f.files);
    if (f.files.length !== 0) {
        let file = f.files[0];
        newSongs.push(file);
        let fr = new FileReader();

        fr.onload = function (e) {
            mv.play(e.target.result);  //输出一个ArrayBuffer对象
        }
        fr.readAsArrayBuffer(file);

        let newMusic = document.createElement('li');
        newMusic.setAttribute('title', file.name);
        newMusic.setAttribute('id', newSongsNum);
        newMusic.innerText = file.name;
        $('#list')[0].appendChild(newMusic);

        let list = $('#list li');
        for (let i = 0, n = list.length; i < n; i++) {
            list[i].className = '';
        }
        newMusic.className = 'selected';

        newMusic.onclick = function () {
            let list = $('#list li');
            for (let i = 0, num = list.length; i < num; i++) {
                list[i].className = '';
            }
            this.className = 'selected';
            let id = this.getAttribute('id');
            let file = newSongs[id];
            let fr = new FileReader();

            fr.onload = function (e) {
                mv.play(e.target.result); 
            }
            fr.readAsArrayBuffer(file);
        }
        newSongsNum++;
    }
}