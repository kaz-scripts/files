// ==UserScript==
// @name         dont push me pls
// @namespace    http://tampermonkey.net/
// @version      2024-05-13
// @description  you dont wanna to be pushed?
// @author       wakka
// @match        *://*.diep.io/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        unsafeWindow
// @run-at       document-start
// @updateURL    https://github.com/kaz-scripts/files/raw/main/diep-afk-by-wakka.user.js
// @downloadURL  https://github.com/kaz-scripts/files/raw/main/diep-afk-by-wakka.user.js
// ==/UserScript==
(function() {
const handler = {
    apply(r,o,args) {
        Error.stackTraceLimit = 0;
        return r.apply(o,args)
    }
}
Object.freeze = new Proxy(Object.freeze, handler);

Object.defineProperty(Object, 'freeze', {
    value: function(obj) {
        return obj;
    },
    writable: false,
    configurable: false
});

delete Object.prototype.freeze;

//GUIを開くキー。変更可能。
let open_gui = 'y';

//変数を定義
const win = typeof unsafeWindow != "undefined" ? unsafeWindow : window;
let worldPosition = [0, 0];
let afkPosition = [0, 0];
let isactive = false;
let b_gui, toggleButton, enableButton, pos;

//AFK距離
let dis = 1000;　//AFK位置からどれだけ離れたらAFK位置に戻ろうとするか。小さすぎると行ったり来たりしてしまう。

//diep.ioがロードされるまで待機
const wait = setInterval(()=>{
    if (!win.input) return;
    clearInterval(wait);
    main();
},100)

//canvasをフックする関数
function hook(target, callback){
    const check = () => {
        win.requestAnimationFrame(check)
        const func = CanvasRenderingContext2D.prototype[target]

        if(func.toString().includes(target)){

            CanvasRenderingContext2D.prototype[target] = new Proxy (func, {
                apply (method, thisArg, args) {
                    callback(method, thisArg, args)

                    return Reflect.apply (method, thisArg, args)
                }
            });
        }
    }
    win.requestAnimationFrame(check);
}

//ミニマップの矢印をフック
function hookMinimapArrow () {

    let drawInstructions = 0;
    let minimapArrowVertex = [];
    hook ('beginPath', (method, thisArg, args) => {
        drawInstructions = 1;
        minimapArrowVertex = [];
    });
    hook ('moveTo', (method, thisArg, args) => {
        drawInstructions = 2;
        minimapArrowVertex.push ( args );
    });
    hook ('lineTo', (method, thisArg, args) => {
        if (drawInstructions >= 2 && drawInstructions <= 5) {
            drawInstructions ++;
            minimapArrowVertex.push ( args );

        } else {
            drawInstructions = 0;
        }
    });
    hook ('fill', (method, thisArg, args) => {
        if (thisArg.fillStyle != '#000000' || thisArg.globalAlpha < 1) {
            return;
        }
        if (drawInstructions === 4) {
            const pos = getAverage (minimapArrowVertex);
            worldPosition = getWorldPosition (pos);
        }
    });
}

//ミニマップ用の変数
let minimapPosition = [0, 0];
let minimapDim = [0, 0];

//ミニマップをフック
function hookMinimap () {
    hook ('strokeRect', (method, thisArg, args) => {
        const transform = thisArg.getTransform ();
        minimapPosition = [transform.e, transform.f];
        minimapDim = [transform.a, transform.d];
    });
}

//座標を取得
function getWorldPosition (position) {
    const ret = [
        parseFloat((((position[0] - minimapPosition[0] - minimapDim[0] / 2) / minimapDim[0] * 100) * 460).toFixed (3)),
        parseFloat((((position[1] - minimapPosition[1] - minimapDim[1] / 2) / minimapDim[1] * 100) * 460).toFixed (3)),
    ]
    return ret;
}

//座標の平均を計算
function getAverage (points) {
    let ret = [0, 0];
    points.forEach (point => {
        ret[0] += point[0];
        ret[1] += point[1];
    });
    ret[0] /= points.length;
    ret[1] /= points.length;

    return ret;
}

//AFK用のGUIを作成
function gui() {
    var guiStyle = document.createElement('style');
    guiStyle.textContent = `
  #gui {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 9999;
    display: none;
    padding: 20px;
    background-color: #f0f0f0;
    border: 1px solid #ccc;
    border-radius: 5px;
  }
`;
    document.head.appendChild(guiStyle);
    b_gui = document.createElement('div');
    b_gui.id = 'gui';
    b_gui.style.display = 'none';
    b_gui.classList.add('disabled');

    toggleButton = document.createElement('button');
    toggleButton.id = 'toggleButton';
    toggleButton.textContent = 'AFK位置のリセット';
    b_gui.appendChild(toggleButton);

    enableButton = document.createElement('button');
    enableButton.id = 'enableButton';
    enableButton.textContent = 'AFKの有効化';
    b_gui.appendChild(enableButton);

    pos = document.createElement('div');
    pos.style.color = 'black';
    pos.id = 'pos';
    pos.innerHTML = 'AFK位置: 未設定<br>by wakka';
    b_gui.appendChild(pos);

    document.body.appendChild(b_gui);

    document.addEventListener('keydown', function(event) {
        if (event.key === open_gui) {
            if (b_gui.style.display === 'none') {
                b_gui.style.display = 'block';
            } else {
                b_gui.style.display = 'none';
            }
        }
    });
    toggleButton.addEventListener('click', function() {
        afkPosition = worldPosition;
        pos.innerHTML = `AFK位置: (${afkPosition})<br>by wakka`;
    })
    enableButton.addEventListener('click', function() {
        if (b_gui.classList.contains('disabled')) {
            b_gui.classList.remove('disabled');
            enableButton.textContent = 'AFKの無効化';
            isactive = true;
        } else {
            b_gui.classList.add('disabled');
            enableButton.textContent = 'AFKの有効化';
            isactive = false;
            win.input.key_up(65);win.input.key_up(68);win.input.key_up(83);win.input.key_up(87);
        }
    });
}

//アンチチートの誤検知を無効化
function bypassanticheat() {
    //削除済み
    //何か他にあれば追記
}

//AFK用関数
function afk(buttons) {
    requestAnimationFrame(afk);
    if (isactive) {
        //死亡時にAFKを解除
        if (!win.input.should_prevent_unload()) {
            isactive = false;
            b_gui.classList.add('disabled');
            enableButton.textContent = 'AFKの有効化';
            win.input.key_up(65);win.input.key_up(68);win.input.key_up(83);win.input.key_up(87);
            return;
        }

        const pos = worldPosition;
        if (Math.abs(afkPosition[0] - pos[0]) > dis){
            if (afkPosition[0] > pos[0]) {win.input.key_up(65); win.input.key_down(68);}
            else {win.input.key_up(68); win.input.key_down(65);}
        }
        else {
            win.input.key_up(65); win.input.key_up(68);
        }
        if (Math.abs(afkPosition[1] - pos[1]) > dis){
            if (afkPosition[1] > pos[1]) {win.input.key_up(87); win.input.key_down(83);}
            else {win.input.key_up(83); win.input.key_down(87);}
        }
        else {
            win.input.key_up(83); win.input.key_up(87);
        }
    }
}

//メイン
function main() {
    bypassanticheat();
    hookMinimapArrow();
    hookMinimap();
    gui();
    afk();
}
})();
