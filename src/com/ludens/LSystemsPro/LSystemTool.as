/**
* ...
* @author Default
* @version 0.1
*/

package com.ludens.LSystemsPro  {
	//import mx.accessibility.ListAccImpl;
	import flash.display.*;
	import flash.events.*;
	import flash.filters.*;
	import flash.geom.Matrix;
	import flash.geom.Point;
	import flash.geom.Rectangle;
	import flash.utils.*;
	
	import mx.core.IUIComponent;
	import mx.core.UIComponent;
	import mx.events.FlexEvent;
	import mx.events.ResizeEvent;
	
	public class LSystemTool extends UIComponent implements IUIComponent{
		
		public var lSys:LSystem;
		public var drawing:Sprite;
		public var polyDrawing:Sprite;
		public var svgData:String;
		
		public var mouseDragging:Boolean = false;
		
		
		
		[Bindable] public var lineCount:int;
		[Bindable] public var timeTaken:int;
		[Bindable] public var exportTimeTaken:int;
		
		
		private var _pitch:Number = 90, _yaw:Number = 0, _roll:Number = 0;
		
		private var _draw2D:		Boolean = true;
		private var _lineThickness:	int 	= 2;
		private var _scaled:		Boolean = true;
		private var _iterations:	int 	= 3;
		private var _angle:			Number 	= 60;
		//private var _commands:		String 	= "F:F+F--F+F";
		private var _commands:		String 	= ""; // change this to a value to start the thing off with
		private var _axiom:			String 	= "";
		private var _ratio:			Number 	= .99;
		private var _lineLength:	Number 	= 30;
		
		private var _scale:Number			= 1;
		
		private var _zoom_speed:	Number 	= .03;
		private var _zoom_startMousePos:Number = 0;
		private var _zoom_currentMousePos:Number = 0;
		private var _zoom_scale:Number = 1;
		private var _zoom_relX:Number = 0;
		private var _zoom_relY:Number = 0;
		
		private var _zoom_curX:Number = 0;
		private var _zoom_curY:Number = 0;
		private var _zoom_startX:Number = 0;
		private var _zoom_startY:Number = 0;
		
		private var _zoom_rotation:Number = 0;
		private var _zoom_startRotation:Number = 0;
		
		
		private var _lineColor:Number = 0x222222;
		
		/* animation */
		
		private var _delay:int = 0;
		
		private var container :Sprite;
		//private var scene     :MovieScene3D;
		//private var camera    :Camera3D;
		//private var cTarget:DisplayObject3D;
		
		
		private var bg:Sprite;
		
		/* SVG EXPORT */
		private var _svgPoints:Array;
		
		
		public function LSystemTool(){
			
			init();
		
			
			
			//this.addEventListener(MouseEvent.MOUSE_OUT, mouseOutHandler);
			
			
			
			
			
		}
		
		public function init():void {
				
			//init3D();
			
			drawing = new Sprite();
			polyDrawing = new Sprite();
			
			addChild(drawing);
			addChild(polyDrawing);
			
			bg = new Sprite();
			addChild(bg);
			
			// initialise the l-system
			lSys = new LSystem(_angle, _iterations, _axiom);
			
			var r:Rule = new Rule(_axiom, _commands);
			lSys.rules.push(r);
			
			//addEventListener( Event.ENTER_FRAME, onEnterFrame );
			
			this.addEventListener(FlexEvent.VALUE_COMMIT, valueCommitHandler);
			this.addEventListener(ResizeEvent.RESIZE, resizeHandler);
			
			this.addEventListener(MouseEvent.MOUSE_DOWN, mouseDownHandler);
			this.addEventListener(MouseEvent.MOUSE_UP, mouseUpHandler);
			
			lSys.addEventListener(Event.CHANGE, systemChangedHandler);
			
			calculate();
			
		}
		
		
		
		public function init3D():void {
			
			// Create container sprite and center it in the stage
			container = new Sprite();
			addChild( container );

			
		}
		
		public function calculate():void{
			
			// only do this if the LSystemTool is enabled
			
			if(!enabled) return;
			
			// draw only 2d now
			lSys.draw2D = _draw2D;
			lSys.ratio = _ratio;
			lSys.startRule = _axiom;
			lSys.angle = _angle;
			lSys.iterations = _iterations;
			
			
			drawing.graphics.clear();
			drawing.graphics.lineStyle(0,_lineColor,1);
			
			polyDrawing.graphics.clear();
			polyDrawing.graphics.lineStyle(0, _lineColor, 0);
			
			
			
			var time:int = getTimer();
			
			lSys.resetSystem();	
			
			lSys.graphics = drawing.graphics; 
			lSys.polyGraphics = polyDrawing.graphics;
			
			lSys.drawSystem(
				lSys.getCommand(), 
				_lineLength,
				_lineColor,
				_lineThickness,
				_delay
				);
			
			lineCount = lSys.lineCount;
			//trace("[LSystemTool.calculate] Drawing complete, lineCount=" + lineCount);
			
			timeTaken = getTimer() - time;
			//trace("[LSystemTool.calculate] time (ms)= " + timeTaken);
			
			//getSVG();
			
			resize();
			
			
		}
		
		/**
		 * XML Export functions
		 * - to save the L-system as an XML file
		 * 
		 */
		 
		public function get xml():XML {
			var systemXml:XML;
			
			systemXml = <lsystem version="0.1">
						<rules>
							<axiom>{axiom}</axiom>
							<commands>{commands}</commands>
						</rules>
						<control>
							<angle>{angle}</angle>
							<iterations>{iterations}</iterations>
							<ratio>{ratio}</ratio>
							<linecolor>{lineColor}</linecolor>
							<linethickness>{lineThickness}</linethickness>
						</control>
						<info>
							<linecount>{lineCount}</linecount>
							<calculationtime>{timeTaken}</calculationtime>
						</info>	
					</lsystem>;
					
			return systemXml;
		}
		
		public  function getSVG():String {
			
			// get the points for the SVG output
			_svgPoints = lSys.drawSystem(
							lSys.getCommand(), 
							_lineLength,
							_lineColor,
							_lineThickness,
							0,
							true
							);
			
			// call the SVG Exporter and get an object with the results
			var ret:Object = SVGExporter.export(_svgPoints, this.xml);
			
			exportTimeTaken = ret.timeTaken;
			
			return ret.xml.toString();
			
//			// for export time
			var time:int = getTimer();
//			
//			var boxWidth:Number = 200;
//			var boxHeight:Number = 200;
//			var output:String = __svgStart + ' height="' + boxHeight + 'mm" width="' + boxWidth + 'mm"' + __svgItem1;
//			
//			var svgXml:XML = new XML(__svgTag);
//			svgXml.@height = boxHeight + "mm";
//			svgXml.@width = boxWidth + "mm";
//			
//			// get the points for the SVG output
//			_svgPoints = lSys.drawSystem(
//							lSys.getCommand(), 
//							_lineLength,
//							_lineColor,
//							_lineThickness,
//							0,
//							true
//							);
//			
//			
//			var xMin:Number = Number.POSITIVE_INFINITY;
//			var yMin:Number = Number.POSITIVE_INFINITY;
//			var xMax:Number = Number.NEGATIVE_INFINITY;
//			var yMax:Number = Number.NEGATIVE_INFINITY;
//			
//			// get the bounds
//			
//			for(var i:int = 0; i < _svgPoints.length; i++){
//				if(_svgPoints[i].x < xMin) xMin = _svgPoints[i].x;
//				if(_svgPoints[i].y < yMin) yMin = _svgPoints[i].y;
//				if(_svgPoints[i].x > xMax) xMax = _svgPoints[i].x;
//				if(_svgPoints[i].y > yMax) yMax = _svgPoints[i].y;
//			}
//			
//			var xScale:Number = boxWidth / (xMax - xMin);
//			var yScale:Number = boxHeight / (yMax - yMin);
//			
//			var totalScale:Number = (xScale > yScale ? xScale : yScale);
//			
//			// set the current color
//			var currentColor:uint = _lineColor;
//			var currentThickness:Number = _lineThickness * totalScale;
//			
//			// form the current <path> SVG elements
//			var currentPath:XML = new XML(__pathTag);
//			// set stroke color
//			currentPath.@stroke = "#" + zeroPad(currentColor.toString(16),6);
//			currentPath["@stroke-width"] = (_lineThickness > 0 ? _lineThickness : 0.001);
//			
//			
//			// starting point
//			
//			
//			var currentInstructions:String = "M0,0";
//			var lastAction = "";
//			var scaledX:Number = 0;
//			var scaledY:Number = 0;
//			var currentPos:String = "0,0";
//			var lastPos:String;
//			
//			for(var j:int = 0; j < _svgPoints.length; j++){
//				
//				lastAction = action;
//				
//				var action:String = _svgPoints[j].action;
//				
//				if(action == "M" ||  action == "L" || action == "A"){
//					scaledX = _svgPoints[j].x * totalScale;
//					scaledY = _svgPoints[j].y * totalScale;
//					
//					lastPos = currentPos;
//					currentPos = scaledX + "," + scaledY;
//				}
//				
//				
//				
//				if(action == "M" || action == "L"){
//					
//					currentInstructions += action + currentPos;
//				
//				} else if(action == "A"){
//					// draw an arc
//					var scaledR:Number = _svgPoints[j].parameters.r * totalScale;
//					
//					currentInstructions += action 
//					       + scaledR + "," + scaledR 
//					       + " 0 " + (_svgPoints[j].parameters.direction ? "1" : "0")
//					       + "," + (_svgPoints[j].parameters.large ? "1" : "0")
//					       + " " + currentPos;
//					
//				} else if(action == "P"){
//					// draw lines on the special polygon path
//					
//					/**
//					 * TODO: implement this
//					 */
//				} else if(action == "S"){
//					// push current path in the list
//					
//					
//					// form the current <path> SVG elements
//					
//					
//					// only add new path if the position has changed. This prevents multiple 
//					// sequential line operations from creating empty paths
//					if(lastAction != action) {
//						
//						currentPath.@d = currentInstructions;
//						svgXml.* += currentPath.copy();
//						//trace("[LSystemTool][getSVG] curpos( "+ currentPos + ")");
//						currentPath = new XML(__pathTag);
//						// reset line start to new location
//						currentInstructions = "M" + currentPos;
//					}
//					
//					// set new values
//					
//					currentColor = _svgPoints[j].parameters.lineColor;
//					currentThickness = _svgPoints[j].parameters.lineThickness * totalScale;
//					
//					// set stroke color
//					//currentPath.@stroke = "#" + zeroPad(currentColor.toString(16),6);
//					currentPath["@stroke-width"] = (currentThickness > 0 ? currentThickness : 0.001);
//					// start new path
//					// starting point  :should be?
//					
//					
//					
//				}
//			}
//			
//			currentPath.@d = currentInstructions;
//			// add the last path to the SVG
//			svgXml.g.* += currentPath.copy();
//			
//			
//			
//			// add metadata with the xml for the l-system
//			
//			svgXml.metadata.* += this.xml;
//			
//			exportTimeTaken = getTimer() - time;
//			
//			//trace(output);
//			return svgXml.toString();
		}
		
		public function resize():void{
			
			// do the appropriate placement
			drawing.x = 0; //width/2;
			drawing.y = 0; //height/2;
			drawing.scaleX = drawing.scaleY = 1;
			
			if(drawing.width> this.width || drawing.height > this.width){
					
				var hscale:Number = this.width / drawing.width;
				var vscale:Number = this.height / drawing.height;
				// scale the drawing according to the scaling. this is based on the component size and the dynamic zoom scaling
				//_scale = Math.min(hscale, vscale) * _zoom_scale;
				_scale = Math.min(hscale, vscale);
				drawing.scaleX = drawing.scaleY = _scale;
				
				
			}
			
			//if(mouseDragging)
			//	rotateAround(drawing, _zoom_startX, _zoom_startY, _zoom_rotation);
				
			drawing.rotation = _zoom_rotation;
				
			
			var r:Rectangle = drawing.getBounds(this);
			
			// the middle of the drawing box
			var cx:Number = r.x+r.width/2;
			var cy:Number = r.y+r.height/2;
			
			// place the drawing in the middle of the UIComponent
			drawing.x = (this.width/2) - cx;
			drawing.y = (this.height/2) - cy;
			
			polyDrawing.scaleX = polyDrawing.scaleY = drawing.scaleX;
			polyDrawing.rotation = drawing.rotation;
			polyDrawing.x = drawing.x;
			polyDrawing.y = drawing.y;
			
			
			bg.graphics.clear();
			bg.graphics.lineStyle(1,0,0);
			bg.graphics.beginFill(0x0, .00);
			bg.graphics.drawRect(10,10,width-5, height-5);
			
		}
		
		
		
		
		[Bindable] 
		public function set angle(value:Number):void {
			_angle = value;
			calculate();
		}
		
		public function get angle():Number {
			return _angle;
		}
		
		[Bindable] 
		public function set axiom(value:String):void {
			// do basic testing
			
			if(checkString(value)){
				_axiom = value;
				calculate();
			}
			
		}
		
		/**
		 * checkString():
		 * 
		 * checks if the string given to the system has the right number of parenthesis
		 * - returns false if not all matching parenthesis
		 * - returns true if valid
		 **/
		private function checkString(value:String):Boolean{
			
			var _leftBrace:int = 0;
			var _rightBrace:int = 0;
			
			var _leftParen:int = 0;
			var _rightParen:int = 0;
			
			for(var i:int=0;i<value.length;i++){
				if(value.charAt(i) == '[') _leftBrace++;
				if(value.charAt(i) == ']') _rightBrace++;
				
				if(value.charAt(i) == '(') _leftParen++;
				if(value.charAt(i) == ')') _rightParen++;
			}
			
			return (_leftBrace == _rightBrace && _leftParen == _rightParen);
			
		}
		
		public function get axiom():String {
			return _axiom;
		}
		
		[Bindable] 
		public function set commands(value:String):void {
			// do basic testing
			if(checkString(value)){
				
				_commands = value;
				
				//trace("[LSystemTool.commands] changing commands:" + _commands);
				
				// reset the rules array
				lSys.rules = new Array();
				// create rules for our system
				var ar:Array = _commands.split("\r");
				
				for(var j:int = 0; j < ar.length; j++)
				lSys.rules.push( Rule.createRule(ar[j]) );
				
				
				// and do the rest of the calculation
				calculate();
			}
		}
		
		public function get commands():String {
			return _commands;
		}
		
		[Bindable] 
		public function set iterations(value:int):void {
			_iterations = value;
			calculate();
		}
		
		public function get iterations():int {
			return _iterations;
		}
		
		[Bindable] 
		public function set ratio(value:Number):void {
			_ratio = value;
			calculate();
		}
		
		public function get ratio():Number {
			return _ratio;
		}
		
		[Bindable] 
		public function set lineLength(value:Number):void {
			_lineLength = value;
			calculate();
		}
		
		public function get lineLength():Number {
			return _lineLength;
		}
		
		
		[Bindable] 
		public function set lineColor(value:Number):void {
			_lineColor = value;
			calculate();
		}
		
		public function get lineColor():Number {
			return _lineColor;
		}
		
		[Bindable]
		public function set lineThickness(value:Number):void {
			_lineThickness = value;
			calculate();
		}
		
		public function get lineThickness():Number {
			return _lineThickness;
		}
		
		[Bindable]
		public function set delay(value:int):void {
			_delay = value;
			calculate();
		}
		
		public function get delay():int {
			return _delay;
		}
		
		
		/* 3D manipulation */
		[Bindable] 
		public function set pitch(value:Number):void {
			_pitch = value;
			calculate();
		}
		
		public function get pitch():Number {
			return _pitch;
		}
		
		[Bindable] 
		public function set yaw(value:Number):void {
			_yaw = value;
			calculate();
		}
		
		public function get yaw():Number {
			return _yaw;
		}
		
		[Bindable] 
		public function set roll(value:Number):void {
			_roll = value;
			calculate();
		}
		
		public function get roll():Number {
			return _roll;
		}
		
		/**
		 * start and stop manipulation with the mouse
		 */
		
		private function startMouseDragging():void{
			
			mouseDragging = true;
			
			trace("[startZoom] called");
			
			systemManager.addEventListener(MouseEvent.MOUSE_OUT, systemManager_mouseOutHandler);
			this.addEventListener(MouseEvent.MOUSE_MOVE, mouseMoveHandler);
		}
		
		private function stopMouseDragging():void{
			
			
			trace("[stopZoom] called");
			
			systemManager.removeEventListener(MouseEvent.MOUSE_OUT, systemManager_mouseOutHandler);
			this.removeEventListener(MouseEvent.MOUSE_MOVE, mouseMoveHandler);
			//bg.graphics.clear();
			
			mouseDragging = false;
			
		}
		
		
		/**
		 *  event handlers
		 */
		 
		private function valueCommitHandler(e:FlexEvent):void {
			//trace("[LSystemTool.onValueCommit] a value has changed!");
			calculate();
		}
		
		private function systemChangedHandler(e:Event):void {
			//trace("[LSystemTool.onSystemChanged] the system has changed, update our horses!");
			lineCount = lSys.lineCount;
			
			resize();
		}
		
		
		private function resizeHandler(e:ResizeEvent):void {
			resize();
		}
		
		private function mouseUpHandler(e:MouseEvent):void {
			stopMouseDragging();
		}
		
		private function mouseDownHandler(e:MouseEvent):void {
			
			
			//trace("[onMouseDown] called");
			_zoom_startMousePos = e.stageY;
			_zoom_startRotation = drawing.rotation;
			// get the relative x position of the shape so we  can zoom it properly
			_zoom_relX = e.localX / width;
			_zoom_relY = e.localY / height;
			
			_zoom_curX = e.localX;
			_zoom_curY = e.localY;
			
			_zoom_startX = e.localX;
			_zoom_startY = e.localY;
			
			startMouseDragging();
			
			
		}
		
		private function mouseOutHandler(e:MouseEvent):void {
			//trace("[onMouseOut] called");
			stopMouseDragging();
		}
		
		private function mouseMoveHandler(e:MouseEvent):void {
			//trace("[onMouseMove] called");
			_zoom_currentMousePos = e.stageY;
			_zoom_curX = e.localX;
			_zoom_curY = e.localY;
			
			//trace("[onEnterFrame] called");
			
			/*
			var _zoom_dY:Number = _zoom_currentMousePos - _zoom_startMousePos;
			
			_zoom_scale -= _zoom_dY * _zoom_speed * .01;
			_zoom_scale = Math.max(1,_zoom_scale);
			*/
			//var base_posX:Number = _zoom_startX;
			//var base_posY:Number = _zoom_startY;
			
			var base_posX:Number = width/2;
			var base_posY:Number = height/2;
			
			var base_angle:Number = Math.atan2(_zoom_startY - base_posY, _zoom_startX - base_posX);
			//trace("base_angle:" + base_angle);
			
			// rotate the coordinate system
			
			var new_angle:Number = Math.atan2(_zoom_curY - base_posY, _zoom_curX - base_posX);
			//trace("new_angle:" + new_angle);
			
			var diff_angle:Number = new_angle - base_angle;
			
			
			
			// convert to angles
			_zoom_rotation = _zoom_startRotation + 360 * (diff_angle / (Math.PI * 2));
			
			
			//_zoom_rotation *= .99;
			
			
			resize();
			
			/*
			bg.graphics.beginFill(0xFF0000,.3);
			bg.graphics.drawCircle(base_posX, base_posY,5);
			bg.graphics.endFill();
			
			bg.graphics.beginFill(0xFF7700,.3);
			bg.graphics.drawCircle(_zoom_startX, _zoom_startY,5);
			bg.graphics.endFill();
			
			bg.graphics.beginFill(0xFF0077,.3);
			bg.graphics.drawCircle(_zoom_curX, _zoom_curY,5);
			bg.graphics.endFill();
			
			bg.graphics.moveTo(base_posX, base_posY);
			bg.graphics.lineStyle(3,0xFFFFFF,1);
			bg.graphics.lineTo(_zoom_curX, _zoom_curY);
			*/
			
			
		}
		
		private function systemManager_mouseOutHandler(e:MouseEvent):void {
			//trace("[systemManager_onMouseDown] called");
			stopMouseDragging();
			
		}
		
		
		/**
		 * UTILITY FUNCTIONS - should move to separate class?
		 * 
		 */
		/**
       * Rotate around an arbitrary centre point
       * @param Number local horizontal offset from 'real' registration point
       * @param Number local vertical offset from 'real' registration point
       * @param Number absolute rotation in degrees
       */
       // DOESN'T WORK! why not?
      
      protected function rotateAround( sprite:Sprite, offsetX:Number, offsetY:Number, toDegrees:Number ):void {
         var relDegrees:Number = toDegrees - ( this.rotation % 360 );
         var relRadians:Number = Math.PI * relDegrees / 180;
         var M:Matrix = new Matrix( 1, 0, 0, 1, 0, 0 );
         M.rotate( relRadians );
         // map vector to centre point within parent scope
         var AC:Point = new Point( offsetX, offsetY );
         AC = sprite.localToGlobal( AC );
         AC = sprite.parent.globalToLocal( AC );
         // current registered postion AB
         var AB:Point = new Point( sprite.x, sprite.y );
         // point to rotate, offset position from virtual centre
         var CB:Point = AB.subtract( AC );
         // rotate CB around imaginary centre
         // then get new AB = AC + CB
         CB = M.transformPoint( CB );
         AB = AC.add( CB );
         // set real values on clip
         sprite.rotation = toDegrees;
         sprite.x = AB.x;
         sprite.y = AB.y;
      }
      
      


	}
	
}
