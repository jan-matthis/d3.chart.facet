d3.chart("FacetBase", {
  initialize: function() {
    var chart = this;

    chart._margin = { top: 0, right: 0, bottom: 65, left: 65 };
    chart._width  = chart.base.attr('width') ? chart.base.attr('width') -
      chart._margin.left - chart._margin.right : 800;
    chart._height = chart.base.attr('height') ? chart.base.attr('height') -
      chart._margin.top - chart._margin.bottom : 800;
    chart._padding = { x: 15, y: 15 };  // horizontal, vertical

    // default keys
    chart._xKey = 'name';
    chart._yKey = 'value';
    chart._colorKey = null;
    chart._symbolKey = null;

    // no facets per default
    chart._xFacetKey = null;
    chart._xFacetCount = 1;
    chart._xFacetMin = 1;
    chart._yFacetKey = null;
    chart._yFacetCount = 1;
    chart._yFacetMin = 1;

    // domains
    chart._xDomain = null;
    chart._yDomain = null;

    // labels
    chart._xLabel = '';
    chart._yLabel = '';
    chart._xFacetLabel = '';  // prefix, unless set to `null`
    chart._yFacetLabel = '';  // prefix, unless set to `null`

    // ticks
    chart._xTicks = null;
    chart._yTicks = null;
    chart._xTicksHide = false;
    chart._yTicksHide = false;

    // scales
    chart._xScale = d3.scale.linear();
    chart._yScale = d3.scale.linear();

    // zooming
    chart._zoomDefault = 'y';
    chart._zoomAxis = chart._zoomDefault;

    // colors
    chart._colorMap = true;
    chart._colorScale = d3.scale.category10();

    // symbols
    // @todo: proper handling of this dependency
    // requires font-awesome, and fa in global namesame
    // http://fortawesome.github.io/Font-Awesome/icons/
    if(typeof(window.fa) == 'undefined') {
      window.console.log('font-awesome missing!');
    }
    chart._symbolScaleIcons = ['circle-o', 'circle', 'dot-circle-o',
      'square-o', 'square', 'plus', 'remove', 'plus-circle', 'plus-square'];

    // clipping uid
    // http://guid.us/GUID/JavaScript
    chart._uid = (((1+Math.random())*0x10000)|0).toString(16).substring(1);

    // suppress redraw
    chart._suppressRedraw = false;

    // make sure things are set
    chart._updateContainerWidth();
    chart._updateContainerHeight();
    chart._updatePlotSize();
    chart._updateScaleRangeX();
    chart._updateScaleRangeY();

    // add a marginalized container
    var container = chart.base.append('g')
      .classed('container', true)
      .attr('transform',
        'translate('+(chart._margin.left)+','+(chart._margin.top)+')');

    // add empty layers
    container.append('g').classed('cells', true);
    container.append('g').classed('axes', true);

    // add an empty tooltip div
    chart._tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    // click function
    chart._clickFun = null;

    // update container on changes
    chart.on('change:margin', function() {
        chart._updateContainer();
    });


    // update scales on dimension changes
    chart.on('change:dimensions', function() {
      //chart._xScale.rangeRoundBands([0, newWidth], 0.1);
      chart._updateContainerWidth();
      chart._updateContainerHeight();
      chart._updatePlotSize();
      chart._updateScaleRangeX();
      chart._updateScaleRangeY();
    });

    chart.on('change:data', function(data) {
      if(chart._suppressRedraw == false) {
        chart._updateLevels(data);
        chart._updateCells(data);
        chart._updateAxes(data);
      }
    });

    chart.on('change:axes', function(data) {
      chart._bindZoomHandler();
    });

    chart.on('change:insert', function(data) {
      chart._bindClickFun();
    });

    chart.on('change:redraw', function(data) {
      // ...
    });
  },

  _updateContainerWidth: function() {
     this.base.attr('width',
      this._width + this._margin.left + this._margin.right);
  },

  _updateContainerHeight: function() {
     this.base.attr('height',
      this._height + this._margin.top + this._margin.bottom);
  },

  _updatePlotSize: function() {
    this._plotSize = { x: this.width() / this._xFacetCount,
                       y: this.height() / this._yFacetCount };
  },

  _updateScaleRangeX: function() {
    this._xScale.range([this._padding.x / 2, this._plotSize.x -
      this._padding.x / 2]);
  },

  _updateScaleRangeY: function() {
    this._yScale.range([this._plotSize.y - this._padding.y / 2,
      this._padding.y / 2]);
  },

  _updateContainer: function() {
    var chart = this;

    var container = chart.base.select('.container')
      .attr('transform',
        'translate('+(chart._margin.left)+','+(chart._margin.top)+')');
  },

  _updateLevels: function(data) {
    var chart = this;

    if(chart._xFacetKey !== null) {
      chart._xFacetUnique = data.map(function(d){ return d[chart._xFacetKey]; })
        .reduce(function(p, v){
          return p.indexOf(v) == -1 ? p.concat(v) : p; }, [])
        .sort();
      chart._xFacetCount = chart._xFacetUnique.length;
      if(chart._xFacetCount < chart._xFacetMin) {
        chart._xFacetCount = chart._xFacetMin;
      }      chart._updatePlotSize();
      chart._updateScaleRangeX();
    } else {
      chart._xFacetUnique = ["default"];
    }

    if(chart._yFacetKey !== null) {
      chart._yFacetUnique = data.map(function(d){ return d[chart._yFacetKey]; })
        .reduce(function(p, v){
          return p.indexOf(v) == -1 ? p.concat(v) : p; }, [])
        .sort();
      chart._yFacetCount = chart._yFacetUnique.length;
      if(chart._yFacetCount < chart._yFacetMin) {
        chart._yFacetCount = chart._yFacetMin;
      }
      chart._updatePlotSize();
      chart._updateScaleRangeY();
    } else {
      chart._yFacetUnique = ["default"];
    }

    // symbols
    if(chart._symbolKey !== null) {
      chart._symbolUnique = data.map(function(d){ return d[chart._symbolKey]; })
        .reduce(function(p, v){
          return p.indexOf(v) == -1 ? p.concat(v) : p; }, [])
        .sort();
      chart._symbolCount = chart._symbolUnique.length;
      // @todo: check if scale suffices
    } else {
      chart._symbolUnique = ["default"];
    }

    // colors
    if(chart._colorKey !== null) {
      chart._colorUnique = data.map(function(d){ return d[chart._colorKey]; })
        .reduce(function(p, v){
          return p.indexOf(v) == -1 ? p.concat(v) : p; }, [])
        .sort();
      chart._colorCount = chart._colorUnique.length;
      // @todo: check if scale suffices
    } else {
      chart._colorUnique = ["default"];
    }

  },

  _updateCells: function(data) {
    var chart = this;

    var subplotIdx = [];
    var i, j;
    for(i=0; i<chart._xFacetCount; i++) {
      for(j=0; j<chart._yFacetCount; j++) {
        subplotIdx.push({xIdx: i, yIdx: j});
      }
    }

    chart.base.select('.cells').selectAll('.child').remove();

    var cell = chart.base.select('.cells').selectAll('.cell')
        .data(subplotIdx)
      .enter().append("g")
        .attr("class", "cell child")
        .attr("transform", function(d) {
          return "translate(" + d.xIdx * chart._plotSize.x + "," +
            d.yIdx * chart._plotSize.y + ")"; })
        .each(function(d) {
          d3.select(this).append("rect")
              .attr("class", "frame outer")
              .attr("x", 0)
              .attr("y", 0)
              .attr("width", chart._plotSize.x)
              .attr("height", chart._plotSize.y);
          d3.select(this)
            .append("rect")
              .attr("class", "frame inner")
              .attr("x", chart._padding.x / 2)
              .attr("y", chart._padding.y / 2)
              .attr("width", chart._plotSize.x - chart._padding.x)
              .attr("height", chart._plotSize.y - chart._padding.y);
          d3.select(this)
            .append("defs")
            .append("clipPath")
              .attr("id", "clip-" + chart._uid.toString() + "-" + d.xIdx.toString() + "-" + d.yIdx.toString())
              .append("rect")
                .attr("x", chart._padding.x / 2)
                .attr("y", chart._padding.y / 2)
                .attr("width", chart._plotSize.x - chart._padding.x)
                .attr("height", chart._plotSize.y - chart._padding.y);
        });
  },

  _updateAxes: function(data) {
    var chart = this;
    var axes = chart.base.select('.axes');

    chart.base.select('.axes').selectAll('.child').remove();

    var xDomain = d3.extent(data, function(d) {return d[chart.xKey()]; });
    if(!chart._xTicksHide) {
      var xTickFormat = d3.format("d")
    } else {
      var xTickFormat = "";
    }

    chart._xAxis = d3.svg.axis()
        .scale(chart._xScale.domain(xDomain).nice())
        .orient("bottom")
        .tickFormat(xTickFormat)
        .tickSize(chart._plotSize.y * chart._yFacetCount);

    if(chart._xTicks !== null) {
      chart._xAxis = chart._xAxis
        .ticks(chart._xTicks);
    }

    var xAxesNew = axes.selectAll(".x.axis")
        .data(chart._xFacetUnique)
      .enter().append("g")
        .attr("class", "x axis child")
        .attr("transform", function(d, i) {
          return "translate(" +
            i * chart._plotSize.x + ", 0)"; })
        .each(function(d) {
          d3.select(this).call(chart._xAxis);
        });
    if(chart._xFacetCount !== 1 && chart._xFacetLabel !== null) {
      xAxesNew.append("text")
        .attr("class", "facet-label child")
        .attr("y", chart._height + chart._padding.y + 15)
        .attr("x", 1/2*chart._padding.x + 1/2*chart._plotSize.x)
        .style("text-anchor", "middle")
        .text(function(d,i) {
          return chart._xFacetLabel + d;
        });
    }

    axes.append("g")
      .append("text")
        .attr("class", "axis-label child")
        .attr("y", chart._height + chart._padding.y + 35)
        .attr("x", chart._width / 2)
        .style("text-anchor", "middle")
        .text(chart._xLabel);

    if(chart._yDomain == null) {
      var yDomain = d3.extent(data, function(d) {
        return d[chart.yKey()]; });
    } else {
      var yDomain = chart._yDomain.split(" ");
    }

    if(chart._yTicksHide == false) {
      var yTickFormat = d3.format("d")
    } else {
      var yTickFormat = "";
    }

    chart._yAxis = d3.svg.axis()
        .scale(chart._yScale.domain(yDomain).nice())
        .orient("left")
        .tickFormat(yTickFormat)
        .tickSize(-chart._plotSize.x * chart._xFacetCount);

    if(chart._yTicks !== null) {
      chart._yAxis = chart._yAxis
        .ticks(chart._yTicks);
    }

    var yAxesNew = axes.selectAll(".y.axis")
        .data(chart._yFacetUnique)
      .enter().append("g")
        .attr("class", "y axis child")
        .attr("transform", function(d, i) {
          return "translate(0," + i * chart._plotSize.y + ")"; })
        .each(function(d, i) {
          d3.select(this).call(chart._yAxis);
        })
    if(chart._yFacetCount !== 1 && chart._yFacetLabel !== null) {
      yAxesNew.append("text")
        .attr("class", "facet-label child")
        .attr("transform", "rotate(-90)")
        .attr("y", -chart._padding.x - 15) // moves into x direction
        .attr("x", -chart._plotSize.y/2) // move into y direction
        .style("text-anchor", "middle")
        .text(function(d) { return chart._yFacetLabel + d });
    }

    axes.append("g")
      .append("text")
        .attr("class", "axis-label child")
        .attr("transform", "rotate(-90)")
        .attr("y", -chart._padding.x - 35) // moves into x direction
        .attr("x", -chart._height / 2) // move into y direction
        .style("text-anchor", "middle")
        .text(chart._yLabel);

    chart.trigger('change:axes');
  },

  _bindZoomHandler: function() {
    var chart = this;
    var axes = chart.base.select('.axes');

    var zoom = {};
    zoom['x'] = d3.behavior.zoom()
      .x(chart._xScale)
      .scaleExtent([1, 1000])
      .on("zoom", function() {

        /*
        // @todo: limit panning

        // ...
        var t = zoomX.translate(),
            tx = t[0],
            ty = t[1];

        tx = Math.min(tx, 0);
        tx = Math.max(tx, 20);
        zoomX.translate([tx, 0]);
        */

        axes.selectAll(".x.axis")
          .each(function(d) {
            d3.select(this).call(chart._xAxis);
          });

        chart.trigger('change:zoom');
      });

    zoom['y'] = d3.behavior.zoom()
      .y(chart._yScale)
      .scaleExtent([1, 100])
      .on("zoom", function() {
        axes.selectAll(".y.axis")
          .each(function(d) {
            d3.select(this).call(chart._yAxis);
          });
        chart.trigger('change:zoom');
      });

    zoom['xy'] = d3.behavior.zoom()
      .y(chart._yScale)
      .x(chart._xScale)
      .scaleExtent([1, 100])
      .on("zoom", function() {
        axes.selectAll(".y.axis")
          .each(function(d) {
            d3.select(this).call(chart._yAxis);
          });
        axes.selectAll(".x.axis")
          .each(function(d) {
            d3.select(this).call(chart._xAxis);
          });
        chart.trigger('change:zoom');
      });

    if(chart._zoomDefault !== null) {
      chart.base.call(zoom[chart._zoomDefault]);

      if(chart._zoomDefault !== 'xy') {
        d3.select("body")
          .on("keydown", function() {
            // window.console.log(d3.event.keyCode);  // osx: 91 (cmd), 17 (ctrl), 32 (space)
            if(d3.event.keyCode == 91 || d3.event.keyCode == 17 || d3.event.keyCode == 32) {
              var zoomAlternative = (chart._zoomAxis == 'x') ? 'y' : 'x';
              chart.base.call(zoom[zoomAlternative]);
              chart._zoomAxis = zoomAlternative;
            }
          })
      }
    }
    
  },

  _tooltipShow : function(data) {
    var chart = this;

    chart._tooltip
      .style("display", "inline")
      .transition()
      .duration(500)
      .style("opacity", 0.9);

    chart._tooltip
      .style("left", (d3.event.pageX + 20) + "px")
      .style("top", (d3.event.pageY - 12) + "px");

    chart._tooltipFun(data);
  },

  _tooltipFun : function(data) {
    var chart = this;

    chart._tooltip
      .html(data[chart.yKey()]);
  },

  _tooltipHide : function() {
    var chart = this;

    chart._tooltip
      .transition()
      .duration(50)
      .style("opacity", 0.0)
      .style("display", "none");
  },

  _bindClickFun : function() {
    var chart = this;

    chart.base.selectAll('.click')
      .on("click", function (d) {
        if(chart._clickFun !== null) {
          chart._clickFun(d);
        } else {
          window.console.log(d);
        }
      });
  },

  width: function(newWidth) {
    if (arguments.length === 0) {
      return this._width;
    }

    if (this._width !== newWidth) {
      var oldWidth = this._width;
      this._width = newWidth;
      this.trigger('change:width', newWidth, oldWidth);
      this.trigger('change:dimensions');
    }

    return this;
  },

  height: function(newHeight) {
    if (arguments.length === 0) {
      return this._height;
    }

    if (this._height !== newHeight) {
      var oldHeight = this._height;
      this._height = newHeight;
      this.trigger('change:height', newHeight, oldHeight);
      this.trigger('change:dimensions');
    }

    return this;
  },

  margin: function(top, right, left, bottom) {
    if (arguments.length === 0) {
      return this._margin;
    }

    // @todo: account for case of 1-3 arguments

    var oldMargin = this._margin;
    var newMargin = { top: top, right: right, left: left, bottom: bottom };
    this._margin = newMargin;
    this.trigger('change:dimensions');
    this.trigger('change:margin', newMargin, oldMargin);

    return this;
  },

  padding: function(xPadding, yPadding) {
    if (arguments.length === 0) {
      return this._padding;
    }

    if (arguments.length === 1) {
      yPadding = xPadding;
    }

    if (this._padding.x !== xPadding || this._padding.y !== yPadding) {
      var oldPadding = this._padding;
      var newPadding = { x: xPadding, y: yPadding };
      this._padding = newPadding;
      this.trigger('change:padding', newPadding, oldPadding);
      this.trigger('change:dimensions');
    }

    return this;
  },

  x: function(newKey) { this.xKey(newKey); return this; },

  xKey: function(newKey) {
    if (arguments.length === 0) {
      return this._xKey;
    }
    if (this._xKey !== newKey) {
      var oldKey = this._xKey;
      this._xKey = newKey;
      this.trigger('change:xKey', newKey, oldKey);
    }
    return this;
  },

  xDomain: function(newDomain) {
    if (arguments.length === 0) {
      return this._xDomain;
    }
    if (this._xDomain !== newDomain) {
      var oldDomain = this._xDomain;
      this._xDomain = newDomain;
      this.trigger('change:xDomain', newDomain, oldDomain);
    }
    return this;
  },

  xLabel: function(newLabel) {
    if (arguments.length === 0) {
      return this._xLabel;
    }
    if (this._newLabel !== newLabel) {
      var oldLabel = this._xLabel;
      this._xLabel = newLabel;
      this.trigger('change:xLabel', newLabel, oldLabel);
    }
    return this;
  },

  xTicks: function(newCount) {
    if (arguments.length === 0) {
      return this._xTicks;
    }
    if (this._xTicks !== newCount) {
      var oldCount = this._xTicks;
      this._xTicks = newCount;
      this.trigger('change:xTicks', newCount, oldCount);
    }
    return this;
  },

  xTicksHide: function(newSetting) {
    if (arguments.length === 0) {
      return this._xTicksHide;
    }
    if (this._xTicksHide !== newSetting) {
      var oldSetting = this._xTicksHide;
      this._xTicksHide = newSetting;
      this.trigger('change:xTicksHide', newSetting, oldSetting);
    }
    return this;
  },

  y: function(newKey) { this.yKey(newKey); return this; },

  yKey: function(newKey) {
    if (arguments.length === 0) {
      return this._yKey;
    }
    if (this._yKey !== newKey) {
      var oldKey = this._yKey;
      this._yKey = newKey;
      this.trigger('change:yKey', newKey, oldKey);
    }
    return this;
  },

  yDomain: function(newDomain) {
    if (arguments.length === 0) {
      return this._yDomain;
    }
    if (this._yDomain !== newDomain) {
      var oldDomain = this._yDomain;
      this._yDomain = newDomain;
      this.trigger('change:yDomain', newDomain, oldDomain);
    }
    return this;
  },

  yLabel: function(newLabel) {
    if (arguments.length === 0) {
      return this._yLabel;
    }
    if (this._newLabel !== newLabel) {
      var oldLabel = this._yLabel;
      this._yLabel = newLabel;
      this.trigger('change:yLabel', newLabel, oldLabel);
    }
    return this;
  },

  yTicks: function(newCount) {
    if (arguments.length === 0) {
      return this._yTicks;
    }
    if (this._yTicks !== newCount) {
      var oldCount = this._yTicks;
      this._yTicks = newCount;
      this.trigger('change:yTicks', newCount, oldCount);
    }
    return this;
  },

  yTicksHide: function(newSetting) {
    if (arguments.length === 0) {
      return this._yTicksHide;
    }
    if (this._yTicksHide !== newSetting) {
      var oldSetting = this._yTicksHide;
      this._yTicksHide = newSetting;
      this.trigger('change:yTicksHide', newSetting, oldSetting);
    }
    return this;
  },

  ticksHide: function(newSetting) {
    if (arguments.length === 0) {
      return null
    }
    this.xTicksHide(newSetting);
    this.yTicksHide(newSetting);
    return this;
  },

  color: function(newKey) { this.colorKey(newKey); return this; },

  colorKey: function(newKey) {
    if (arguments.length === 0) {
      return this._colorKey;
    }
    if (this._colorKey !== newKey) {
      var oldKey = this._colorKey;
      this._colorKey = newKey;
      this.trigger('change:colorKey', newKey, oldKey);
    }
    return this;
  },

  colorMap: function(newSetting) {
    if (arguments.length === 0) {
      return this._colorMap;
    }
    if (this._colorMap !== newSetting) {
      var oldSetting = this._colorMap;
      this._colorMap = newSetting;
      this.trigger('change:colorKey', newSetting, oldSetting);
    }
    return this;
  },

  symbol: function(newKey) { this.symbolKey(newKey); return this; },

  symbolKey: function(newKey) {
    if (arguments.length === 0) {
      return this._symbolKey;
    }
    if (this._symbolKey !== newKey) {
      var oldKey = this._symbolKey;
      this._symbolKey = newKey;
      this.trigger('change:symbolKey', newKey, oldKey);
    }
    return this;
  },

  xFacet: function(newKey) { this.xFacetKey(newKey); return this; },

  xFacetKey: function(newKey) {
    if (arguments.length === 0) {
      return this._xFacetKey;
    }
    if (this._xFacetKey !== newKey) {
      var oldKey = this._xFacetKey;
      this._xFacetKey = newKey;
      this.trigger('change:xFacetKey', newKey, oldKey);
    }
    return this;
  },

  xFacetLabel: function(newPrefix) {
    if (arguments.length === 0) {
      return this._xFacetLabel;
    }
    if (this._xFacetLabel !== newPrefix) {
      var oldPrefix = this._xFacetLabel;
      this._xFacetLabel = newPrefix;
      this.trigger('change:xFacetLabel', newPrefix, oldPrefix);
    }
    return this;
  },

  xFacetMin: function(newMin) {
    if (arguments.length === 0) {
      return this._xFacetMin;
    }
    if (this._xFacetMin !== newMin) {
      var oldMin = this._xFacetMin;
      this._xFacetMin = newMin;
      this.trigger('change:xFacetMin', newMin, oldMin);
    }
    return this;
  },

  yFacet: function(newKey) { this.yFacetKey(newKey); return this; },

  yFacetKey: function(newKey) {
    if (arguments.length === 0) {
      return this._yFacetKey;
    }
    if (this._yFacetKey !== newKey) {
      var oldKey = this._yFacetKey;
      this._yFacetKey = newKey;
      this.trigger('change:yFacetKey', newKey, oldKey);
    }
    return this;
  },

  yFacetLabel: function(newPrefix) {
    if (arguments.length === 0) {
      return this._yFacetLabel;
    }
    if (this._yFacetLabel !== newPrefix) {
      var oldPrefix = this._yFacetLabel;
      this._yFacetLabel = newPrefix;
      this.trigger('change:yFacetLabel', newPrefix, oldPrefix);
    }
    return this;
  },

  yFacetMin: function(newMin) {
    if (arguments.length === 0) {
      return this._yFacetMin;
    }
    if (this._yFacetMin !== newMin) {
      var oldMin = this._yFacetMin;
      this._yFacetMin = newMin;
      this.trigger('change:yFacetMin', newMin, oldMin);
    }
    return this;
  },

  click: function(newFun) { this.clickFun(newFun); return this; },

  clickFun: function(newFun) {
    if (arguments.length === 0) {
      return this._clickFun;
    }
    if (this._clickFun !== newFun) {
      var oldFun = this._clickFun;
      this._clickFun = newFun;
      this.trigger('change:clickFun', newFun, oldFun);
    }
    return this;
  },

  tooltipFun: function(newFun) {
    if (arguments.length === 0) {
      return this._tooltipFun;
    }
    if (this._tooltipFun !== newFun) {
      var oldFun = this._tooltipFun;
      this._tooltipFun = newFun;
      this.trigger('change:tooltipFun', newFun, oldFun);
    }
    return this;
  },  

  zoom: function(newDirection) {
    this.zoomDefault(newDirection); return this; },

  zoomDefault: function(newDirection) {
    if (arguments.length === 0) {
      return this._zoomDefault;
    }
    if (this._zoomDefault !== newDirection) {
      var oldDirection = this._zoomDefault;
      this._zoomDefault = newDirection;
      this.trigger('change:zoomDefault', newDirection, oldDirection);
    }
    return this;
  },

  suppress: function(newSetting) {
    this.suppressRedraw(newSetting); return this; },

  suppressRedraw: function(newSetting) {
    if (arguments.length === 0) {
      return this._suppressRedraw;
    }
    if (this._suppressRedraw !== newSetting) {
      var oldSetting = this._suppressRedraw;
      this._suppressRedraw = newSetting;
      this.trigger('change:suppressRedraw', newSetting, oldSetting);
    }
    return this;
  }


});
