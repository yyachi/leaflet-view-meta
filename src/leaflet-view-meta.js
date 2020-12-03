L.Control.ViewMeta = L.Control.extend({
    options: {
        position: `topright`,
        placeholderHTML: `-----`
    },
    onRemove: function () {
        L.DomUtil.remove(this.container);
    },

    onAdd: function (map) {
        this.map = map;
        this.container = L.DomUtil.create(`div`, `leaflet-view-meta`);
        L.DomEvent.disableClickPropagation(this.container);
        L.DomEvent.on(this.container, `control_container`, function (e) {
            L.DomEvent.stopPropagation(e);
        });
        L.DomEvent.disableScrollPropagation(this.container);

        let table = L.DomUtil.create(
            `table`,
            `leaflet-view-meta-table`,
            this.container
        );

        // map center
        this.addDividerRow(table, `Current View`);
        if (this.options.enableUserInput) {
            this.ix_e = this.addInputRow(table, `X (μm)`, "inputX");
            this.iy_e = this.addInputRow(table, `Y (μm)`, "inputY");
        } else {
            this.x_e = this.addDataRow(table, `X (μm)`);
            this.y_e = this.addDataRow(table, `Y (μm)`);
        }
        //this.addDividerRow(table, `Zoom`);
        if (this.options.enableUserInput) {
            this.iz_e = this.addInputRow(table, `Zoom (level)`, "inputZ");
        } else {
            this.z_e = this.addDataRow(table, `Zoom (level)`);
        }
        this.w_e = this.addDataRow(table, `Width (μm)`);
        this.h_e = this.addDataRow(table, `Height (μm)`);
        this.m_e = this.addDataRow(table, `Magnification`);
        if (this.options.enableUserInput) {
            L.DomEvent.on(this.iz_e, 'keyup', this._handleKeypress, this);
            L.DomEvent.on(this.iz_e, 'blur', this._handleSubmit, this);
            L.DomEvent.on(this.ix_e, 'keyup', this._handleKeypress, this);
            L.DomEvent.on(this.ix_e, 'blur', this._handleSubmit, this);
            L.DomEvent.on(this.iy_e, 'keyup', this._handleKeypress, this);
            L.DomEvent.on(this.iy_e, 'blur', this._handleSubmit, this);
        }
        this.map.on(`resize`, () => this.update());
        this.map.on(`zoomend`, () => this.update());
        this.map.on(`dragend`, () => this.update());

        this.urlParams = new URLSearchParams(window.location.search);
        this.parseParams();

        return this.container;
    },
    addDividerRow: function (tableElement, labelString) {
        let tr = tableElement.insertRow();
        let tdDivider = tr.insertCell();
        tdDivider.colSpan = 2;
        tdDivider.innerText = labelString;
    },
    addDataRow: function (tableElement, labelString) {
        let tr = tableElement.insertRow();
        let tdLabel = tr.insertCell();
        tdLabel.innerText = labelString;
        let tdData = tr.insertCell();
        tdData.innerHTML = this.options.placeholderHTML;
        return tdData;
    },
    addInputRow: function (tableElement, labelString, classname) {
        let tr = tableElement.insertRow();
        let tdLabel = tr.insertCell();
        tdLabel.innerText = labelString;
        let tdData = tr.insertCell();
        _inputcontainer = L.DomUtil.create("span", "uiElement input", tdData);
        var input = L.DomUtil.create("input", classname, _inputcontainer);
        input.type = "text";
        L.DomEvent.disableClickPropagation(input);
        input.value = this.options.placeholderHTML;
        return input;
    },

    _handleKeypress: function (e) {
        console.log("handleKeypress")
        switch (e.keyCode) {
            case 27: //Esc
                break;
            case 13: //Enter
                this._handleSubmit();
                break;
            default: //All keys
                //this._handleSubmit();
                break;
        }
    },

    _handleSubmit: function () {
        var opts = this.options;
        let x, y, z, lat, lng;
        try {
            x = +this.ix_e.value.replace(/,/g, '');
            y = +this.iy_e.value.replace(/,/g, '');
            z = +this.iz_e.value

            if (x && y && z && opts.world2latLng) {
                ll = opts.world2latLng([x, y])
                this.map.setView(ll, z);
                this.urlParams.set("x", x);
                this.urlParams.set("y", y);
                this.urlParams.set("z", z);
                window.history.replaceState(
                    {},
                    "",
                    `?${this.urlParams.toString()}`
                );
            }
        } catch (e) {
            console.log(e);
        }
    },

    parseParams: function () {
        var opts = this.options;
        let x, y, z, lat, lng, nb, wb, sb, eb, nw_bound, se_bound, bounds;
        try {
            x = +this.urlParams.get("x").replace(/,/g, '');
            y = +this.urlParams.get("y").replace(/,/g, '');
            z = +this.urlParams.get("z");

            if (x && y && opts.world2latLng) {
                ll = opts.world2latLng([x, y])
                this.map.setView(ll, z);
            }

        } catch (e) {
            console.log(e);
        }
    },
    update: function () {
        var opts = this.options;
        var center_xy;
        let center = this.map.getCenter();
        let bounds = this.map.getBounds();
        let zoom = this.map.getZoom();
        let latStr = this.formatNumber(center.lat);
        let lngStr = this.formatNumber(center.lng);

        let nbStr = this.formatNumber(bounds.getNorth());
        let sbStr = this.formatNumber(bounds.getSouth());
        let ebStr = this.formatNumber(bounds.getEast());
        let wbStr = this.formatNumber(bounds.getWest());
        let zStr = String(zoom);
        if (this.options.enableUserInput) {
            this.iz_e.value = zStr;
        } else {
            this.z_e.innerText = zStr;
        }

        if (opts.latLng2world) {
            world_c = opts.latLng2world(center);
            ne = { lat: bounds.getNorth(), lng: bounds.getEast() };
            sw = { lat: bounds.getSouth(), lng: bounds.getWest() };
            world_ne = opts.latLng2world(ne);
            world_sw = opts.latLng2world(sw);
            world_w = world_ne[0] - world_sw[0];
            world_h = world_ne[1] - world_sw[1];
            mag = 120000 / world_w;
            let xStr = this.formatNumber(world_c[0]);
            let yStr = this.formatNumber(world_c[1]);
            let tbStr = this.formatNumber(world_ne[1]);
            let rbStr = this.formatNumber(world_ne[0]);
            let bbStr = this.formatNumber(world_sw[1]);
            let lbStr = this.formatNumber(world_sw[0]);
            let hStr = this.formatNumber(world_h);
            let wStr = this.formatNumber(world_w);
            let mStr = this.formatNumber(mag);
            this.m_e.innerText = mStr;
            if (this.options.enableUserInput) {
                this.ix_e.value = xStr;
                this.iy_e.value = yStr;
            } else {
                this.x_e.innerText = xStr;
                this.y_e.innerText = yStr;
            }
            this.w_e.innerText = wStr;
            this.h_e.innerText = hStr;
            //this.tb_e.innerText = tbStr;
            //this.bb_e.innerText = bbStr;  
            //this.rb_e.innerText = rbStr;
            //this.lb_e.innerText = lbStr;
            this.urlParams.set("x", xStr.replace(/,/g, ''));
            this.urlParams.set("y", yStr.replace(/,/g, ''));
            this.urlParams.set("z", zStr);
        }
        window.history.replaceState(
            {},
            "",
            `?${this.urlParams.toString()}`
        );
    },

    formatNumber: function (num) {
        return num.toLocaleString({
            minimumFractionDigits: 3,
            maximumFractionDigits: 3
        });
    }
});

L.control.viewMeta = function (options) {
    return new L.Control.ViewMeta(options);
};
