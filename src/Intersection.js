/*
    Copyright 2008, 
        Matthias Ehmann,
        Michael Gerhaeuser,
        Carsten Miller,
        Bianca Valentin,
        Alfred Wassermann,
        Peter Wilfahrt

    This file is part of JSXGraph.

    JSXGraph is free software: you can redistribute it and/or modify
    it under the terms of the GNU Lesser General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    JSXGraph is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Lesser General Public License for more details.

    You should have received a copy of the GNU Lesser General Public License
    along with JSXGraph.  If not, see <http://www.gnu.org/licenses/>.

*/

/**
 * @fileoverview The object Intersection is defined in this file. Intersection
 * manages all properties and actiones required to cut circles and lines with
 * each other and draws the intersection points.
 * @author graphjs
 * @version 0.1
 */

/**
 * Constructs a new Intersection object.
 * @class This is the Intersection class. 
 * It manages all properties and actiones required to cut circles and lines with
 * each other and draws the intersection points.
 * @constructor
 * @param {String,Board} board The board the new point is drawn on.
 * @param {Array} coordinates An array with the affine user coordinates of the point.
 * @param {String} id Unique identifier for the point. If null or an empty string is given,
 *  an unique id will be generated by Board
 * @see Board#addPoint
 * @param {String} name Not necessarily unique name for the point. If null or an
 *  empty string is given, an unique name will be generated
 * @see Board#generateName
 * @param {bool} show False if the point is invisible, True otherwise
 */
