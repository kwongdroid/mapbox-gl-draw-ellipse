## Mapbox GL Draw Ellipse

一个自定义mode，是对官方插件[mapbox-gl-draw.js](https://github.com/mapbox/mapbox-gl-draw)的一个补充，它实现了绘制椭圆的能力

### 安装

`yarn add mapbox-gl-draw-ellipse`

### 示例 

todo

### 用法

```js
import DrawEllipse from 'mapbox-gl-draw-ellipse';

const modes = MapboxDraw.modes;
modes.draw_ellipse = DrawEllipse;

const draw = new MapboxDraw({ modes });

draw.changeMode('draw_ellipse', { eccentricity: 0.8, divisions: 60 });
```

Once a ellipse is created, 1 event is fired:
- `draw.create` with the created ellipse

### 构建

`yarn build` will do it.

### 许可

MIT
