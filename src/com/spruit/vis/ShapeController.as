package com.spruit.vis {

	
	import flash.display.Sprite;
	import flash.display.StageAlign;
	import flash.events.*;
	import flash.utils.*;
	import flash.display.SpreadMethod;
	import mx.managers.IFocusManagerComponent;
	import mx.core.UIComponent;
	import mx.managers.IFocusManagerComponent;
	import flash.ui.Mouse;
	import mx.events.ResizeEvent;
	import flash.text.*;

	public class ShapeController extends UIComponent implements IFocusManagerComponent	{
		
		// number of control points
		private const NUM_CONTROL_POINTS:int = 7;
		
		
		public var mouse_down:Boolean = false;
		
		// the height of the total line that controls the shape
		public var lineHeight:Number = 22.5;
		public var lineWidth:Number = 100;
		
		
		public var lineColor:int = 0xfdba3e;
		public var lineAlpha:Number = 0.4;
		
		
		/* private variables
		
		*/
		
		// distance between control points
		private var cpDistance:Number = 75;
		
		// 
		public var offsetTop:Number = 65;
		public var offsetLeft:Number = -135;
		// create control points array
		private var controlPoints:Array = new Array;
		private var controlLines:Array = new Array;
		
		// additional help
		private var descr_layer:Sprite;
		
		private const RIGHT_BORDER:Number = 25;
		
		// radius of the control points (radius)
		private var _cp_size:Number = 5;
		
		private var _line_width:Number = 10;
		
		// initial value --> has to be NUM_CONTROL_POINTS size!
		
		private var _initial_value:Array = [.45, .64 , .82, 1, 0, 0, 1];
		
		// if enabled, the ShapeController will show and respond to user input
		private var _enabled:Boolean = true;
		
		// constructor
		public function ShapeController()	 {	
			
			super();
			//stage.align = StageAlign.LEFT;
			
			
			
			// add mouse event listeners
			addEventListener(MouseEvent.MOUSE_UP, onMouseUp);
			addEventListener(MouseEvent.MOUSE_DOWN, onMouseDown);
			addEventListener(MouseEvent.MOUSE_MOVE, onMouseMove);
			addEventListener(MouseEvent.ROLL_OVER, onMouseRollOver);
			addEventListener(MouseEvent.ROLL_OUT, onMouseRollOut);
			addEventListener(Event.ENTER_FRAME, onEnterFrame);
			addEventListener(ResizeEvent.RESIZE, onChangeSize);
			
			// 
			
			// create control lines and add to main sprite
			for(var l:int = 0; l < NUM_CONTROL_POINTS-1; l++)  {
				controlLines[l] = new Sprite();
				
				addChild(controlLines[l]);
			}	
			
			/* set control point initial settings */
			cpDistance = (lineHeight / (NUM_CONTROL_POINTS-1));
			
			//trace('cpDs' + cpDistance);
			
			
			// create CPs (control circles)
			for(var k:int = 0; k < NUM_CONTROL_POINTS; k++)  {
				controlPoints[k] = new HControlPoint(k, _cp_size);
				
				controlPoints[k].itemHeight = cpDistance;
				controlPoints[k].itemWidth = this.width;
				controlPoints[k].x = offsetLeft;
				controlPoints[k].y = offsetTop + cpDistance * k;
				
				addChild(controlPoints[k]);
				
				controlPoints[k].value = _initial_value[k];
			}
			
			// fill the description layer
			descr_layer = new Sprite();
			
			// add the description layer
			addChild(descr_layer);
			
			// add the text fields
			
			
			draw();
		}	
		
		private function onEnterFrame(e:Event):void	{
			
			if(_enabled){
					this.alpha = 1;
					
			} else {
				this.alpha = 0;
			}
			cpDistance = (lineHeight / (NUM_CONTROL_POINTS-1));
			//trace('CPDISTANCE: ' + lineHeight);
			
			for(var k:int = 0; k < NUM_CONTROL_POINTS; k++)  {
				
				controlPoints[k].itemHeight = cpDistance;
				
				controlPoints[k].y = offsetTop + cpDistance * k;
				
			}
			
			draw();
			
			/*
			var dist:Number = mouseX - controlPoints[0].x - (lineWidth/2);
			
			var alpha_val:Number = .8 * Math.exp(
							-((dist) * (dist)) / (100 * 100));
			this.alpha = alpha_val;
			*/
			
			// do the lines, only draw them when we have to
			
			if(_enabled){
				descr_layer.graphics.clear();
				descr_layer.graphics.lineStyle(0,0xFFFFFF,1);
				
				// minimum size line
				descr_layer.graphics.moveTo(offsetLeft,offsetTop-40);
				//descr_layer.graphics.lineTo(offsetLeft, cpDistance * NUM_CONTROL_POINTS + 10);
				descr_layer.graphics.lineTo(offsetLeft,offsetTop);
				descr_layer.graphics.moveTo(offsetLeft,cpDistance * NUM_CONTROL_POINTS);
				descr_layer.graphics.lineTo(offsetLeft, cpDistance * NUM_CONTROL_POINTS + 40);
				
				// maximum size line
				descr_layer.graphics.lineStyle(3,0xFFFFFF,0.2);
				descr_layer.graphics.moveTo(offsetLeft + this.width,offsetTop-40);
				descr_layer.graphics.lineTo(offsetLeft + this.width, cpDistance * NUM_CONTROL_POINTS + 40);
			} else {
				descr_layer.graphics.clear();
			}			

			
		}
		
		private function draw():void {
					
			// clear old control line
			for(var i:int = 0; i < NUM_CONTROL_POINTS-1; i++)	{
				// we start the drawing process anew every frame
				controlLines[i].graphics.clear();
				// and place the controller on the right place on the screen
				//controlLines[i].x = offsetLeft;
				
			}
			
			// if we are not enabled, it is no use drawing all those lines
			if(!_enabled) return;
			
			for(var m:int = 0; m < NUM_CONTROL_POINTS; m++)	{
				
				// and place the controller on the right place on the screen
				
				controlPoints[m].x = offsetLeft;
				
			}
			
			// create array of cubic curve instances
			var cubicCurves:Array = new Array();
			
			// draw control lines
			for(var j:int = 0; j < NUM_CONTROL_POINTS-1; j++)	{
				
				// get x and y postion of balls
				
				// ball before current ball
				if(j > 0)	{
					var x_0:Number = controlPoints[j-1].x_ball + controlPoints[j-1].x;
					var y_0:Number = controlPoints[j-1].y;
				}
				// current ball
				var x_1:Number = controlPoints[j].x_ball + controlPoints[j].x;
				var y_1:Number = controlPoints[j].y;
				// next ball
				var x_2:Number = controlPoints[j+1].x_ball + controlPoints[j+1].x;
				var y_2:Number = controlPoints[j+1].y;
				// next-next ball
				if(j < NUM_CONTROL_POINTS-2)	{
					var x_3:Number = controlPoints[j+2].x_ball + controlPoints[j+2].x;
					var y_3:Number = controlPoints[j+2].y;				
				}
								
								
				// this variable makes the orientation of the control points' control points better (Don't know why)
				var times:Number = 2;
				
				var d1_x:Number;
				var d1_rad:Number;
				var d2_x:Number;
				var d2_rad:Number;
				
				if(j == 0){
					//d1_x = 1;
					d1_x = (x_2 - x_1)/times;
					d1_rad = Math.atan(d1_x / cpDistance);
				}
				else	{
					d1_x = (x_2 - x_0)/times;
					if(d1_x == 0) d1_x = 1;
					d1_rad = Math.atan(d1_x / cpDistance);
					var dif1_xy:Number = cpDistance / d1_x; 
				}
				
				if(j == NUM_CONTROL_POINTS-1)	{
					//d2_x = 1;
					d2_x = (x_0 - x_1)/times;
					d2_rad = Math.atan(d2_x / cpDistance);
				}
				else	{
					d2_x = (x_1 - x_3)/times;
					if(d2_x == 0) d2_x = 1;
					d2_rad = Math.atan(d2_x / cpDistance);
					var dif2_xy:Number = cpDistance / d2_x;
				}
								
				var looseness:Number = 20;
			
				var xc_1:Number = x_1 + looseness * (Math.sin(d1_rad));
				var yc_1:Number = y_1 + looseness * (Math.cos(d1_rad));
				var xc_2:Number = x_2 + looseness * (Math.sin(d2_rad));
				var yc_2:Number = y_2 - looseness * (Math.cos(d2_rad));
				
				/*
				controlLines[j].graphics.lineStyle(0xFFFFFF, 1);
				controlLines[j].graphics.moveTo(x_1, y_1);								
				*/
				
				//controlLines[j].graphics.drawCircle(xc_1, yc_1, 2);
				//controlLines[j].graphics.drawCircle(xc_2, yc_2, 2);
				
				
				if((d1_x != 0 || d2_x != 0))	{
					cubicCurves[j] = new CubicCurve(controlLines[j]);
					// draw the backdrop
					//controlLines[j].graphics.moveTo(x_1, y_1);
					//controlLines[j].graphics.lineStyle(11, 0x000000);
					//cubicCurves[j].drawBezier(x_1, y_1, xc_1, yc_1, xc_2, yc_2,   x_2, y_2);
				
				
					controlLines[j].graphics.moveTo(x_1, y_1);
					controlLines[j].graphics.lineStyle(_line_width, lineColor);
					cubicCurves[j].drawBezier(x_1, y_1, xc_1, yc_1, xc_2, yc_2,   x_2, y_2);
					controlLines[j].alpha = lineAlpha;
					
					
					
					
					//addChild(controlLines[j]);			
				}
				else	{
					//controlLines[j].graphics.moveTo(x_1, y_1);
					//controlLines[j].graphics.lineTo(x_2, y_2);
				}
			}
		}
		
		private function onMouseUp(event:MouseEvent):void	{
					
			if(!_enabled) return;
			
			for(var k:int = 0; k < NUM_CONTROL_POINTS; k++)	{
				controlPoints[k].mouse_down = false;
			}
		}
		
		private function onMouseDown(event:MouseEvent):void	{
			
			if(!_enabled) return;
			
			for(var k:int = 0; k < NUM_CONTROL_POINTS; k++)	{
				controlPoints[k].mouse_down = true;
			}
		}
		
		
		
		private function onMouseMove(event:MouseEvent):void {
			if(event.buttonDown){
				//trace('drawing...');
				//draw();
				
				
			}
		}
		
		private function onMouseRollOver(event:MouseEvent):void	{
			
			// don't do anything if we're not enabled
			if(!_enabled) return;
			
			if(event.buttonDown){
				mouse_down = false;
			} else {
				mouse_down = true;
			}
			
			for(var k:int = 0; k < NUM_CONTROL_POINTS; k++)	{
				controlPoints[k].mouse_down = mouse_down;
			}
		}
		
		private function onMouseRollOut(event:MouseEvent):void	{
			
			// don't do anything if we're not enabled
			if(!_enabled) return;
			
			mouse_down = false;
			for(var k:int = 0; k < NUM_CONTROL_POINTS; k++)	{
				controlPoints[k].mouse_down = false;
			}
		}
		
		public function onChangeSize(e:ResizeEvent):void {
			
			trace("ShapeController size change...");
			
			for(var k:int = 0; k < NUM_CONTROL_POINTS; k++)  {
				//trace('www: ' + this.height);
				controlPoints[k].itemWidth = this.width;
				//controlPoints[k].itemHeight = lineHeight / NUM_CONTROL_POINTS;
				//D_Y_CPS = 40;
				//cpDistance = (lineHeight / NUM_CONTROL_POINTS);
				//controlPoints[k].y = offsetTop + cpDistance * k;
			}
			draw();
			
			
		}
		
		/* yPos is a number between 0 and 1 */
		/* returns a number between 0 and 1 */
		public function value(yPos:Number):Number {
			//
			//trace(yPos);
			
			var ret:Number = 0;
			
			var max_value:Number = NUM_CONTROL_POINTS-1;
			// relative location (normalised)
			var rel_loc:Number = yPos * (max_value) - int(yPos * max_value);
			// place in the array
			var place:int = max_value - int(yPos * max_value);
			
			//trace(place);
			var val_1:Number = controlPoints[place].value;
			
			var val_2:Number = 0;
			
			if(place < 1){
				val_2 = 0;
			} else {
				val_2 = controlPoints[place-1].value;
			}
			
			//trace(val_2);
			
			if(place == 1){
				//trace(val_1);
			}
			
			
			return val_2 * rel_loc + val_1 * (1-rel_loc) ;
		}
		
		public override function get enabled():Boolean {
			return _enabled;
		}
		
		public override function set enabled(value:Boolean):void {
			_enabled = value;
			
			for(var i:int = 0; i < NUM_CONTROL_POINTS; i++){
				if(controlPoints[i]) controlPoints[i].enabled = value;
			
			}
		}
		
		
		
	}
}