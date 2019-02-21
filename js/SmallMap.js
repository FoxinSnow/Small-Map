/**
 * author: Fei HUANG 1794177
 *
 * This library is the achievement of this project.
 * To use this library, include SmallMap.js in the html file.
 */

'use strict';

/**
 * The main function, which is the entrance to the library.
 */
function SmallMap() {

    //variables

    //default value of terrain type
    /**
     * 0.9 means 90% to 100% height is snow.
     * 0.85 means 85% to 90% is rock.
     * 0.75 means 75% to 85% is wood.
     * grass between 0.35 to 0.6.
     * 0.35 means 0 to 35% is sea.
     */
    let terrSnow = 0.9;
    let terrRock = 0.85;
    let terrWood = 0.75;
    let terrPlain = 0.6;
    let terrSea = 0.35;

    //height array, vertices array and colors array
    let heightArray, verticesArray, colorsArray = [];

    //user input
    /**
     * The sideSize must be a even number.
     * Or the library may crash.
     */
    let terrSideSize;
    let terrSideUnit;//default unit = sideSize - 1
    let terrHeightRange;
    let terrOffset;
    let terrScale;

    //global variable for developer view
    let maxIndex = -1;

    //variables end

    /**
     * This private function creates the terrain and sea base.
     *
     * @param sideSize this is the side size
     * @param heightRange this is the max height of this terrain
     * @param offset this is a random number, control the random generation
     * @param scale the larger scale, the complex the terrain content
     *
     * @returns {*[]} first element: terrain, second element: sea
     */
    this.createTerrain = function (sideSize, heightRange, offset, scale) {

        //one vertices 3 value, duplicate vertices not count again
        terrSideSize = sideSize;
        terrSideUnit = terrSideSize - 1;
        terrHeightRange = heightRange;
        terrOffset = offset;
        terrScale = scale;

        let rMap = createMap();
        let rSea = createSeaLevel();

        let returnTerrain = [rMap, rSea];

        return returnTerrain;

        function createMap() {
            var geometryTerrain = new THREE.PlaneBufferGeometry(terrSideSize, terrSideSize, terrSideUnit, terrSideUnit);

            geometryTerrain.rotateX(-Math.PI / 2);
            verticesArray = geometryTerrain.attributes.position.array;
            var verticesLength = verticesArray.length;
            heightArray = new Array(verticesLength / 3);//height map
            colorsArray = new Float32Array(verticesLength);
            geometryTerrain.addAttribute('color', new THREE.BufferAttribute(colorsArray, 3));

            //simplex
            for (let i = 0, l = verticesArray.length; i < l; i += 3) {
                let x = verticesArray[i] / 500 * terrScale + terrOffset;
                let y = verticesArray[i + 2] / 500 * terrScale + terrOffset;

                let value = simplexGene(x, y);

                heightArray[i / 3] = value;
            }

            //re-range 1
            let max = 0;
            let min = 0;
            for (let j = 0, len = heightArray.length; j < len; j++) {
                let v = heightArray[j];
                if (v > max) {
                    max = v;
                }
                if (v <= min) {
                    min = v;
                }
            }
            let maxDiff = max - min;

            for (let i = 0, l = heightArray.length; i < l; i++) {
                let tmp = heightArray[i];
                heightArray[i] = (tmp - min) / maxDiff + 1;
            }

            //pow
            for (let x = 0; x < heightArray.length; x++) {
                let tmp = heightArray[x];
                if (tmp > terrSea) {
                    heightArray[x] = Math.pow(tmp, 2.45);
                }
            }

            //re-range 2
            let max2 = 0;
            let min2 = 0;
            for (let j2 = 0, len2 = heightArray.length; j2 < len2; j2++) {
                let v2 = heightArray[j2];
                if (v2 > max2) {
                    max2 = v2;
                }
                if (v2 <= min2) {
                    min2 = v2;
                }
            }
            let maxDiff2 = max2 - min2;

            for (let i2 = 0, len2 = heightArray.length; i2 < len2; i2++) {
                let tmp2 = heightArray[i2];
                heightArray[i2] = (tmp2 - min2) / maxDiff2;
            }

            //Erosion
            heightArray = hydraulicErosion(heightArray.length, heightArray, terrSea);
            heightArray = thermalErosion(heightArray.length, heightArray, terrSea);

            //create terrain colors and type
            let maxHeight = 0;
            for (let i = 0, l = verticesArray.length; i < l; i += 3) {
                let thisHeight = heightArray[i / 3];
                verticesArray[i + 1] = thisHeight * terrHeightRange;

                if (verticesArray[i + 1] > maxHeight) {
                    maxHeight = verticesArray[i + 1];
                    maxIndex = i;
                }

                if (thisHeight >= terrSnow) {
                    //snow
                    colorsArray[i] = 1;
                    colorsArray[i + 1] = 1;
                    colorsArray[i + 2] = 1;
                } else if (thisHeight < terrSnow && thisHeight >= terrRock) {
                    //rock
                    colorsArray[i] = 0.46;
                    colorsArray[i + 1] = 0.53;
                    colorsArray[i + 2] = 0.6;
                } else if (thisHeight < terrRock && thisHeight >= terrWood) {
                    //tundra
                    colorsArray[i] = 0.33;
                    colorsArray[i + 1] = 0.42;
                    colorsArray[i + 2] = 0.2;
                } else if (thisHeight < terrWood && thisHeight >= terrPlain) {
                    //wood
                    colorsArray[i] = 0.3;
                    colorsArray[i + 1] = 0.35;
                    colorsArray[i + 2] = 0;
                } else if (thisHeight < terrSea - 0.01) {//minor to adjust and make it more like real world
                    //sea
                    colorsArray[i] = 0.17;
                    colorsArray[i + 1] = 0.3;
                    colorsArray[i + 2] = 0.7;
                } else {
                    //grass
                    colorsArray[i] = 0.344;
                    colorsArray[i + 1] = 0.42;
                    colorsArray[i + 2] = 0.13;
                }
            }

            geometryTerrain.computeVertexNormals();
            let materialTerrain = new THREE.MeshLambertMaterial({
                vertexColors: true
                //color: '#808080'
            });
            let terrain = new THREE.Mesh(geometryTerrain, materialTerrain);
            terrain.position.set(0, 0, 0);

            return terrain;

            //simplex

            //@reference
            //# This part of code is first write by Stefan Gustavson in Java version
            //# http://staffwww.itn.liu.se/~stegu/simplexnoise/simplexnoise.pdf
            function simplexGene(x, y) {

                let v = simplex(x, y) +
                    simplex(2 * x, 2 * y) / 2 +
                    simplex(4 * x, 4 * y) / 4 +
                    simplex(8 * x, 8 * y) / 8 +
                    simplex(16 * x, 16 * y) / 16 +
                    simplex(32 * x, 32 * y) / 32 +
                    simplex(64 * x, 64 * y) / 64;

                return v;

                function simplex(xin, yin) {

                    //modified
                    let grad = [[1, 1], [-1, 1], [1, -1], [-1, -1],
                        [1, 0], [-1, 0], [0, 1], [0, -1],
                        [1, 1], [-1, 1], [1, -1], [-1, -1],
                        [1, 0], [-1, 0], [0, 1], [0, -1]];
                    //modified end

                    let pArr = [151, 160, 137, 91, 90, 15,
                        131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23,
                        190, 6, 148, 247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32, 57, 177, 33,
                        88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175, 74, 165, 71, 134, 139, 48, 27, 166,
                        77, 146, 158, 231, 83, 111, 229, 122, 60, 211, 133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244,
                        102, 143, 54, 65, 25, 63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169, 200, 196,
                        135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64, 52, 217, 226, 250, 124, 123,
                        5, 202, 38, 147, 118, 126, 255, 82, 85, 212, 207, 206, 59, 227, 47, 16, 58, 17, 182, 189, 28, 42,
                        223, 183, 170, 213, 119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9,
                        129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232, 178, 185, 112, 104, 218, 246, 97, 228,
                        251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162, 241, 81, 51, 145, 235, 249, 14, 239, 107,
                        49, 192, 214, 31, 181, 199, 106, 157, 184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254,
                        138, 236, 205, 93, 222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180];

                    let perm = new Array(512);
                    let permMod = new Array(512);

                    for (let iperm = 0; iperm < 512; iperm++) {
                        perm[iperm] = pArr[iperm & 255];
                        permMod[iperm] = perm[iperm] % 12;
                    }

                    const F2 = 0.5 * (Math.sqrt(3.0) - 1.0); //skew
                    const G2 = (3.0 - Math.sqrt(3.0)) / 6.0; //unskew

                    let n0, n1, n2;

                    let s = (xin + yin) * F2;
                    let i = Math.floor(xin + s);
                    let j = Math.floor(yin + s);

                    let t = (i + j) * G2;
                    let X0 = i - t;
                    let Y0 = j - t;
                    let x0 = xin - X0;
                    let y0 = yin - Y0;

                    let i1, j1;
                    if (x0 > y0) {
                        i1 = 1;
                        j1 = 0;
                    } else {
                        i1 = 0;
                        j1 = 1;
                    }

                    let x1 = x0 - i1 + G2;
                    let y1 = y0 - j1 + G2;
                    let x2 = x0 - 1.0 + 2.0 * G2;
                    let y2 = y0 - 1.0 + 2.0 * G2;

                    let ii = i & 255;
                    let jj = j & 255;
                    let gi0 = permMod[ii + perm[jj]];
                    let gi1 = permMod[ii + i1 + perm[jj + j1]];
                    let gi2 = permMod[ii + 1 + perm[jj + 1]];


                    let t0 = 0.5 - x0 * x0 - y0 * y0;
                    if (t0 < 0) {
                        n0 = 0.0;
                    } else {
                        t0 *= t0;
                        n0 = t0 * t0 * dot(grad[gi0][0], grad[gi0][1], x0, y0);
                    }

                    let t1 = 0.5 - x1 * x1 - y1 * y1;
                    if (t1 < 0) {
                        n1 = 0.0;
                    } else {
                        t1 *= t1;
                        n1 = t1 * t1 * dot(grad[gi1][0], grad[gi1][1], x1, y1);
                    }

                    let t2 = 0.5 - x2 * x2 - y2 * y2;
                    if (t2 < 0) {
                        n2 = 0.0;
                    } else {
                        t2 *= t2;
                        n2 = t2 * t2 * dot(grad[gi2][0], grad[gi2][1], x2, y2);
                    }

                    return 70.0 * (n0 + n1 + n2);

                    function dot(g0, g1, x, y) {
                        return (g0 * x + g1 * y);
                    }
                }

            }
            //reference end

            //erosion
            //thermal erosion
            function thermalErosion(s, map, seaLevel) {
                // /map is the height map passed in
                //four corner
                //(1,1) (1,sideSize-2) (sideSize-2, 1) (sideSize-2, sideSize-2)
                let fullSize = s;
                let sideSize = Math.sqrt(s);

                for (let j1 = 0; j1 < 2; j1++) {
                    thermalErosionLoop:
                        for (let j2 = 0, l = fullSize; j2 < l; j2++) {
                            if ((j2 >= 0 && j2 <= sideSize - 1)//top
                                || (j2 >= fullSize - sideSize && j2 <= fullSize - 1)//bottom
                                || (j2 > 0 && j2 % sideSize == 0 && j2 != fullSize - sideSize)//left
                                || (j2 > sideSize - 1 && j2 % sideSize == sideSize - 1 && j2 != fullSize - 1)) {//right
                                continue thermalErosionLoop;
                            } else if (map[j2] > seaLevel - 0.1) { //only adjust land not sea
                                let h = map[j2];
                                let hs = [map[j2 - sideSize - 1], map[j2 - sideSize + 1], map[j2 + sideSize - 1], map[j2 + sideSize + 1]];
                                let d = [h - hs[0], h - hs[1], h - hs[2], h - hs[3]];
                                let dMax = 0;
                                let di = -1;
                                let talus = 4 / fullSize;

                                //find dTotal and dMax and the lowest position di
                                for (let i = 0; i < 4; i++) {
                                    if (d[i] > talus) {
                                        if (d[i] > dMax) {
                                            dMax = d[i];
                                            di = i;
                                        }
                                    }
                                }
                                //move
                                let deltaH = dMax / 3;
                                if (di == -1) {
                                    continue thermalErosionLoop;
                                } else if (di == 0) {
                                    map[j2 - sideSize - 1] += deltaH;
                                } else if (di == 1) {
                                    map[j2 - sideSize + 1] += deltaH;
                                } else if (di == 2) {
                                    map[j2 + sideSize - 1] += deltaH;
                                } else if (di == 3) {
                                    map[j2 + sideSize + 1] += deltaH;
                                }
                                map[j2] -= deltaH;


                            }
                        }
                }

                return map;
            }

            //hydraulic erosion
            function hydraulicErosion(s, map, seaLevel){//map is the height map passed in
                let fullSize = s;
                let sideSize = Math.sqrt(s);
                let kr = 0.055; //rain
                let krLar = kr + 0.04;
                let ks = 0.05; //sediment
                let ke = 0.5; //evaporation

                //initial rain
                let waterMap = new Array(fullSize).fill(kr * 1.5);

                for (let j = 0; j < 25; j++) {
                    hydraulicErosionLoop:
                        for (let n = 0; n < fullSize; n++) {

                            if ((n >= 0 && n <= sideSize - 1)//top
                                || (n >= fullSize - sideSize && n <= fullSize - 1)//bottom
                                || (n > 0 && n % sideSize == 0 && n != fullSize - sideSize)//left
                                || (n > sideSize - 1 && n % sideSize == sideSize - 1 && n != fullSize - 1)) {//right
                                continue hydraulicErosionLoop;
                            } else {
                                if (map[n] > seaLevel && map[n] < seaLevel + 0.4) {
                                    waterMap[n] += krLar;

                                    let a = map[n] + waterMap[n];
                                    let as = [map[n - sideSize - 1] + waterMap[n - sideSize - 1],
                                        map[n - sideSize + 1] + waterMap[n - sideSize + 1],
                                        map[n + sideSize - 1] + waterMap[n + sideSize - 1],
                                        map[n + sideSize + 1] + waterMap[n + sideSize + 1]];
                                    let aAvg = 0; //average a
                                    let aTotal = 0;
                                    let d = [a - as[0], a - as[1], a - as[2], a - as[3]];
                                    let dMax = 0;

                                    //optimization
                                    for (let k = 0; k < 4; k++) {
                                        aTotal += as[k];
                                        if (d[k] > 0) {
                                            if (d[k] > dMax) {
                                                dMax = d[k];
                                            }
                                        }
                                    }
                                    aAvg = aTotal / 4;
                                    let aDelta = a - aAvg;
                                    let wDeltas = Math.min(waterMap[n], aDelta);
                                    waterMap[n] -= wDeltas;
                                    //map[n] = map[n] - ks * wDeltas;

                                    let afterLossed = map[n] - ks * wDeltas;
                                    if (afterLossed < (seaLevel + 0.01)) {
                                        map[n] = (seaLevel + 0.01);
                                    } else {
                                        map[n] = afterLossed;
                                    }

                                    //assume all water carry the max sediment, no need for sediment map
                                    continue hydraulicErosionLoop;
                                }

                                if (map[n] > seaLevel) {

                                    waterMap[n] += kr;

                                    let a = map[n] + waterMap[n];
                                    let as = [map[n - sideSize - 1] + waterMap[n - sideSize - 1],
                                        map[n - sideSize + 1] + waterMap[n - sideSize + 1],
                                        map[n + sideSize - 1] + waterMap[n + sideSize - 1],
                                        map[n + sideSize + 1] + waterMap[n + sideSize + 1]];
                                    let aAvg = 0; //average a
                                    let aTotal = 0;
                                    let d = [a - as[0], a - as[1], a - as[2], a - as[3]];
                                    let dTotal = 0;
                                    let di = -1;
                                    let dMax = 0;

                                    //optimization
                                    for (let k = 0; k < 4; k++) {
                                        aTotal += as[k];
                                        if (d[k] > 0) {
                                            //dTotal += d[i];
                                            if (d[k] > dMax) {
                                                dMax = d[k];
                                            }
                                        }
                                    }
                                    aAvg = aTotal / 4;
                                    let aDelta = a - aAvg;

                                    let wDeltas = Math.min(waterMap[n], aDelta);
                                    waterMap[n] -= wDeltas;

                                    //if < sealevel, = sealevel
                                    let afterLossed = map[n] - ks * wDeltas;
                                    if (afterLossed < (seaLevel + 0.01)) {
                                        map[n] = (seaLevel + 0.01);
                                    } else {
                                        map[n] = afterLossed;
                                    }

                                    //assume all water carry the max sediment, no need for sediment map
                                    continue hydraulicErosionLoop;
                                }

                            }
                        }
                }

                for (let n2 = 0; n2 < fullSize; n2++) {
                    //correct the height of the top bottom left right pixels
                    if (n2 > 0 && n2 < sideSize - 1) { //top
                        map[n2] = map[n2 + sideSize];
                    } else if (n2 > fullSize - sideSize && n2 < fullSize - 1) {//bottom
                        map[n2] = map[n2 - sideSize];
                    } else if (n2 > 0 && n2 % sideSize == 0 && n2 != fullSize - sideSize) {//left
                        map[n2] = map[n2 + 1];
                    } else if (n2 > sideSize - 1 && n2 % sideSize == sideSize - 1 && n2 != fullSize - 1) {//right
                        map[n2] = map[n2 - 1];
                    } else if (n2 == 0) { //corner 1
                        map[n2] = map[n2 + sideSize + 1];
                    } else if (n2 == sideSize - 1) { //corner 2
                        map[n2] = map[n2 + sideSize - 1];
                    } else if (n2 == fullSize - sideSize) { //corner 3
                        map[n2] = map[n2 - sideSize + 1];
                    } else if (n2 == fullSize - 1) { //corner 4
                        map[n2] = map[n2 - sideSize - 1];
                    }
                }
                return map;

            }
        }

        function createSeaLevel() {
            let geometrySea = new THREE.CubeGeometry(terrSideSize, terrSideSize, 1);
            geometrySea.rotateX(-Math.PI / 2);
            let materialSea = new THREE.MeshBasicMaterial({
                color: 'rgb(20, 80, 130)',
                transparent: true,
                opacity: 0.8
            });
            let seaLevel = new THREE.Mesh(geometrySea, materialSea);
            seaLevel.position.set(0, terrHeightRange * terrSea, 0);

            return seaLevel;
        }
    }

    /**
     * This is a private option function used to change the terrain environment.
     * Every parameter is a proportion.
     * See the line 18 to 24 for details.
     *
     * @param snow a number between 0 to 1
     * @param rock a number between 0 to 1
     * @param wood a number between 0 to 1
     * @param plain a number between 0 to 1
     * @param sea a number between 0 to 1
     */
    this.setTerrainEnvironment = function (snow, rock, wood, plain, sea) {
        terrSnow = snow;
        terrRock = rock;
        terrWood = wood;
        terrPlain = plain;
        terrSea = sea;
    }

    /**
     * This is a private option function to help usage of the library more flexible.
     *
     * @param heightMatirx if true, print height matrix
     * @param axisValue if true, print x y z value when click a point
     * @param heightToMark  -1 if no need
     *                      a number between 0 to 1, mark the height
     * @param maxHeight if true, put a red cube on max height
     * @param maxHeightValue if true, print the max height value
     * @param pathArray an array, each two is a x z pair, draw a red line along the path
     * @param sideDivision  -1 if no need
     *                      a number, show side division of the help grid
     *
     * @return {*[]} first element 1
     *               second element 2
     *               third element the object of height mark, add to scene in the main js file
     *               fourth element the object of max height mark, add to scene in the main js file
     *               fifth element 5
     *               sixth element the path axis values
     *               seventh element the object of help grid, add to scene in the main js file
     */
    this.developerView = function
        (heightMatirx, axisValue, heightToMark, maxHeight, maxHeightValue, pathArray, sideDivision) {

        let r0 = -1, r1 = -1, r2 = -1, r3 = -1, r4 = -1, r5 = -1, r6 = -1;

        if (heightMatirx == true) {
            r0 = printHeightMatrix();
        }

        if (axisValue == true) {
            r1 = printAxisValue();
        }

        if (heightToMark != -1) {
            r2 = markedHeight(heightToMark);
        }

        if (maxHeight == true) {
            r3 = markedMaxHeight();
        }

        if (maxHeightValue == true) {
            r4 = printMaxHeight();
        }

        if (pathArray != []) {
            r5 = markedPath(pathArray);
        }

        if(sideDivision != -1){
            r6 = markedGrid(sideDivision);
        }

        let returnDV = [r0, r1, r2, r3, r4, r5, r6];

        return returnDV;

        //key0
        function printHeightMatrix() {
            if (heightArray.length == 0 || heightArray == undefined) {
                console.log("Height matrix is not defined yet. Try later.");
                return 1;
            } else {
                console.log(heightArray);
                return 1;
            }
        }

        //key1
        function printAxisValue() {
            let raycaster = new THREE.Raycaster();
            let mouse = new THREE.Vector2();

            function onMouseDown(event) {
                mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
                mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
                raycaster.setFromCamera(mouse, camera);
                let intersects = raycaster.intersectObjects(scene.children);
                if (intersects.length) {
                    let selected = intersects[0];
                    console.log
                    ('x:', selected.point.x, ' y:', selected.point.y, ' z:', selected.point.z);
                }

            }

            window.addEventListener("mousedown", onMouseDown, false);
            return 2;
        }

        //key2
        function markedHeight(x) {
            if (x >= 1 || x < 0) {
                console.log('The value is not valid.');
                return;
            } else {
                let geometry = new THREE.PlaneGeometry(terrSideSize, terrSideSize);
                geometry.rotateX(-Math.PI / 2);
                let material = new THREE.MeshLambertMaterial({
                    color: 'grey',
                    transparent: true,
                    opacity: 0.4
                });

                let markPlane = new THREE.Mesh(geometry, material);
                markPlane.position.y = x * terrHeightRange;

                return markPlane;
            }
        }

        //key3
        function markedMaxHeight() {
            if (maxIndex == -1) {
                console.log("Height matrix is not defined yet. Try later.");
                return;
            } else {
                let geo = new THREE.CubeGeometry(4, 4, 4);
                geo.applyMatrix(new THREE.Matrix4().makeTranslation(0, 2, 0));
                let mat = new THREE.MeshLambertMaterial({
                    color: 'red',
                    transparent: true,
                    opacity: 0.5
                });

                let mesh = new THREE.Mesh(geo, mat);

                mesh.position.x = verticesArray[maxIndex];
                mesh.position.y = verticesArray[maxIndex + 1];
                mesh.position.z = verticesArray[maxIndex + 2];

                return mesh;
            }
        }

        //key4
        function printMaxHeight() {
            if (maxIndex == -1) {
                console.log("Height matrix is not defined yet. Try later.");
                return 5;
            } else {
                console.log(
                    'Max height position, x:'
                    + verticesArray[maxIndex] + ' y:'
                    + verticesArray[maxIndex + 1] + ' z:'
                    + verticesArray[maxIndex + 2]);
                return 5;
            }
        }

        //key5
        function markedPath(wayPoints) {

            let xzPath = [];

            for (let num = 0; num < wayPoints.length - 2; num += 2) {
                let start = [wayPoints[num], wayPoints[num + 1]];
                let end = [wayPoints[num + 2], wayPoints[num + 3]];
                // console.log(start);
                // console.log(end);

                start[0] += terrSideSize / 2;
                start[1] += terrSideSize / 2;
                end[0] += terrSideSize / 2;
                end[1] += terrSideSize / 2;

                let path = createPath(heightArray.length, heightArray, start, end, terrSea);
                let pathLength = path.length;
                //transfer the path back to xyz axis
                for(let w1 = 0; w1 < pathLength; w1++) {
                    let tmpArr = [path[w1] % terrSideSize, Math.floor(path[w1]/terrSideSize)];
                    xzPath.push(tmpArr);
                }
                //mark path color
                for (let w2 = 1; w2 < pathLength; w2++) {
                    colorsArray[path[w2] * 3] = 1;
                    colorsArray[path[w2] * 3 + 1] = 0;
                    colorsArray[path[w2] * 3 + 2] = 0;
                }
                let st = start[0] + start[1] * terrSideSize;
                colorsArray[st * 3] = 0;
                colorsArray[st * 3 + 1] = 0;
                colorsArray[st * 3 + 2] = 0;
            }

            return xzPath;

            function createPath(l, map, start, end, seaLevel) {
                let lengthOfMap = l;
                let sideLength = Math.sqrt(lengthOfMap);

                let axisMap = new Array();

                let distanceToEndPoint = new Array(lengthOfMap);

                calculateDToEnd();

                return walk();

                function calculateDToEnd() {
                    //transfer the height matrix
                    for (let i1 = 0; i1 < lengthOfMap; i1 += sideLength) {
                        let tmpArr = [];
                        for (let j1 = 0; j1 < sideLength; j1++) {
                            tmpArr.push(map[i1 + j1]);
                        }
                        axisMap.push(tmpArr);
                    }

                    for (let i2 = 0; i2 < sideLength; i2++) {
                        for (let j2 = 0; j2 < sideLength; j2++) {
                            let xDistance = Math.abs(i2 - end[1]);
                            let zDistance = Math.abs(j2 - end[0]);
                            distanceToEndPoint[i2 * sideLength + j2] = Math.max(xDistance, zDistance);
                        }
                    }
                }

                function walk() {
                    //transfer start point and end point
                    let st = start[0] + start[1] * sideLength;
                    let ed = end[0] + end[1] * sideLength;

                    //initial
                    let path = new Array();
                    path.push(st);

                    let index = st;
                    let waitingList;

                    walkLoop:
                        while (index != ed) {
                            if (index > 0 && index < sideLength - 1) { //top
                                waitingList = [index - 1, index + 1, index + sideLength - 1, index + sideLength, index + sideLength + 1];
                            } else if (index > lengthOfMap - sideLength && index < lengthOfMap - 1) {//bottom
                                waitingList = [index - sideLength - 1, index - sideLength, index - sideLength + 1, index - 1, index + 1];
                            } else if (index > 0 && index % sideLength == 0 && index != lengthOfMap - sideLength) {//left
                                waitingList = [index - sideLength, index - sideLength + 1, index + 1, index + sideLength, index + sideLength + 1];
                            } else if (index > sideLength - 1 && index % sideLength == sideLength - 1 && index != lengthOfMap - 1) {//right
                                waitingList = [index - sideLength - 1, index - sideLength, index - 1, index + sideLength - 1, index + sideLength];
                            } else if (index == 0) {
                                waitingList = [index + 1, index + sideLength, index + sideLength + 1];
                            } else if (index == sideLength - 1) {
                                waitingList = [index - 1, index + sideLength - 1, index + sideLength];
                            } else if (index == lengthOfMap - sideLength) {
                                waitingList = [index - sideLength, index - sideLength + 1, index + 1];
                            } else if (index == lengthOfMap - 1) {
                                waitingList = [index - sideLength - 1, index - sideLength, index - 1];
                            } else {
                                waitingList = [index - sideLength - 1, index - sideLength, index - sideLength + 1
                                    , index - 1, index + 1, index + sideLength - 1, index + sideLength, index + sideLength + 1];
                            }

                            let waitingList2 = [];

                            for (let x1 = 0; x1 < 8; x1++) {
                                //get the height value
                                let tmp = map[waitingList[x1]];
                                //decide whether the value is valid
                                if (tmp >= seaLevel + 0.01 && tmp < 1) {
                                    waitingList2.push(waitingList[x1]);
                                }
                            }

                            if (waitingList2.length == 0) {
                                console.log('No proposed path way.')
                                return;
                            }

                            let waitingList3 = [];

                            //find the one most close to the end point
                            let distance = sideLength;
                            for (let x2 = 0; x2 < waitingList2.length; x2++) {
                                if (distance > distanceToEndPoint[waitingList2[x2]]) {
                                    distance = distanceToEndPoint[waitingList2[x2]];
                                }
                            }

                            for (let x3 = 0; x3 < waitingList2.length; x3++) {
                                if (distanceToEndPoint[waitingList2[x3]] == distance) {
                                    waitingList3.push(waitingList2[x3]);
                                }
                            }

                            //put the index point into the path
                            var ran = Math.floor(Math.random() * waitingList3.length + 1) - 1;
                            var ranIndex = waitingList3[ran];

                            path.push(ranIndex);
                            index = ranIndex;
                        }

                    return path;
                }
            }
        }

        //key6
        function  markedGrid(division){
            let gridHelper = new THREE.GridHelper(terrSideSize, division);
            gridHelper.position.y = (terrSea + 0.01) * terrHeightRange;
            return gridHelper;
        }
    }


    /**
     * This is a help funtion does not related to the usage of library.
     * This function calculate the erosion score of the terrain.
     */
    this.erosionScore = function(){
        let l = heightArray.length;
        let slopes = new Array(l);
        let sumSlope = 0;
        let hiu, hil, hir, hib;
        for(let u = 0; u < l; u++){
            if(u - terrSideSize < 0){
                hiu = heightArray[u];
            }else{
                hiu = Math.abs(heightArray[u] - heightArray[u - terrSideSize]);
            }
            if( u % terrSideSize == 0){
                hil = heightArray[u];
            }else {
                hil = Math.abs(heightArray[u] - heightArray[u - 1]);
            }
            if((u + 1)%terrSideSize == 0){
                hir = heightArray[u];
            }else {
                hir = Math.abs(heightArray[u] - heightArray[u + 1]);
            }
            if(u + terrSideSize >= l){
                hib = heightArray[u];
            }else {
                hib = Math.abs(heightArray[u] - heightArray[u + terrSideSize]);
            }

            slopes[u] = Math.max(hiu, hil, hir, hib);

            sumSlope += slopes[u];
        }

        let avgSlope = sumSlope/l;

        let sumSquare = 0;
        for(let u1 = 0; u1 < l; u1++){
            sumSquare += Math.pow((slopes[u1] - avgSlope), 2);
        }

        let sdSlope = Math.sqrt(sumSquare/l);

        let erosionScore = sdSlope/avgSlope;

        console.log(erosionScore);
    }
}

