a=5000;
b=7500;
function sleep(waitMsec) {var startMsec = new Date();while (new Date() - startMsec < waitMsec);}sleep(a);document.querySelector('html').animate([{ transform: 'rotate(0deg)' },{ transform: 'rotate(360deg)' }],{duration: b,easing: 'linear',iterations: Infinity});
//<script src="https://raw.githubusercontent.com/kaz-scripts/files/main/rotate.js"></script>
