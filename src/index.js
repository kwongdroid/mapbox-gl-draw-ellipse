const doubleClickZoom = {
    enable: ctx => {
        setTimeout(() => {
            // 首先检查我们是否有地图和一些背景信息
            if (
                !ctx.map ||
                !ctx.map.doubleClickZoom ||
                !ctx._ctx ||
                !ctx._ctx.store ||
                !ctx._ctx.store.getInitialConfigValue
            )
                return;
            // 现在检查初始状态是不是假（如果是这样，我们将其禁用）
            if (!ctx._ctx.store.getInitialConfigValue("doubleClickZoom")) return;
            ctx.map.doubleClickZoom.enable();
        }, 0);
    },
    disable(ctx) {
        setTimeout(() => {
            if (!ctx.map || !ctx.map.doubleClickZoom) return;
            // 在这里总是禁用，因为在某些情况下这是必要的。
            ctx.map.doubleClickZoom.disable();
        }, 0);
    }
};

const DrawEllipse = {
    onSetup: function (opts) {
        this.eccentricity = opts.eccentricity >= 0 && opts.eccentricity < 1 ? opts.eccentricity : 0.8;
        this.divisions = opts.divisions || 60;

        const ellipse = this.newFeature({
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
        this.updateUIClasses({ mouse: "add" });
        this.setActionableState({
            trash: true
        });
        return {
            ellipse
        };
    },
    // 支持移动端触摸
    onTap: function (state, e) {
        // 模拟“移动鼠标”以更新要素坐标
        if (state.center) this.onMouseMove(state, e);
        // 模拟onClick
        this.onClick(state, e);
    },
    // 每当用户点击地图时，Draw将调用`onClick`
    onClick: function (state, e) {
        // 如果state.center存在，则表示其第二次单击
        // 更改为simple_select模式
        if (
            state.center &&
            state.center[0] !== e.lngLat.lng &&
            state.center[1] !== e.lngLat.lat
        ) {
            this.updateUIClasses({ mouse: "pointer" });
            this.changeMode("simple_select", { featuresId: state.ellipse.id });
        }
        // 在第一次单击时，保存单击的点坐标作为椭圆的中心点
        state.center = [e.lngLat.lng, e.lngLat.lat];
    },
    onMouseMove: function (state, e) {
        // 根据椭圆离心率e=√(1-b^2/a^2)，计算出b=a√(1-e^2)
        if (state.center) {
            const xRadius = Math.sqrt((e.lngLat.lng - state.center[0] ** 2) + (e.lngLat.lat - state.center[1]) ** 2);
            const yRadius = xRadius * Math.sqrt(1 - this.eccentricity ** 2);

            const radian = Math.atan2(e.lngLat.lat - state.center[1], e.lngLat.lng - state.center[0]);

            const twoPi = Math.PI * 2;

            for(let i of this.divisions){
                const t = i / this.divisions;
                const angle = t * twoPi;

                let x = state.center[0] + xRadius * Math.cos(angle);
                let y = state.center[1] + yRadius * Math.sin(angle);

                if (radian !== 0) {
                    const cos = Math.cos(radian);
                    const sin = Math.sin(radian);

                    const tx = x - state.center[0];
                    const ty = y - state.center[1];

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
    onKeyUp: function (state, e) {
        if (e.keyCode === 27) return this.changeMode("simple_select");
    },
    onStop: function (state) {
        doubleClickZoom.enable(this);
        this.updateUIClasses({ mouse: "none" });
        this.activateUIButton();

        // 检查我们是否删除了此要素
        if (this.getFeature(state.ellipse.id) === undefined) return;

        if (state.ellipse.isValid()) {
            this.map.fire("draw.create", {
                features: [state.ellipse.toGeoJSON()]
            });
        } else {
            this.deleteFeature([state.ellipse.id], { silent: true });
            this.changeMode("simple_select", {}, { silent: true });
        }
    },
    toDisplayFeatures: function (state, geojson, display) {
        const isActivePolygon = geojson.properties.id === state.ellipse.id;
        geojson.properties.active = isActivePolygon ? "true" : "false";
        if (!isActivePolygon) return display(geojson);

        if (!state.center) return;
        return display(geojson);
    },
    onTrash: function (state) {
        this.deleteFeature([state.ellipse.id], { silent: true });
        this.changeMode("simple_select");
    }
};

export default DrawEllipse;
