//position of labels updated and color of labels
 //flag -0  && flag -0  //hovering effect + no label
 //flag -1 && flagTooltip -0  //hovering effect + label inside
 //flag -2  && flagTooltip -0  //hovering effect + label outside
 //flag -0  && flagTooltip -1  //rotation + no label
 //flag -1  && flagTooltip -1  //rotation + label inside
 //flag -2  && flagTooltip -1 //rotation + label outside
//present of ticks corrected
//flagLabel  -- 0 no label .... 1 label inside ....2 label outside
//flagSlicing ....1 slicing enabled ....0 not enabled (only enabled when flagtooltip!=2)
//flagtooltip ..... 0 not any tip ...... 1 hovering allowed.....2 rotation (slicing will be disabled)
var arc;
function tweenPie(finish)
        {
            var strt=
            {
              startAngle:0,
              endAngle:0
            };
            var i=d3.interpolate(strt,finish);
            return function(d){ return arc(i(d)) ;};
        }
var addPieChart= function(startX,startY,width,height,myid,color,flagLabel,flagSlicing,flagTooltip,flagScroll,flagSelection,data)
{
    var cushion = 20; // cushion for expansion
    
    var radius;
    if(width>height)
    radius=height/2;
    else
    radius =(width)/2;
    radius = radius - radius * cushion /100;
    
    arc = d3.svg.arc()
      .outerRadius(radius);
    
    var svg=d3.select("#"+myid)
              .select('svg')
              .append('g')
              .attr('transform', 'translate(' + (startX+(width / 2)) + ',' + (startY+(height / 2)) + ')')
              .text(function(d){return d;})
    

    var pie = d3.layout.pie()
                .value(function(d) { return d.count; })
                .sort(null);
    

    var div = d3.select("#"+myid).append("div")  
                .attr("class", "tooltip")  
                .style("opacity", 0);
    
    var key = function(d){return d.data.label ; };
    var getAngle = function (d) {
                return (180 / Math.PI * (d.startAngle + d.endAngle) / 2 - 90);
              };
    var curAngle = 0;
    var interval = null;
    var isDown = false;
    var isLeft = false;
    var lastX = 0;

    var path =svg.selectAll('.arc')
                .data(pie(data),key)  
                .enter()
                .append('g')
                .attr("class","arc")
                .attr("id",function(d,i){return "chartPie_id_arc"+i;});
   var path2 =svg.selectAll('.arc')
                .data(pie(data),key)  
                .enter()
                .append('g')
                .attr("class","arc");

    path.append('path')
        .attr('fill', function(d, i){ return color(d.data.label); })
        .attr('d',arc)
        .transition()
        .duration(500)
        .attrTween('d',tweenPie)
        .each(function(d) { this._current = d; });

    if(+flagSlicing===1 && +flagTooltip!=2)
    {
          path.on('click',function(d){
              d3.select(this)
              .transition()
              .duration(500)
              .attr("transform",function(d){
                  if(!d.data._expanded){
                    d.data._expanded = true;
                     var a = d.startAngle + (d.endAngle - d.startAngle)/2 - Math.PI/2;
                    var x = Math.cos(a) * 20;
                    var y = Math.sin(a) * 20;
                    return 'translate(' + x + ',' + y + ')' ;                
                  }else{
                    d.data._expanded = false;
                    return 'translate(0,0)';                
                  }
              }); 
            });
    }

    if(+flagTooltip===1)    // if rotation is alllowed these functionality will be inactive
    {
        path.on("mouseover", function(d) {
              d3.select(this).style("opacity",0.7);
              div.transition() 
                 .duration(200) 
                 .style("opacity", .8); 
              div.html(("label:  " + d.data.label) + "<br/>"  +("Values:  " + d.data.count)) 
                 .style("left", (d3.event.pageX) + "px") 
                 .style("top", (d3.event.pageY - 28) + "px");  
                })

              .on("mousemove", function(d) {
                  div.transition() 
                     .duration(200) 
                     .style("opacity", .8); 
                  div.html(("label:  " + d.data.label) + "<br/>"  +("Values:  " + d.data.count)) 
                     .style("left", (d3.event.pageX) + "px") 
                     .style("top", (d3.event.pageY - 28) + "px");  
                })
              .on("mouseout", function(d) {
                  d3.select(this).style("opacity",1);
                  div.transition() 
                     .duration(20)  
                     .style("opacity", 0);  
                })
      }

      if(+flagTooltip===2 && +flagLabel===1)
      {
            path.on("mousedown", function(d) {isDown = true;  });
            path.on("mousemove", function(d) {
                if (isDown)
                {
                    isLeft = (lastX - d3.event.x < 0);
                    lastX = d3.event.x;
                    if (isLeft)
                    {
                        curAngle += 5;
                    }
                    else{
                    curAngle -= 5;
                    }
                    path.attr("transform", "translate(" + 0 + "," + 0 + ") rotate(" + curAngle + "," + 0 + "," + 0 + ")");
                }
            });
            path.on("mouseup", function(d){isDown = false;});              
        }


      
      if(+flagLabel===2)    // this tell whehter to display the text outside or inside the arc .2 --outside
      {
          var new_arc=d3.svg.arc()
                .outerRadius(radius)
                .innerRadius(0);
          arc=d3.svg.arc()
                .outerRadius(radius)
                .innerRadius(0);

          var ticks = path.append("line");
          ticks.attr("x1",function (d, i) {return new_arc.centroid(d)[0];})
               .attr("y1", function(d,i){return new_arc.centroid(d)[1];})
               .attr("x2", function (d, i) {
                     centroid = new_arc.centroid(d);
                     midAngle = Math.atan2(centroid[1], centroid[0]);
                     x = Math.cos(midAngle) * (7*radius/10);
                     return x;
                })
               .attr("y2",function (d, i) {
                    centroid = new_arc.centroid(d);
                    midAngle = Math.atan2(centroid[1], centroid[0]);
                    y = Math.sin(midAngle) * (7*radius/10);
                    return y;
                })
               .attr("stroke", function(d){if(((d.endAngle - d.startAngle)/Math.PI)*360>30){console.log("111");return color(d.data.label);} else {console.log("22");return "none";}})
               .attr("transform", function(d) {return "translate(" + arc.centroid(d)+")";});
          
          if(+flagTooltip===2)
          {
                path.on("mousedown", function(d) {isDown = true;  });
                
                path.on("mousemove", function(d) {
                    if (isDown)
                    {
                        isLeft = (lastX - d3.event.x < 0);
                        lastX = d3.event.x;
                        if (isLeft)
                        {
                            curAngle += 5;
                        }
                        else{
                        curAngle -= 5;
                        }
                path.attr("transform", "translate(" + 0 + "," + 0 + ") rotate(" + curAngle + "," + 0 + "," + 0 + ")");
                ticks.attr("x1",function (d, i) {return new_arc.centroid(d)[0];})
                     .attr("y1", function(d,i){return new_arc.centroid(d)[1];})
                     .attr("x2", function (d, i) {
                           centroid = new_arc.centroid(d);
                           midAngle = Math.atan2(centroid[1], centroid[0]);
                           x = Math.cos(midAngle) * (7*radius/10);
                           return x;})
                     .attr("y2",function (d, i) {
                          centroid = new_arc.centroid(d);
                          midAngle = Math.atan2(centroid[1], centroid[0]);
                          y = Math.sin(midAngle) * (7*radius/10);
                          return y;})
                    .attr("stroke", function(d){return color(d.data.label);})
                    .attr("transform", function(d) {return "translate(" + arc.centroid(d)+")";});

                    }
                });
                path.on("mouseup", function(d){isDown = false;});              
          }
          var labelArc = d3.svg.arc()
              .outerRadius(5*radius/4)
              .innerRadius(5*radius/4);

          path.append("text")
              .attr("class","chartPie_class_outerLabel")
              .attr("transform", function(d) { return "translate(" + labelArc.centroid(d) + ") " + "rotate(" + getAngle(d) + ")"; }) 
              .style("text-anchor", "start")
              .text(function(d) {if(((d.endAngle - d.startAngle)/Math.PI)*360> 30)return d3.format(".2s")(d.data.count); });
      }

      if(+flagLabel===1)   //text will be shown in inside
      {
        var labelArc = d3.svg.arc()
              .outerRadius(radius/2)
              .innerRadius(radius/2);

        path.append("text")
              .attr("class","chartPie_class_innerLabel")
              .attr("transform", function(d) { return "translate(" + labelArc.centroid(d) + ") " + "rotate(" + getAngle(d) + ")"; }) 
              .style("text-anchor", "start")
              .text(function(d) {if(((d.endAngle - d.startAngle)/Math.PI)*360> 30)return d3.format(".2s")(d.data.count); });
      
        if(+flagTooltip===2)
        {
            path.on("mousedown", function(d) {isDown = true;  });
            path.on("mousemove", function(d) {
                if (isDown)
                {
                    isLeft = (lastX - d3.event.x < 0);
                    lastX = d3.event.x;
                    if (isLeft)
                    {
                        curAngle += 5;
                    }
                    else{
                    curAngle -= 5;
                    }
                    path.attr("transform", "translate(" + 0 + "," + 0 + ") rotate(" + curAngle + "," + 0 + "," + 0 + ")");
                }
            });
            path.on("mouseup", function(d){isDown = false;});              
          }
      }
}