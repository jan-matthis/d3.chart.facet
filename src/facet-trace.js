d3.chart('FacetBase').extend('FacetTrace', {

  initialize: function() {
    var chart = this;

    chart._dsThreshold = 1000;
    chart._lineMin = 100;  // @todo: add to API

    chart.on('change:zoom', function() {  // Emitted by FacetBase
      chart._redrawPoints(); 
    });

    chart.layer('features', chart.base.select('g')
      .append('g').classed('features', true), {
        dataBind: function(data) {
          chart._data = data;  // (*) 
          return this.selectAll(".dot").data(data);
        },
        insert: function() {
          // Data is bound to instance (at * above), since it could 
          // potentially contain a lot of objects.
          // Normally, data would be appended to DOM instead, 
          // in this insert function.
          return this;
        },
        events: {
          'enter': function() {
            chart._redrawPoints();
          }
      }
    });
  },

  transform: function(data) {
    var chart = this;
    chart.trigger('change:data', data);  // FacetBase will draw cells
    return data;
  },

  _colorScaleG: function(n) {
    // http://bl.ocks.org/aaizemberg/78bd3dade9593896a59d
    var g = ["#0099C6", "#DD4477", "#000", "#109618", "#990099", "#0099c6", 
             "#dd4477", "#66aa00", "#b82e2e", "#316395", "#994499", "#22aa99", 
             "#aaaa11", "#6633cc", "#e67300", "#8b0707", "#651067", "#329262", 
             "#5574a6", "#3b3eac"];
    return g[n % g.length];
  },

  _redrawPoints: function() {
    var chart = this;

    var xKey = chart.xKey();
    var yKey = chart.yKey();
    var cKey = chart.colorKey();
    var sKey = chart.symbolKey();

    // bounds
    var lowerBound = Math.floor(chart._xAxis.scale().domain()[0]);
    var upperBound = Math.ceil(chart._xAxis.scale().domain()[1]);

    // remove elements
    chart.base.selectAll('path.line').remove();
    chart.base.selectAll('.dot').remove();

    var lineMaker = d3.svg.line()
      .x(function(d) { return chart._xScale(d[xKey]); })
      .y(function(d) { return chart._yScale(d[yKey]); });

    for(xIdx = 0; xIdx+1 <= chart._xFacetCount; xIdx++) {
      for(yIdx = 0; yIdx+1 <= chart._yFacetCount; yIdx++) {

        var dataSel = chart._data;
        
        if(chart._yFacetCount > 1) {
          dataSel = dataSel.filter(function(d,i) {
            return d[chart._yFacetKey] == chart._yFacetUnique[yIdx] ? this : null;
          });
        }

        if(chart._xFacetCount > 1) {
          dataSel = dataSel.filter(function(d,i) {
            return d[chart._xFacetKey] == chart._xFacetUnique[yIdx] ? this : null;
          });
        }

        var dataSelCount = dataSel.length;

        if(chart._dsThreshold !== null) {
          var dataDs = largestTriangleThreeBuckets(
              dataSel.filter(function(d,i) { 
                return d.x >= lowerBound && d.x <= upperBound ? this : null; }), 
              chart._dsThreshold, xKey, yKey);
        } else {
          var dataDs = dataSel;
        }

        if(dataSelCount > chart._lineMin) {
          console.log('cnt: ' + dataSelCount);
          chart.base.select('.features').append("path")
            .datum(dataDs)
            .attr("class", "line")
            .attr("d", lineMaker)
            .attr("transform", "translate(" + xIdx * chart._plotSize.x + "," +
              yIdx * chart._plotSize.y + ")")
            .style('clip-path','url(#clip-' + chart._uid.toString() + '-' + xIdx +'-' + yIdx+')');

          var dotRadius = 1.5;
        } else {
          var dotRadius = 5;
        }

        chart.base.select('.features').selectAll('.dotNew')
          .data(dataDs)
        .enter().append("circle")
          .attr("class", "dot")
          .attr("cx", function(d) { return chart._xScale(d[xKey]); })
          .attr("cy", function(d) { return chart._yScale(d[yKey]); })
          .attr("r", dotRadius)
          .attr("transform", "translate(" + xIdx * chart._plotSize.x + "," +
            yIdx * chart._plotSize.y + ")")
          .style('clip-path','url(#clip-' + chart._uid.toString() + '-' + xIdx +'-' + yIdx+')')
          .style("fill", function(d) { 
            if(chart.colorMap() === true) {
              return chart._colorScaleG(chart._colorUnique.indexOf(d[cKey]))
            } else {
              return d[cKey]
            }
          });

      }
    }

  },

  threshold: function(newThreshold) {
    this.dsThreshold(newThreshold); return this; },

  dsThreshold: function(newThreshold) {
    if (arguments.length === 0) {
      return this._dsThreshold;
    }
    if (this._dsThreshold !== newThreshold) {
      var oldThreshold = this._dsThreshold;
      this._dsThreshold = newThreshold;
      this.trigger('change:dsThreshold', newThreshold, oldThreshold);
    }
    return this;
  }

});