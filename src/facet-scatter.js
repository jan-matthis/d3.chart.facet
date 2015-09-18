d3.chart('FacetBase').extend('FacetScatter', {

  initialize: function() {
    var chart = this;

    chart._colorScale = ["#0099C6", "#555", "#109618", "#990099", "#0099c6", 
             "#dd4477", "#66aa00", "#b82e2e", "#316395", "#994499", "#22aa99", 
             "#aaaa11", "#6633cc", "#e67300", "#8b0707", "#651067", "#329262", 
             "#5574a6", "#3b3eac"];

    chart.on('change:zoom', function() {  // Emitted by FacetBase
      chart._redrawPoints(); 
    });

    chart.layer('features', chart.base.select('g')
      .append('g').classed('features', true), {
        dataBind: function(data) {
          var features = this;
          return this.selectAll(".dot").data(data);
        },
        insert: function() {
          var features = this;
          icons = features.append("text").classed("text-icon click dot", true);
          chart.trigger('change:insert');
          return icons;
        },
        events: {
          'enter': function() {
            chart._redrawPoints();
          },
          'exit': function() {
            this.remove();
          }
      }
    });
  },

  transform: function(data) {
    var chart = this;
    chart.trigger('change:data', data);  // FacetBase will draw cells
    return data;
  },

  _redrawPoints: function() {
    var chart = this;

    var xKey = chart.xKey();
    var yKey = chart.yKey();
    var cKey = chart.colorKey();
    var sKey = chart.symbolKey();

    chart.base.selectAll(".text-icon")
      .each(function(d) {
        var xIdx = 0;
        var yIdx = 0;
        if(chart.xFacetKey() !== null) {
          var xIdx = chart._xFacetUnique.indexOf(d[chart.xFacetKey()]);
        }
        if(chart.yFacetKey() !== null) {
          var yIdx = chart._yFacetUnique.indexOf(d[chart.yFacetKey()]);
        }
        
        d3.select(this)
          .attr("transform", "translate(" + xIdx * chart._plotSize.x + "," +
          yIdx * chart._plotSize.y + ")")
          .style('clip-path','url(#clip-'+ chart._uid.toString() + '-' + xIdx +'-' + yIdx+')')
          .attr("x", chart._xScale(d[xKey]) )
          .attr("y", chart._yScale(d[yKey]) )
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'central')
          .attr('font-family', 'FontAwesome')
          .attr('font-size', '1em')
          .text(function(d) { 
            if(sKey !== null) {
              return fa[chart._symbolScaleIcons[chart._symbolUnique.indexOf(
                d[sKey])]];
            } else {
              return fa['circle-o']; 
            }
          })
          .attr('opacity', 0.8)
          .on("mouseover", function(d) {
              chart._tooltipShow(d); 
              d3.select(this).attr('font-size', '1.5em')
            })
          .on("mouseout", function() { 
              chart._tooltipHide();
              d3.select(this).attr('font-size', '1em')
          });

        if(cKey !== null) {
          if(chart.colorMap() === true) {
            var iconColor = chart._colorScale[
              chart._colorUnique.indexOf(d[cKey])];
          } else {
            var iconColor = d[cKey];
          }
          d3.select(this)
            .style('fill', iconColor);
        } else {
          d3.select(this)
            .style('fill', '#000');
        }
 
      })
      .sort(function(a, b){
        if(sKey !== null) {
          return chart._symbolUnique.indexOf(b[sKey]) - 
            chart._symbolUnique.indexOf(a[sKey]);
        } else {
          return -1;
        }
      })
      .sort(function(a, b){
        if(chart._colorKey !== null) {
          return chart._colorUnique.indexOf(b[cKey]) - 
            chart._colorUnique.indexOf(a[cKey]);
        } else {
          return -1;
        }
      });

  }

});