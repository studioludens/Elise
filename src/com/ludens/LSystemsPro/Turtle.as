package com.ludens.LSystemsPro 
{
	import com.ludens.utilities.ColorUtilExtra;
	
	import flash.geom.Point;
	
	/**
	 * The Turtle class implements a simple 2D Turtle that can react to a number of commands
	 */
	public class Turtle implements ITurtle
	{
		
		
		/**
		 * PUBLIC variables
		 */
	
		public var position:Point;
		
		// the line thickness of the write head
		private var _lineThickness:Number = 1;
		
		private var _lineLength:Number = 300;
		
		
		private var _lineColorHSV:Object;
		
		
		
		private var _lineBri_step:Number = 7;
		private var _lineSat_step:Number = 5;
		private var _lineHue_step:Number = .01;
		
		
		/**
		 * PRIVATE varables
		 */
		 
		private var _angle:Number;
		
		private var angle_dX:Number;
		private var angle_dY:Number;
		
		/* this stack can save the positions and other values of the turtle in 
		   case of a pushState() command
		   
		   instance values can later be retreived with the popState() command
		*/
		
		private var _instanceStack:Array;
		
		private var _instanceCount:int = 0;
		
		/**
		 *  STATIC variables
		 */
		
		static public var toDEGREES :Number = 180/Math.PI;
		static public var toRADIANS :Number = Math.PI/180;
		
		public function Turtle():void {
			
			_angle = 0.0;
			position = new Point();
			position.x = 0;
			position.y = 0;
			
			_instanceStack = new Array();
			
			_lineColorHSV = { hue: 0, sat: .7, bri:1 };
			
			calculateAngle();
			
			
			
		}
		
		private function calculateAngle():void {
			angle_dX = Math.sin(_angle * toRADIANS);
			angle_dY = -Math.cos(_angle * toRADIANS);
		}
		
		/*
		public function clone():ITurtle {
			var t:Turtle = new Turtle();
			t.x = position.x;
			t.y = position.y;
			t.angle = _angle;
			return t;
		}
		*/
		
		public function copy(turtle:Object):void{
			this.x = turtle.x;
			this.y = turtle.y;
			this.angle = turtle.angle;
			
			
			this._lineColorHSV.hue =  turtle.lineHue;
			this._lineColorHSV.sat =  turtle.lineSat;
			this._lineColorHSV.bri =  turtle.lineBri;
			
			this._lineThickness = turtle.lineThickness;
			this._lineLength = turtle.lineLength;
		}
		
		
		
		public function pushState():void {
			
			//trace("[Turtle] pushState() called");
			
			// save all the values and push it onto the array
			var prevTurtle:Object = {
										x: position.x,
										y: position.y,
										angle: _angle,
										
										// colors
										lineHue: _lineColorHSV.hue,
										lineBri: _lineColorHSV.bri,
										lineSat: _lineColorHSV.sat,
										
										lineThickness: _lineThickness,
										lineLength: _lineLength
									};
			
			
			var i:int = _instanceStack.push( prevTurtle );
			
			//trace("[Turtle] pushState() called 2");
			
			_instanceCount++;
		}
		
		public function popState():void {
			
			// TODO: do some checking here
			
			//trace("[Turtle] popState() called");
			var newTurtle:Object = _instanceStack.pop();
			
			this.copy(newTurtle);
			
			
			
			_instanceCount--;
			
			calculateAngle();
		}
		
		public function moveForward(length:Number = NaN):void{
			if(length){
				position.x += length * angle_dX;
				position.y += length * angle_dY;
			} else {
				position.x += _lineLength * angle_dX;
				position.y += _lineLength * angle_dY;
			}
		}
		
		public function moveBackward(length:Number = NaN):void{
			if(length){
				position.x -= length * angle_dX;
				position.y -= length * angle_dY;
			} else {
				position.x -= _lineLength * angle_dX;
				position.y -= _lineLength * angle_dY;
			}
		}
		
		
		
		public function rotateLeft(angle:Number):void{
			_angle -= angle;
			calculateAngle();
		}
		
		
		
		public function rotateRight(angle:Number):void{
			_angle += angle;
			calculateAngle();
		}
		
		public function resetRotation():void {
			_angle = 0;
			calculateAngle();
		}
		
		public function brightnessUp():void {
			_lineColorHSV.bri = (_lineColorHSV.bri * _lineBri_step + 1) / (_lineBri_step + 1);
		}
		
		public function brightnessDown():void {
			_lineColorHSV.bri = (_lineColorHSV.bri * _lineBri_step) / (_lineBri_step + 1);
		}
		
		public function saturationUp():void {
			_lineColorHSV.sat = (_lineColorHSV.sat * _lineSat_step + 1) / (_lineSat_step + 1);
		}
		
		public function saturationDown():void {
			_lineColorHSV.sat = (_lineColorHSV.sat * _lineSat_step) / (_lineSat_step + 1);
		}
		
		public function hueUp():void {
			_lineColorHSV.hue = (_lineColorHSV.hue + _lineHue_step)%1;
		}
		
		public function hueDown():void {
			_lineColorHSV.hue = (_lineColorHSV.hue - _lineHue_step+1)%1;
		}
		
		
		
		
		public function set angle(value:Number):void {
			_angle = value;
			calculateAngle();
		}
		
		public function get angle():Number {
			return _angle;
		}
		
		public function set x(value:Number):void {
			position.x = value;
		}
		
		public function get x():Number {
			return position.x;
		}
		
		public function set y(value:Number):void {
			position.y = value;
		}
		
		public function get y():Number {
			return position.y;
		}
		
		public function get lineThickness():Number {
			return _lineThickness;
			
		}
		
		public function set lineThickness(value:Number):void {
			_lineThickness = value;
		}
		
		
		public function get lineColorHSV():Object {
			return _lineColorHSV;
		}
		
		public function set lineColorHSV(o:Object):void {
			_lineColorHSV = o;
			
		}
		
		public function get lineColor():int {
			//trace("[Turtle] lineColor[h:" + _lineColorHSV.hue + " ,s:" + _lineColorHSV.sat + ' ,b=' + _lineColorHSV.bri + ']');
			return ColorUtilExtra.getRBGfromHSV(_lineColorHSV.hue, _lineColorHSV.sat, _lineColorHSV.bri);
		}
		
		public function set lineColor(value:int):void{
			_lineColorHSV = ColorUtilExtra.getHSVfromRGB(value);
			//trace("lc set");
		}
		
		public function get lineLength():Number {
			return _lineLength;
		}
		
		public function set lineLength(value:Number):void {
			_lineLength = value;
		}
		
	}
}