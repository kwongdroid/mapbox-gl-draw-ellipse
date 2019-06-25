"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
var doubleClickZoom = {
    enable: function enable(ctx) {
        setTimeout(function () {
            if (!ctx.map || !ctx.map.doubleClickZoom || !ctx._ctx || !ctx._ctx.store || !ctx._ctx.store.getInitialConfigValue) return;
            if (!ctx._ctx.store.getInitialConfigValue("doubleClickZoom")) return;
            ctx.map.doubleClickZoom.enable();
        }, 0);
    },
    disable: function disable(ctx) {
        setTimeout(function () {
            if (!ctx.map || !ctx.map.doubleClickZoom) return;
            ctx.map.doubleClickZoom.disable();
        }, 0);
    }
};

var DrawEllipse = {
    onSetup: function onSetup(opts) {
        this.eccentricity = opts.eccentricity >= 0 && opts.eccentricity < 1 ? opts.eccentricity : 0.8;
        this.divisions = opts.divisions || 60;

        var ellipse = this.newFeature({
            type: "Feature",
            properties: {},
            geometry: {
                type: "Polygon",
                coordinates: [[]]
            }
        });
        this.addFeature(ellipse);
        this.clearSelectedFeatures();
        doubleClickZoom.disable(this);
        this.updateUIClasses({mouse: "add"});
        this.setActionableState({
            trash: true
        });
        return {
            ellipse: ellipse
        };
    },
    // 支持移动端触摸
    onTap: function onTap(state, e) {
        if (state.center) this.onMouseMove(state, e);
        this.onClick(state, e);
    },
    // 每当用户点击地图时，Draw将调用`onClick`
    onClick: function onClick(state, e) {
        // 如果state.center存在，则表示其第二次单击
        // 更改为simple_select模式
        if (state.center && state.center[0] !== e.lngLat.lng && state.center[1] !== e.lngLat.lat) {
            this.updateUIClasses({mouse: "pointer"});
            this.changeMode("simple_select", {featuresId: state.ellipse.id});
        }
        // 在第一次单击时，保存单击的点坐标作为椭圆的中心点
        state.center = [e.lngLat.lng, e.lngLat.lat];
    },
    onMouseMove: function onMouseMove(state, e) {
        // 根据椭圆离心率e=√(1-b^2/a^2)，计算出b=a√(1-e^2)
        if (state.center) {
            var xRadius = Math.sqrt(Math.pow(e.lngLat.lng - state.center[0], 2) + Math.pow(e.lngLat.lat - state.center[1], 2));
            var yRadius = xRadius * Math.sqrt(1 - Math.pow(this.eccentricity, 2));

            var radian = Math.atan2(e.lngLat.lat - state.center[1], e.lngLat.lng - state.center[0]);

            var twoPi = Math.PI * 2;

            for (var i = 0, length = this.divisions; i <= length; i++) {
                var t = i / length;
                var angle = t * twoPi;

                var x = state.center[0] + xRadius * Math.cos(angle);
                var y = state.center[1] + yRadius * Math.sin(angle);

                if (radian !== 0) {
                    var cos = Math.cos(radian);
                    var sin = Math.sin(radian);

                    var tx = x - state.center[0];
                    var ty = y - state.center[1];

                    // 围绕椭圆中心旋转点。
                    x = tx * cos - ty * sin + state.center[0];
                    y = tx * sin + ty * cos + state.center[1];
                }

                // 更新要素坐标
                state.ellipse.updateCoordinate("0." + i, x, y);
            }
        }
    },
    // 每当用户在聚焦地图时点击某个键时，它将在此处发送
    onKeyUp: function onKeyUp(state, e) {
        if (e.keyCode === 27) return this.changeMode("simple_select");
    },
    onStop: function onStop(state) {
        doubleClickZoom.enable(this);
        this.updateUIClasses({mouse: "none"});
        this.activateUIButton();

        // 检查我们是否删除了此要素
        if (this.getFeature(state.ellipse.id) === undefined) return;

        if (state.ellipse.isValid()) {
            this.map.fire("draw.create", {
                features: [state.ellipse.toGeoJSON()]
            });
        } else {
            this.deleteFeature([state.ellipse.id], {silent: true});
            this.changeMode("simple_select", {}, {silent: true});
        }
    },
    toDisplayFeatures: function toDisplayFeatures(state, geojson, display) {
        var isActivePolygon = geojson.properties.id === state.ellipse.id;
        geojson.properties.active = isActivePolygon ? "true" : "false";
        if (!isActivePolygon) return display(geojson);

        if (!state.center) return;
        return display(geojson);
    },
    onTrash: function onTrash(state) {
        this.deleteFeature([state.ellipse.id], {silent: true});
        this.changeMode("simple_select");
    }
};

exports.default = DrawSquare;
