# Small-Map

`SmallMap.js` is a JavaScript library procedurally generating terrain used by web browser game developers. This library is designed based on noise algorithm, hydraulic erosion algorithm and thermal erosion algorithm.

This library is highly dependent on Three.js.

### How to Use

Simply download the `SmallMap.js` file in the js folder.

In your HTML file, please include:
```
<script src="js/SmallMap.js"></script>
<script src="js/three.js"></script>
```
In your JS file, create an generator in this way:
```
let your_terrain = new SmallMap();
```
Set the terrain environment, the five paramater should be [0,1] representing propotion of the type in terrain:
```
your_terrain.setTerrainEnvironment ({snow, rock, wood, plain, sea});
```
Create your terrain with following variables, and get two return objects, the terrain and the sea plane:<br>
* sideSize: the side length of the square terrain,<br>
* heightRange: maximum height and will multiply with proportion,<br>
* offset: a random seed to control the terrain shape,<br>
* scale: large scale producing large complex terrain, default is 1<br>
```
your_terrain.createTerrain ({sideSize, heightRange, offset, scale});
```
Or access developer view to make some visualization:<br>
Return is an array contain 7 element, either a number or a mesh can be added to scene. Return value will be -1 if switch off with false, [], or -1. <br>
(This function is native so far. It may create some ugly effect.)<br>
* heightMatirx: Boolean, whether to print the terrain matrix of height,<br> 
* axisValue: Boolean, whether to print the xyz value of a point when clicked,<br>
*	heightToMark: -1 or a number between 0 to 1, whether show a plane to mark a height, <br>
*	maxHeight: Boolean, whether to marked the maximum height in terrain,<br>
*	maxHeightValue: Boolean, whether to print maximum height position,<br>
*	pathArray: [] or an array, every 2 element will be a pair of x z value,<br>
*	sideDivision: -1 or a number, as how many divisions in the side of help grids<br>
```
your_terrain.developerView ({
  heightMatirx, axisValue, heightToMark, maxHeight, maxHeightValue, pathArray, sideDivision
});
```

### Example Result
Here are some example outputs from this library.<br><br>

<div align="center">
  <img width="400" height="350" src="https://github.com/FoxinSnow/Small-Map/blob/master/Screenshot/simplex%2C%204456%2C%20500%2C%20scale%201.png"/>
  <img width="350" height="350" src="https://github.com/FoxinSnow/Small-Map/blob/master/Screenshot/Screen%20Shot%202018-08-21%20at%2013.41.56.png"/>
</div>
