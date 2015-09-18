(function() {
  // YOUR SAMPLE CHART USAGE GOES HERE.

  // scatter example
  window.genData = function() {
    dataset = [];
    for (var i = 0; i < Math.round(Math.random() * 200); i++) {
        dataset.push({ x: Math.random() * 10,
                       y: Math.random() * 30,
                       xf: Math.round(Math.random() * 2),
                       yf: Math.round(Math.random() * 2),
                       symb: Math.round(Math.random() * 6),
                       col: Math.round(Math.random() * 5)
                     });
    }
    return dataset;
  }

  window.dataset = genData();

  var myChart = d3.select('#vis')
    .append('svg')
    .chart('FacetScatter')
      .width(500)
      .height(400)
      .symbol('symb')
      .color('col')
      .x('x')
      .y('y')
      .xFacet('xf')
      .yFacet('yf')
      //.xFacetLabel('xF ')
      //.yFacetLabel('yF ')
      .xLabel('xLabel')
      .yLabel('yLabel')
      .xTicks(4)
      .yTicks(4)
      .zoom('y');

  window.chart = myChart;
  chart.draw(dataset);

  /*

  // traceplot example
  window.genData = function() {
    dataset = [];
    for (var i = 0; i < 200000; i++) { //
        dataset.push({ x: Math.random() * 20000,
                       y: Math.random() * 30,
                       col: Math.round(Math.random() * 1),
                       yF: Math.round(Math.random() * 1),
                       xF: Math.round(Math.random() * 1)
                     });
    }
    dataset.sort(function(a, b) {
      return a.x - b.x;
    })
    return dataset;
  }

  window.dataset = genData();

  var myChart = d3.select('#vis')
    .append('svg')
    .chart('FacetTrace')
      .width(1300)
      .height(700)
      .color('col')
      .x('x')
      .y('y')
      .yFacet('yF')
      .yFacetLabel('Chan: ')
      .xFacet('xF')
      .xFacetLabel('Chan: ')
      .threshold(500)
      .zoom('x')
      .xLabel('Time (ms)')
      .yLabel('Potential (aU)')
      .clickFun(function(d) {
        console.log(d);
      });

  */

  window.chart = myChart;

  chart.draw(dataset);

}());
