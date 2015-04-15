package com.ludens.LSystemsPro
{
	public interface ITurtle
	{
		function get x():Number
		function get y():Number;
		function set x(value:Number):void;
		function set y(value:Number):void;
		function get angle():Number;
		
		function get lineColor():int;
		function set lineColor(value:int):void;
		
		function get lineThickness():Number;
		function set lineThickness(value:Number):void;
		
		function get lineColorHSV():Object;
		function set lineColorHSV(hsv:Object):void;
		
		
		function set lineLength(value:Number):void;
		function get lineLength():Number;
		
		function moveForward(length:Number = NaN):void;
		function moveBackward(length:Number = NaN):void;
		
		//function moveForward(length:Number):void;
		
		function hueUp():void;
		function hueDown():void;
		function saturationUp():void;
		function saturationDown():void;
		function brightnessUp():void;
		function brightnessDown():void;
		
		function rotateLeft(angle:Number):void;
		
		function rotateRight(angle:Number):void;
		function resetRotation():void;
		
		//function clone():ITurtle;
		
		// state changing functions
		
		function pushState():void;
		
		function popState():void;
	}
}