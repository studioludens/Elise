/**
 * 
 * new version:
 * 
 * make simplified version for use with spark
*/

package com.ludens.elise.components  {
	//import mx.accessibility.ListAccImpl;
	import com.ludens.LSystemsPro.LSystem;
	import com.ludens.LSystemsPro.Rule;
	import com.ludens.LSystemsPro.SVGExporter;
	import com.ludens.elise.util.LSystemStringUtil;
	
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
	
	import spark.components.Group;
	import spark.core.SpriteVisualElement;
	
	public class LSystemTool extends Group {
		
		
		/**
		 * the main l system interpreter
		 */
		public var lSys:LSystem;
		
		/**
		 * the sprite on which to draw
		 */
		public var drawing:Sprite;
		
		/**
		 * drawing of the polygons
		 */
		public var polyDrawing:Sprite;
		
		/**
		 * generated svg data
		 * 
		 */
		
		public var svgData:String;
		
		
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
		
		private var bg:Sprite;
		
		/* SVG EXPORT */
		private var _svgPoints:Array;
		
		
		/**
		 * the element that holds the drawings
		 */
		private var _drawingElement:SpriteVisualElement;
		
		protected override function createChildren():void {
			
			_drawingElement = new SpriteVisualElement();
			addElement( _drawingElement );
			
			drawing = new Sprite();
			polyDrawing = new Sprite();
			
			_drawingElement.addChild(drawing);
			_drawingElement.addChild(polyDrawing);
			
			// initialise the l-system
			lSys = new LSystem(_angle, _iterations, _axiom);
			
			var r:Rule = new Rule(_axiom, _commands);
			lSys.rules.push(r);
			
			this.addEventListener(FlexEvent.VALUE_COMMIT, valueCommitHandler);
			
			// have to check this one for use with the panzoomlayout
			//this.addEventListener(ResizeEvent.RESIZE, resizeHandler);
			
			lSys.addEventListener(Event.CHANGE, systemChangedHandler);
			
			calculate();
			invalidateDisplayList();
			
		}
		
		protected override function updateDisplayList(unscaledWidth:Number, unscaledHeight:Number):void {
			super.updateDisplayList( unscaledWidth, unscaledHeight );
			
			//calculate();
			
		}
		
		public function calculate():void{
			
			// only do this if the LSystemTool is enabled
			
			if(!enabled) return;
			if( !drawing || !polyDrawing || !lSys) return;
			
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
		}
		
		/**
		 * a function to automatically resize the drawing sprite
		 * so it fits on the screen
		 */
		public function resize():void{
			
			// do the appropriate placement
			drawing.x = 0; //width/2;
			drawing.y = 0; //height/2;
			drawing.scaleX = drawing.scaleY = 1;
			
			if(drawing.width> this.width || drawing.height > this.width){
					
				var hscale:Number = this.width / drawing.width;
				var vscale:Number = this.height / drawing.height;

				_scale = Math.min(hscale, vscale);
				drawing.scaleX = drawing.scaleY = _scale;
			}
			
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
			
			/*
			bg.graphics.clear();
			bg.graphics.lineStyle(1,0,0);
			bg.graphics.beginFill(0x0, .00);
			bg.graphics.drawRect(10,10,width-5, height-5);
			*/
			
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
			
			if(LSystemStringUtil.stringValid( value )){
				_axiom = value;
				calculate();
			}
			
		}
		
		
		
		public function get axiom():String {
			return _axiom;
		}
		
		[Bindable] 
		public function set commands(value:String):void {
			// do basic testing
			if( !LSystemStringUtil.stringValid( value ) )
				return;
				
			_commands = value;
			
			// reset the rules array
			lSys.rules = new Array();
			// create rules for our system
			var ar:Array = _commands.split("\r");
			
			for(var j:int = 0; j < ar.length; j++)
				lSys.rules.push( Rule.createRule(ar[j]) );
			
			
			// and do the rest of the calculation
			calculate();
			
			
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
		
	}
	
}
