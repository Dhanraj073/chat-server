(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var interactions = [],
    minMoveDistance = 5,
    interact,
    maximumMovesToPersist = 1000, // Should be plenty..
    propertiesToCopy = 'target,pageX,pageY,clientX,clientY,offsetX,offsetY,screenX,screenY,shiftKey,x,y'.split(','); // Stuff that will be on every interaction.

function Interact(){
    this._elements = [];
}
Interact.prototype.on = function(eventName, target, callback){
    if(!target){
        return;
    }
    target._interactEvents = target._interactEvents || {};
    target._interactEvents[eventName] = target._interactEvents[eventName] || []
    target._interactEvents[eventName].push({
        callback: callback,
        interact: this
    });

    return this;
};
Interact.prototype.emit = function(eventName, target, event, interaction){
    if(!target){
        return;
    }

    var interact = this,
        currentTarget = target;

    interaction.originalEvent = event;
    interaction.preventDefault = function(){
        event.preventDefault();
    }
    interaction.stopPropagation = function(){
        event.stopPropagation();
    }

    while(currentTarget){
        currentTarget._interactEvents &&
        currentTarget._interactEvents[eventName] &&
        currentTarget._interactEvents[eventName].forEach(function(listenerInfo){
            if(listenerInfo.interact === interact){
                listenerInfo.callback.call(interaction, interaction);
            }
        });
        currentTarget = currentTarget.parentNode;
    }

    return this;
};
Interact.prototype.off =
Interact.prototype.removeListener = function(eventName, target, callback){
    if(!target || !target._interactEvents || !target._interactEvents[eventName]){
        return;
    }
    var interactListeners = target._interactEvents[eventName],
        listenerInfo;
    for(var i = 0; i < interactListeners.length; i++) {
        listenerInfo = interactListeners[i];
        if(listenerInfo.interact === interact && listenerInfo.callback === callback){
            interactListeners.splice(i,1);
            i--;
        }
    }

    return this;
};
interact = new Interact();

    // For some reason touch browsers never change the event target during a touch.
    // This is, lets face it, fucking stupid.
function getActualTarget() {
    var scrollX = window.scrollX,
        scrollY = window.scrollY;

    // IE is stupid and doesn't support scrollX/Y
    if(scrollX === undefined){
        scrollX = document.body.scrollLeft;
        scrollY = document.body.scrollTop;
    }

    return document.elementFromPoint(this.pageX - window.scrollX, this.pageY - window.scrollY);
}

function getMoveDistance(x1,y1,x2,y2){
    var adj = Math.abs(x1 - x2),
        opp = Math.abs(y1 - y2);

    return Math.sqrt(Math.pow(adj,2) + Math.pow(opp,2));
}

function destroyInteraction(interaction){
    for(var i = 0; i < interactions.length; i++){
        if(interactions[i].identifier === interaction.identifier){
            interactions.splice(i,1);
        }
    }
}

function getInteraction(identifier){
    for(var i = 0; i < interactions.length; i++){
        if(interactions[i].identifier === identifier){
            return interactions[i];
        }
    }
}

function setInheritedData(interaction, data){
    for(var i = 0; i < propertiesToCopy.length; i++) {
        interaction[propertiesToCopy[i]] = data[propertiesToCopy[i]]
    }
}

function Interaction(event, interactionInfo){
    // If there is no event (eg: desktop) just make the identifier undefined
    if(!event){
        event = {};
    }
    // If there is no extra info about the interaction (eg: desktop) just use the event itself
    if(!interactionInfo){
        interactionInfo = event;
    }

    // If there is another interaction with the same ID, something went wrong.
    // KILL IT WITH FIRE!
    var oldInteraction = getInteraction(interactionInfo.identifier);
    oldInteraction && oldInteraction.destroy();

    this.identifier = interactionInfo.identifier;

    this.moves = [];

    interactions.push(this);
}

Interaction.prototype = {
    constructor: Interaction,
    getActualTarget: getActualTarget,
    destroy: function(){
        interact.on('destroy', this.target, this, this);
        destroyInteraction(this);
    },
    start: function(event, interactionInfo){
        // If there is no extra info about the interaction (eg: desktop) just use the event itself
        if(!interactionInfo){
            interactionInfo = event;
        }

        var lastStart = {
                time: new Date()
            };
        setInheritedData(lastStart, interactionInfo);
        this.lastStart = lastStart;

        setInheritedData(this, interactionInfo);

        this.phase = 'start';
        interact.emit('start', event.target, event, this);
        return this;
    },
    move: function(event, interactionInfo){
        // If there is no extra info about the interaction (eg: desktop) just use the event itself
        if(!interactionInfo){
            interactionInfo = event;
        }

        var currentTouch = {
                time: new Date()
            };

        setInheritedData(currentTouch, interactionInfo);

        // Update the interaction
        setInheritedData(this, interactionInfo);

        this.moves.push(currentTouch);

        // Memory saver, culls any moves that are over the maximum to keep.
        this.moves = this.moves.slice(-maximumMovesToPersist);

        var lastMove = this.moves[this.moves.length-2];
        lastMove && (currentTouch.angle = Math.atan2(currentTouch.pageY - lastMove.pageY, currentTouch.pageX - lastMove.pageX) * 180 / Math.PI);
        this.angle = currentTouch.angle || 0;

        this.phase = 'move';
        interact.emit('move', event.target, event, this);
        return this;
    },
    drag: function(event, interactionInfo){
        // If there is no extra info about the interaction (eg: desktop) just use the event itself
        if(!interactionInfo){
            interactionInfo = event;
        }

        var currentTouch = {
                time: new Date(),
                isDrag: true
            };

        setInheritedData(currentTouch, interactionInfo);

        // Update the interaction
        setInheritedData(this, interactionInfo);

        if(!this.moves){
            this.moves = [];
        }

        this.moves.push(currentTouch);

        // Memory saver, culls any moves that are over the maximum to keep.
        this.moves = this.moves.slice(-maximumMovesToPersist);

        if(!this.dragStarted && getMoveDistance(this.lastStart.pageX, this.lastStart.pageY, currentTouch.pageX, currentTouch.pageY) > minMoveDistance){
            this.dragStarted = true;
        }

        var lastDrag = this.moves[this.moves.length-2] || this.lastStart;
        lastDrag && (currentTouch.angle = Math.atan2(currentTouch.pageY - lastDrag.pageY, currentTouch.pageX - lastDrag.pageX) * 180 / Math.PI);
        this.angle = currentTouch.angle || 0;

        if(this.dragStarted){
            this.phase = 'drag';
            interact.emit('drag', event.target, event, this);
        }
        return this;
    },
    end: function(event, interactionInfo){
        if(!interactionInfo){
            interactionInfo = event;
        }

        // Update the interaction
        setInheritedData(this, interactionInfo);

        this.phase = 'end';
        interact.emit('end', event.target, event, this);

        return this;
    },
    cancel: function(event, interactionInfo){
        if(!interactionInfo){
            interactionInfo = event;
        }

        // Update the interaction
        setInheritedData(this, interactionInfo);

        this.phase = 'cancel';
        interact.emit('cancel', event.target, event, this);

        return this;
    },
    getMoveDistance: function(){
        if(this.moves.length > 1){
            var current = this.moves[this.moves.length-1],
                previous = this.moves[this.moves.length-2];

            return getMoveDistance(current.pageX, current.pageY, previous.pageX, previous.pageY);
        }
    },
    getMoveDelta: function(){
        if(this.moves.length > 1){
            var current = this.moves[this.moves.length-1],
                previous = this.moves[this.moves.length-2];

            return {
                x: current.pageX - previous.pageX,
                y: current.pageY - previous.pageY
            };
        }
    },
    getSpeed: function(){
        if(this.moves.length > 1){
            var current = this.moves[this.moves.length-1],
                previous = this.moves[this.moves.length-2];

            return this.getMoveDistance() / (current.time - previous.time);
        }
        return 0;
    },
    getCurrentAngle: function(blend){
        var currentPosition,
            lastAngle,
            i = this.moves.length-1,
            angle,
            firstAngle,
            angles = [],
            blendSteps = 20/(this.getSpeed()*2+1),
            stepsUsed = 0;

        if(this.moves && this.moves.length){

            currentPosition = this.moves[i];
            angle = firstAngle = currentPosition.angle;

            if(blend && this.moves.length > 1){
                while(--i > 0 && this.moves.length - i < blendSteps){
                    lastAngle = this.moves[i].angle;
                    if(Math.abs(lastAngle - firstAngle) > 180){
                        angle -= lastAngle
                    }else{
                        angle += lastAngle
                    }
                    stepsUsed++;
                }
                angle = angle/stepsUsed;
            }
        }
        if(angle === Infinity){
            return firstAngle;
        }
        return angle;
    },
    getAllInteractions: function(){
        return interactions.slice();
    }
};

function start(event){
    var touch;

    for(var i = 0; i < event.changedTouches.length; i++){
        touch = event.changedTouches[i];
        new Interaction(event, event.changedTouches[i]).start(event, touch);
    }
}
function drag(event){
    var touch;

    for(var i = 0; i < event.changedTouches.length; i++){
        touch = event.changedTouches[i];
        getInteraction(touch.identifier).drag(event, touch);
    }
}
function end(event){
    var touch;

    for(var i = 0; i < event.changedTouches.length; i++){
        touch = event.changedTouches[i];
        getInteraction(touch.identifier).end(event, touch).destroy();
    }
}
function cancel(event){
    var touch;

    for(var i = 0; i < event.changedTouches.length; i++){
        touch = event.changedTouches[i];
        getInteraction(touch.identifier).cancel(event, touch).destroy();
    }
}

addEvent(document, 'touchstart', start);
addEvent(document, 'touchmove', drag);
addEvent(document, 'touchend', end);
addEvent(document, 'touchcancel', cancel);

var mouseIsDown = false;
addEvent(document, 'mousedown', function(event){
    mouseIsDown = true;

    if(!interactions.length){
        new Interaction(event);
    }

    var interaction = getInteraction();

    if(!interaction){
        return;
    }

    getInteraction().start(event);
});
addEvent(document, 'mousemove', function(event){
    if(!interactions.length){
        new Interaction(event);
    }

    var interaction = getInteraction();

    if(!interaction){
        return;
    }

    if(mouseIsDown){
        interaction.drag(event);
    }else{
        interaction.move(event);
    }
});
addEvent(document, 'mouseup', function(event){
    mouseIsDown = false;

    var interaction = getInteraction();

    if(!interaction){
        return;
    }

    interaction.end(event, null);
    interaction.destroy();
});

function addEvent(element, type, callback) {
    if(element.addEventListener){
        element.addEventListener(type, callback);
    }
    else if(document.attachEvent){
        element.attachEvent("on"+ type, callback);
    }
}

module.exports = interact;
},{}],2:[function(require,module,exports){
//Copyright (C) 2012 Kory Nunn

//Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

//The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

//THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

/*

    This code is not formatted for readability, but rather run-speed and to assist compilers.

    However, the code's intention should be transparent.

    *** IE SUPPORT ***

    If you require this library to work in IE7, add the following after declaring crel.

    var testDiv = document.createElement('div'),
        testLabel = document.createElement('label');

    testDiv.setAttribute('class', 'a');
    testDiv['className'] !== 'a' ? crel.attrMap['class'] = 'className':undefined;
    testDiv.setAttribute('name','a');
    testDiv['name'] !== 'a' ? crel.attrMap['name'] = function(element, value){
        element.id = value;
    }:undefined;


    testLabel.setAttribute('for', 'a');
    testLabel['htmlFor'] !== 'a' ? crel.attrMap['for'] = 'htmlFor':undefined;



*/

(function (root, factory) {
    if (typeof exports === 'object') {
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        define(factory);
    } else {
        root.crel = factory();
    }
}(this, function () {
    // based on http://stackoverflow.com/questions/384286/javascript-isdom-how-do-you-check-if-a-javascript-object-is-a-dom-object
    var isNode = typeof Node === 'function'
        ? function (object) { return object instanceof Node; }
        : function (object) {
            return object
                && typeof object === 'object'
                && typeof object.nodeType === 'number'
                && typeof object.nodeName === 'string';
        };
    var isArray = function(a){ return a instanceof Array; };
    var appendChild = function(element, child) {
      if(!isNode(child)){
          child = document.createTextNode(child);
      }
      element.appendChild(child);
    };


    function crel(){
        var document = window.document,
            args = arguments, //Note: assigned to a variable to assist compilers. Saves about 40 bytes in closure compiler. Has negligable effect on performance.
            element = args[0],
            child,
            settings = args[1],
            childIndex = 2,
            argumentsLength = args.length,
            attributeMap = crel.attrMap;

        element = isNode(element) ? element : document.createElement(element);
        // shortcut
        if(argumentsLength === 1){
            return element;
        }

        if(typeof settings !== 'object' || isNode(settings) || isArray(settings)) {
            --childIndex;
            settings = null;
        }

        // shortcut if there is only one child that is a string
        if((argumentsLength - childIndex) === 1 && typeof args[childIndex] === 'string' && element.textContent !== undefined){
            element.textContent = args[childIndex];
        }else{
            for(; childIndex < argumentsLength; ++childIndex){
                child = args[childIndex];

                if(child == null){
                    continue;
                }

                if (isArray(child)) {
                  for (var i=0; i < child.length; ++i) {
                    appendChild(element, child[i]);
                  }
                } else {
                  appendChild(element, child);
                }
            }
        }

        for(var key in settings){
            if(!attributeMap[key]){
                element.setAttribute(key, settings[key]);
            }else{
                var attr = crel.attrMap[key];
                if(typeof attr === 'function'){
                    attr(element, settings[key]);
                }else{
                    element.setAttribute(attr, settings[key]);
                }
            }
        }

        return element;
    }

    // Used for mapping one kind of attribute to the supported version of that in bad browsers.
    // String referenced so that compilers maintain the property name.
    crel['attrMap'] = {};

    // String referenced so that compilers maintain the property name.
    crel["isNode"] = isNode;

    return crel;
}));

},{}],3:[function(require,module,exports){
var interact = require('./'),
    crel = require('crel');

window.onload = function(){

    var log = [],
        output

    crel(document.body,
        output = crel('div')
    );

    var toLog = 'pageX pageY identifier angle'.split(' ');

    var eventHandler = function(interaction){
        interaction.preventDefault();

        log.push(interaction);
        var info = '';

        for(var key in interaction){
            if(~toLog.indexOf(key)){
                info += key + ': ' + interaction[key] + ' ';
            }
        }

        crel(output,
            crel('p', interaction.phase, crel('br'), info, crel('br'), 'nicer angle: ' + interaction.getCurrentAngle(true))
        );

        if(output.childNodes.length > 10){
            output.removeChild(output.childNodes[0]);
        }
    };

    interact.on('move', document.body, eventHandler);
    interact.on('start', document.body, eventHandler);
    interact.on('drag', document.body, eventHandler);
    interact.on('end', document.body, eventHandler);
    interact.on('cancel', document.body, eventHandler);

};
},{"./":1,"crel":2}]},{},[3])