

var prices_fun = function(num)
{
  var color =d3.scale.category20c(); 
  //d3.select("#subdiv").append("svg").attr("width",500).attr("height",50);
  d3.select("#mydiv"+num).append("svg").attr("width",150).attr("height",100);
  /*d3.csv("data1.csv", function(error,data){
     color.domain(d3.keys(data[0]).filter(function(key) { return key !== "label"; }));
     data.forEach(function(d){
         var y0 = 0;
         d.total = color.domain().map(function(name) { return {name: name, y0: y0, y1: y0 += +d[name]}; });
         d.sum=d.total[d.total.length-1].y1;
         d.total.forEach(function(d) { d.y0 /= y0; d.y1 /= y0; });
      }); 
      */
  /*d3.json('data.json',function(err,data){
    if(err)
    throw err; */
    /*data.forEach(function(d) {
        var y0 = 0;
        d.values = color.domain().map(function(name) { return {name: name, y0: y0, y1: y0 += +d[name]}; });
        d.total = d.values[d.values.length - 1].y1;
    }); */
    
     d3.csv("data"+num+".csv", function(pr){
         dataset = pr.map(function(d){
             label=d.label
             count=d.count
             count2=d.count2
             count3=d.count3
             count4=d.count4
             count5=d.count5
            return {"label":label ,"count":count,"count2":count2,"count3":count3,"count4":count4,"count5":count5};
        }) 
    // d3.json('data.json',function(err,dataset){ 
     var flagLabel=0;  //text labeling 
     var flagSlicing=0; //for stack chart gap.....
     var flagTooltip=0;  /// for rotation and hovering in pie chart ..1 for rotation
     var flagScroll=0;
     var flagSelection=0;
   //  addPieChart(0,20,400,300,"mydiv",color,flag,flag2,flag3,flagScroll,flagSelection,dataset);
     //addBarLineChart(0,20,400,300,"mydiv",color,flag,flag2,flag3,flagScroll,flagSelection,dataset);
     addPieChart(0,0,100,100,"mydiv"+num,color,flagLabel,flagSlicing,flagTooltip,flagScroll,flagSelection,dataset,2);
     // addLegend(0,20,400,70,300,400,"subdiv",color,flagLabel,flagSlicing,flagTooltip,flagScroll,flagSelection,"chartStack100",dataset);
  })
 
   /* d3.csv("class.csv",function(pr){
      dataset =pr.map(function(d){
        label =d.label
        count =d.count
        count2 =d.count2
        count3 =d.count3

        return {"label":label ,"count":count , "count2":count2,"count3" : count3};
      })
        var flagLabel=2;  //text labeling 
        var flagSlicing=1; //for stack chart gap.....
        var flagTooltip=0;  /// for rotation and hovering in pie chart ..1 for rotation
        var flagScroll=0;
        var flagSelection=1;
      addStackLineChart(0,20,400,300,"mydiv",color,flagLabel,flagSlicing,flagTooltip,flagScroll,flagSelection,dataset);
    })
*/
}