JXG.Intersection = function(Board, Id, Intersect1, Intersect2, InterId1, InterId2, InterName1, InterName2) {
    this.constructor();
    /**
     * Reference to board where the intersected elements are drawn.
     * @type Board
     * @see Board
     */
    this.board = Board;
    
    /**
     * Unique identifier for the element. Equivalent to id-attribute of renderer element.
     * @type String
     */
    this.id = Id;
    this.name = this.id;

    /**
     * True when this object is visible, false otherwise.
     * @type bool
     */
    this.visProp = {};
    this.visProp['visible'] = true;
    this.show = true; // noch noetig? BV
    
    /**
     * True when the intersection points have real coordinates, false otherwise.
     * @type bool
     */    
    this.real = true;
    
    /** 
     * Stores all Intersection Objects which in this moment are not real and
     * hide this element.
     */
    this.notExistingParents = {};

    /**
     * Geometry element that is intersected with intersect2.
     * @type GeometryElement
     * @see #intersect2
     */
    this.intersect1 = JXG.GetReferenceFromParameter(this.board, Intersect1);

    /**
     * Geometry element that is intersected with intersect1.
     * @type GeometryElement
     * @see #intersect1
     */
    this.intersect2 = JXG.GetReferenceFromParameter(this.board, Intersect2);

    /**
     * Type of this object. For internal use only.
     * @private
     */
    this.type = JXG.OBJECT_TYPE_INTERSECTION;     

    /*
     * Only intersect existing geometry elements.
     */
    if( ((this.intersect1 == '') || (this.intersect1 == undefined)) && ((this.intersect2 == '') || (this.intersect2 == undefined))) {
        return;
    }

    /*
     * Do not intersect elements which aren't of type line, arrow, circle or arc.
     */
    if( ((this.intersect1.type == this.intersect2.type) && (this.intersect1.type == JXG.OBJECT_TYPE_LINE || this.intersect1.type == JXG.OBJECT_TYPE_ARROW)) 
         || ((this.intersect1.type == JXG.OBJECT_TYPE_LINE) && (this.intersect2.type == JXG.OBJECT_TYPE_ARROW))
         || ((this.intersect2.type == JXG.OBJECT_TYPE_LINE) && (this.intersect1.type == JXG.OBJECT_TYPE_ARROW)) ) {
        /* Intersect two elements of type line or arrow */
        
        var coords = this.board.algebra.intersectLineLine(this.intersect1, this.intersect2).usrCoords.slice(1);

        /* Create intersection point */
        this.p = new JXG.Point(this.board, coords, InterId1, InterName1, true);
        /* A point constructed by an intersection can't be moved, so it is fixed */
        this.p.fixed = true;
        this.addChild(this.p);
        this.real = true;

        /* 
         * Because the update function depends on the types of the intersected elements
         * the update method has to be defined dynamically in dependence of the intersected
         * elements.
         */
        this.update = function () {
            /* Calculate the coordinates of the intersection point in dependance of the intersected elements */
            if (this.needsUpdate) {
                this.p.coords = this.board.algebra.intersectLineLine(this.intersect1, this.intersect2);
                /* Update the point */
                //this.p.update();
                this.needsUpdate = false;
            }
        }
        
        /*
         * Hides the element, generated dynamically.
         */
        this.hideElement = function() {
            this.visProp['visible'] = false;
            this.p.hideElement();
        }
        
        /*
         * Shows the element, generated dynamically.
         */
        this.showElement = function() {
            this.visProp['visible'] = true;
            this.p.showElement();
        }
        
        /*
         * Hides the element and his children. This is called from parents which became invisible or unreal
         * and so this element isn't real anymore. The not existing parent is stored in the notExistingParents
         * array.
         */
        this.hideChild = function(id) {    
            this.notExistingParents[id] = this.board.objects[id];

            for(var el in this.descendants) {    
                if(this.descendants[el].visProp['visible'] && this.descendants[el].type != JXG.OBJECT_TYPE_INTERSECTION) {
                    this.descendants[el].hideElement();
                    this.descendants[el].visProp['visible'] = true;
                }      
                this.descendants[el].notExistingParents[id] = this.board.objects[id];
            }            
        }

        /*
         * Shows the element and his children. This is called from parents which became visible or real
         * and so this element is now real. The formerly not existing parent is deleted from the
         * notExistingParents array.
         */
        this.showChild = function(id) {        
            for(var el in this.board.objects) {        
                delete(this.board.objects[el].notExistingParents[id]);
                if(this.board.objects[el].visProp['visible'] && Object.keys(this.board.objects[el].notExistingParents).length == 0) {
                    if(this.board.objects[el].type != JXG.OBJECT_TYPE_INTERSECTION) {
                        this.board.objects[el].showElement();
                    }
                }
            }
        }        
    }
    else if( ((Intersect1.type == Intersect2.type) && (Intersect1.type == JXG.OBJECT_TYPE_CIRCLE || Intersect1.type == JXG.OBJECT_TYPE_ARC)) ||
              (Intersect1.type == JXG.OBJECT_TYPE_CIRCLE && Intersect2.type == JXG.OBJECT_TYPE_ARC) ||
              (Intersect2.type == JXG.OBJECT_TYPE_CIRCLE && Intersect1.type == JXG.OBJECT_TYPE_ARC) ) { // Circle <-> Circle, Arc <-> Arc, Arc <-> Circle,
        this.p1 = new JXG.Point(this.board, [0, 0], InterId1, InterName1, false);
        this.p1.fixed = true;
        this.p1.label.show = true;
        this.p2 = new JXG.Point(this.board, [0, 0], InterId2, InterName2, false);
        this.p2.fixed = true;
        this.p2.label.show = true;
        this.addChild(this.p1);
        this.addChild(this.p2);

        var coordinates = this.board.algebra.intersectCircleCircle(this.intersect1, this.intersect2);
        if(coordinates[0] == 1) {
            this.p1.coords = coordinates[1];
            this.p1.showElement();
            this.p1.updateRenderer();

            this.p2.coords = coordinates[2];
            this.p2.showElement();
            this.p2.updateRenderer();
            
            this.real = true;
        }
        else {
            this.real = false;
        }

        this.update = function () {    
            if (!this.needsUpdate) { return; }
            var coordinates = this.board.algebra.intersectCircleCircle(this.intersect1, this.intersect2);
            var p1show = this.p1.visProp['visible'];
            var p2show = this.p2.visProp['visible'];         
            if(coordinates[0] == 0) {  
                if(this.real) {
                    this.hideChild(this.id);
                    this.p1.visProp['visible'] = p1show;
                    this.p2.visProp['visible'] = p2show;
                    this.real = false;
                }
            } else {
                this.p1.coords = coordinates[1];     
                this.p2.coords = coordinates[2];
                if(!this.real) {
                    this.showChild(this.id); 
                    this.real = true;
                }
            }
            this.needsUpdate = false;
        }
        
        this.hideElement = function() {
            this.visProp['visible'] = false;
            this.p1.hideElement();
            this.p2.hideElement();
        }
        
        this.showElement = function() {
            this.visProp['visible'] = true;
            this.p1.showElement();
            this.p2.showElement();
        }

        this.hideChild = function(id) {
            this.notExistingParents[id] = this.board.objects[id];

            for(var el in this.descendants) {    
                if(this.descendants[el].visProp['visible'] && this.descendants[el].type != JXG.OBJECT_TYPE_INTERSECTION) {
                    this.descendants[el].hideElement();
                    this.descendants[el].visProp['visible'] = true;
                }      
                this.descendants[el].notExistingParents[id] = this.board.objects[id];
            }                
        }

        this.showChild = function(id) {            
            for(el in this.board.objects) {        
                delete(this.board.objects[el].notExistingParents[id]);
                if(this.board.objects[el].visProp['visible'] && Object.keys(this.board.objects[el].notExistingParents).length == 0) {
                    if(this.board.objects[el].type != JXG.OBJECT_TYPE_INTERSECTION) {
                        this.board.objects[el].showElement();
                    }
                }        
            }            
        }         
    }
    else { // Circle <-> Line, Arc <-> Line, Circle <-> Arrow, Arc <-> Arrow
        this.p1 = new JXG.Point(this.board, [0, 0], InterId1, InterName1, false);
        this.p1.fixed = true;
        this.p1.label.show = true;        
        this.p2 = new JXG.Point(this.board, [0, 0], InterId2, InterName2, false);
        this.p2.fixed = true;
        this.p2.label.show = true;
        this.addChild(this.p1);
        this.addChild(this.p2);        
        
        if(this.intersect1.type == JXG.OBJECT_TYPE_LINE || this.intersect1.type == JXG.OBJECT_TYPE_ARROW) {
            var swap = this.intersect1;
            this.intersect1 = this.intersect2;
            this.intersect2 = swap;
        }
        
        var coordinates = this.board.algebra.intersectCircleLine(this.intersect1, this.intersect2);
        if(coordinates[0] == 1) { // not really implemented
            this.p1.coords = coordinates[1];
            this.p1.showElement();
            this.p1.update();    
        } 
        else if(coordinates[0] == 2) {
            this.p1.coords = coordinates[1];
            this.p1.showElement();        

            this.p2.coords = coordinates[2];
            this.p2.showElement();            

            //this.p1.update();
            this.p1.updateRenderer();
            //this.p2.update(); 
            this.p2.updateRenderer();    
            
            this.real = true;
        }
        else {
            this.real = false;
        }

        this.update = function () {
            if (!this.needsUpdate) { return; }
            var coordinates = this.board.algebra.intersectCircleLine(this.intersect1, this.intersect2);
            var show1 = this.p1.visProp['visible'];
            var show2 = this.p2.visProp['visible'];
            
            if(coordinates[0] == 0) {
                if(this.real) {
                    this.hideChild(this.id);
                    this.p1.visProp['visible'] = show1; 
                    this.p2.visProp['visible'] = show2;
                    this.real = false;
                }
            } else if(coordinates[0] == 2) {
                this.p1.coords = coordinates[1];   
                this.p2.coords = coordinates[2];
                if(!this.real) {
                    this.showChild(this.id);  
                    this.real = true;
                }
            }
            this.needsUpdate = false;
        }
        
        this.hideElement = function() {
            this.visProp['visible'] = false;
            this.p1.hideElement();
            this.p2.hideElement();
        }
        
        this.showElement = function() {
            this.visProp['visible'] = true;
            this.p1.showElement();
            this.p2.showElement();
        }

        this.hideChild = function(id) {
            this.notExistingParents[id] = this.board.objects[id];

            for(var el in this.descendants) {    
                if(this.descendants[el].visProp['visible'] && this.descendants[el].type != JXG.OBJECT_TYPE_INTERSECTION) {
                    this.descendants[el].hideElement();
                    this.descendants[el].visProp['visible'] = true;
                }      
                this.descendants[el].notExistingParents[id] = this.board.objects[id];
            }                
        }

        this.showChild = function(id) {
            for(el in this.board.objects) {            
                delete(this.board.objects[el].notExistingParents[id]);
                if(this.board.objects[el].visProp['visible'] && Object.keys(this.board.objects[el].notExistingParents).length == 0) {
                    if(this.board.objects[el].type != JXG.OBJECT_TYPE_INTERSECTION) {
                        this.board.objects[el].showElement();
                    }
                }            
            }            
        }         
    }

    this.id = this.board.addIntersection(this);
};
JXG.Intersection.prototype = new JXG.GeometryElement();
   
