
/**
 * ScatterAbstract is the class that will be extended by dot, line, stackedline and area charts.
 */
pvc.ScatterAbstract = pvc.CategoricalAbstract.extend({

    scatterChartPanel : null,
    
    constructor: function(o){

        this.base(o);

        var _defaults = {
            showDots: false,
            showLines: false,
            showAreas: false,
            showValues: false,
            axisOffset: 0.05,
            valuesAnchor: "right",
            stacked: false,
            panelSizeRatio: 1
        };


        // Apply options
        $.extend(this.options, _defaults, o);
    },

    /* @override */
    createCategoricalPanel: function(){
        pvc.log("Prerendering in ScatterAbstract");

        this.scatterChartPanel = new pvc.ScatterChartPanel(this, {
            stacked: this.options.stacked,
            showValues: this.options.showValues,
            valuesAnchor: this.options.valuesAnchor,
            showLines: this.options.showLines,
            showDots: this.options.showDots,
            showAreas: this.options.showAreas,
            showTooltips: this.options.showTooltips,
            orientation: this.options.orientation,
            timeSeries: this.options.timeSeries,
            timeSeriesFormat: this.options.timeSeriesFormat
        });

        return this.scatterChartPanel;
    }
});

/**
 * Dot Chart
 *
 */
pvc.DotChart = pvc.ScatterAbstract.extend({

    constructor: function(o){

        this.base();

        var _defaults = {
            showDots: true
        };

        // Apply options
        $.extend(this.options, _defaults, o);
    }
});

/**
 * Line Chart
 */
pvc.LineChart = pvc.ScatterAbstract.extend({

    constructor: function(o){

        this.base();

        var _defaults = {
            showLines: true
        };

        // Apply options
        $.extend(this.options, _defaults, o);
    }
});

/**
 * Stacked Line Chart
 */
pvc.StackedLineChart = pvc.ScatterAbstract.extend({

    constructor: function(o){

        this.base();

        var _defaults = {
            showLines: true,
            stacked: true
        };

        // Apply options
        $.extend(this.options, _defaults, o);
    }
});


/**
 * Stacked Area Chart
 */
pvc.StackedAreaChart = pvc.ScatterAbstract.extend({

    constructor: function(o){

        this.base();

        var _defaults = {
            showAreas: true,
            stacked: true
        };

        // Apply options
        $.extend(this.options, _defaults, o);
    }
});

/*
 * Scatter chart panel. Base class for generating the other xy charts. Specific options are:
 * <i>showDots</i> - Show or hide dots. Default: true
 * <i>showAreas</i> - Show or hide dots. Default: false
 * <i>showLines</i> - Show or hide dots. Default: true
 * <i>showValues</i> - Show or hide line value. Default: false
 * <i>stacked</i> -  Stacked? Default: false
 *
 * Has the following protovis extension points:
 *
 * <i>chart_</i> - for the main chart Panel
 * <i>line_</i> - for the actual line
 * <i>linePanel_</i> - for the panel where the lines sit
 * <i>lineDot_</i> - the dots on the line
 * <i>lineLabel_</i> - for the main line label
 */
