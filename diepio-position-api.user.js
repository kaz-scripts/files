// ==UserScript==
// @name         diep.io position api
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://diep.io/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    let respawnInterval;

    function api() {
        const shadowRoot = document.querySelector('d-base').shadowRoot;

        clearInterval(respawnInterval);
        let worldPosition = [0, 0];

        const canvas = document.getElementById('canvas');

        function hookCanvasMethod(target, callbackFunc) {
            CanvasRenderingContext2D.prototype[target] = new Proxy(CanvasRenderingContext2D.prototype[target], {
                apply(method, thisArg, args) {
                    callbackFunc(method, thisArg, args);
                    return Reflect.apply(method, thisArg, args);
                },
            });
        }

        function hookMinimapArrow() {
            let drawInstructions = 0;
            let minimapArrowVertex = [];

            hookCanvasMethod('beginPath', () => {
                drawInstructions = 1;
                minimapArrowVertex = [];
            });

            hookCanvasMethod('moveTo', (_, __, args) => {
                drawInstructions = 2;
                minimapArrowVertex.push(args);
            });

            hookCanvasMethod('lineTo', (_, __, args) => {
                if (drawInstructions >= 2 && drawInstructions <= 5) {
                    drawInstructions++;
                    minimapArrowVertex.push(args);
                } else {
                    drawInstructions = 0;
                }
            });

            hookCanvasMethod('fill', (_, thisArg, __) => {
                if (thisArg.fillStyle !== '#000000') return;
                if (drawInstructions === 4) {
                    const pos = getAverage(minimapArrowVertex);
                    worldPosition = getWorldPosition(pos);
                }
            });
        }

        let minimapPosition = [0, 0];
        let minimapDim = [0, 0];

        function hookMinimap() {
            hookCanvasMethod('strokeRect', (_, thisArg, __) => {
                const transform = thisArg.getTransform();
                minimapPosition = [transform.e, transform.f];
                minimapDim = [transform.a, transform.d];
            });
        }

        function getWorldPosition(position) {
            const ret = [
                parseFloat((((position[0] - minimapPosition[0] - minimapDim[0] / 2) / minimapDim[0] * 100) * 460).toFixed(3)),
                parseFloat((((position[1] - minimapPosition[1] - minimapDim[1] / 2) / minimapDim[1] * 100) * 460).toFixed(3)),
            ];
            return ret;
        }

        function getAverage(points) {
            let ret = [0, 0];
            points.forEach(point => {
                ret[0] += point[0];
                ret[1] += point[1];
            });
            ret[0] /= points.length;
            ret[1] /= points.length;
            return ret;
        }

        const getDistance = (target1, target2) => {
            const distX = target1[0] - target2[0];
            const distY = target1[1] - target2[1];
            return [Math.hypot(distX, distY), distX, distY];
        };

        function getposition() {
            return worldPosition;
        }
        window.getposition = getposition;
        hookMinimapArrow();
        hookMinimap();
    }

    api();
})();