/**
 * Calls the renderer to update the drawing. This method is defined dynamically
 * as it highly depends on the types of the intersected elements.
 */
JXG.Intersection.prototype.update = function() {
    return;
};

/**
 * Checks whether (x,y) is near the point.
 * @param {int} x Coordinate in x direction, screen coordinates.
 * @param {int} y Coordinate in y direction, screen coordinates.
 * @return {bool} Always returns false
 */
JXG.Intersection.prototype.hasPoint = function(x, y) {
    return false;
};

/**
 * Hides the element and his children. This is called from parents which became invisible or unreal
 * and so this element isn't real anymore. The not existing parent is stored in the notExistingParents
 * array.
 * @param {String} id The identifier of the element causing this element to be hidden.
 */
JXG.Intersection.prototype.hideChild = function(id) {
};

/**
 * Shows the element and his children. This is called from parents which became visible or real
 * and so this element is now real. The formerly not existing parent is deleted from the
 * notExistingParents array.
 * @param {String} id The identifier of the element causing this element to be shown.
 */
JXG.Intersection.prototype.showChild = function(id) {
};

/**
 * Remove intersection points from drawing.
 */
JXG.Intersection.prototype.remove = function() {
    if(this.p != undefined)
        this.board.removeObject(this.p);
    if(this.p1 != undefined)
        this.board.removeObject(this.p1);
    if(this.p2 != undefined)
        this.board.removeObject(this.p2);
        
    return;
};

/**
 * Dummy method 
 */
JXG.Intersection.prototype.updateRenderer = function() {
};