pvc.ScatterChartPanel = pvc.CategoricalAbstractPanel.extend({

    pvLine: null,
    pvArea: null,
    pvDot: null,
    pvLabel: null,
    pvCategoryPanel: null,

    timeSeries: false,
    timeSeriesFormat: "%Y-%m-%d",

    stacked: false,
    showAreas: false,
    showLines: true,
    showDots: true,
    showValues: true,
    
    valuesAnchor: "right",

//    constructor: function(chart, options){
//        this.base(chart,options);
//    },
  
    /**
     * @override
     */
    createCore: function(){

        this.pvPanel.zOrder(0);
        
        var myself = this,
            chart = this.chart,
            o  = chart.options,
            de = chart.dataEngine;

        if(this.showTooltips || o.clickable){
            this.pvPanel
              .events("all")
              .event("mousemove", pv.Behavior.point(Infinity));
        }

        var isVertical = this.isOrientationVertical(),
            anchor = isVertical ? "bottom" : "left";

        // Extend body, resetting axisSizes

        var lScale = chart.getLinearScale(true),
            oScale = null, // ~ warning
            tScale = null, // ~ warning 
            parser = null, // - warning
            categoryComparer = null; // ~ warning

        if(this.timeSeries){
            tScale = chart.getTimeseriesScale(true, true);
            parser = pv.Format.date(this.timeSeriesFormat);
            categoryComparer = pvc.createDateComparer(parser, function(d){
                return d.category;
            });
        } else {
            oScale = chart.getOrdinalScale(true);
        }

        var colors = chart.colors(pv.range(de.getSeriesSize()));
        var colorFunc = function(d){
            // return colors(d.serieIndex)
            return colors(de.getVisibleSeriesIndexes()[this.parent.index]);
        };

        // Stacked?
        if (this.stacked){
            var dataSet = pvc.padMatrixWithZeros(de.getVisibleTransposedValues());
            this.pvScatterPanel = this.pvPanel.add(pv.Layout.Stack)
                .layers(dataSet)
                // Stacked Vertical charts show series from
                //  top to bottom (according to the legend)
                .order(isVertical  ? "reverse"  : null)
                [isVertical ? "x" : "y"](
                    this.timeSeries ?
                        function(){
                            return tScale(parser.parse(de.getCategoryByIndex(this.index)));
                        } :
                        function(){
                            return oScale(de.getCategoryByIndex(this.index)) + 
                                   oScale.range().band/2;
                        })
                [anchor](lScale(0))
                [isVertical ? "y" : "x"](function(d){
                    return chart.animate(0, lScale(d) - lScale(0));
                });

            this.pvArea = this.pvScatterPanel.layer.add(pv.Area)
                                .fillStyle(this.showAreas?colorFunc:null);

            this.pvLine = this.pvArea.anchor(pvc.BasePanel.oppositeAnchor[anchor]).add(pv.Line)
                                .lineWidth(this.showLines?1.5:0.001);
        } else {

            this.pvScatterPanel = this.pvPanel.add(pv.Panel)
                .data(de.getVisibleSeriesIndexes());

            this.pvArea = this.pvScatterPanel.add(pv.Area)
                .fillStyle(this.showAreas ? colorFunc : null);

            this.pvLine = this.pvArea.add(pv.Line)
                .data(function(seriesIndex){
                    return de.getObjectsForSeriesIndex(seriesIndex, categoryComparer);
                 })
                .lineWidth(this.showLines? 1.5 : 0.001)
                .segmented(true)
                .visible(function(d) { return d.value != null; })
                [pvc.BasePanel.relativeAnchor[anchor]](
                    this.timeSeries ?
                        function(dataItem){ return tScale(parser.parse(dataItem.category)); } :
                        function(dataItem){ return oScale(dataItem.category) + oScale.range().band/2; })
                [anchor](function(dataItem){
                    return chart.animate(0, lScale(dataItem.value));
                });
        }

        this.pvLine
            .strokeStyle(colorFunc)
            .lineJoin(null)
            .text(function(d){
                var v, 
                    c,
                    s = de.getVisibleSeries()[this.parent.index];

                if( d != null && typeof d == "object"){
                    v = d.value;
                    c = d.category;
                } else {
                    v = d;
                    c = de.getVisibleCategories()[this.index];
                }

                return o.tooltipFormat.call(myself, s, c, v);
            });

        if(this.showTooltips){
            this.pvLine.event("point", pv.Behavior.tipsy(this.tipsySettings));
        }

        this.pvDot = this.pvLine.add(pv.Dot)
            .shapeSize(12)
            .lineWidth(1.5)
            .strokeStyle(this.showDots?colorFunc:null)
            .fillStyle(this.showDots?colorFunc:null);

        if (o.clickable){
            this.pvDot
                .cursor("pointer")
                .event("click", function(d){
                    var v, c;
                    var s = de.getVisibleSeries()[this.parent.index];
                    if(  d != null && typeof d == "object"){
                      v = d.value;
                      c = d.category;
                    }
                    else{
                      v = d;
                      c = de.getVisibleCategories()[this.index];
                    }
                    var e = arguments[arguments.length-1];
                    return o.clickAction(s, c, v, e);
                });
        }

        if(this.showValues){
            this.pvLabel = this.pvDot
                .anchor(this.valuesAnchor)
                .add(pv.Label)
                .bottom(0)
                .text(function(d){
                    return o.valueFormat( (d != null && typeof d == "object")? d.value : d);
                });
        }
    },

    /**
     * @override
     */
    applyExtensions: function(){

        this.base();

        // Extend lineLabel
        if(this.pvLabel){
            this.extend(this.pvLabel, "lineLabel_");
        }
        
        // Extend bar and barPanel
        this.extend(this.pvScatterPanel, "scatterPanel_");
        this.extend(this.pvArea, "area_");
        this.extend(this.pvLine, "line_");
        this.extend(this.pvDot, "dot_");
        this.extend(this.pvLabel, "label_");
    }
});
