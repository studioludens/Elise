package com.ludens.LSystemsPro
{
	import flash.geom.Point;

	public class LPoint extends LToken
	{
		public var action:String = '';
		public var x:Number;
		public var y:Number;
		
		public var newValue:Object;
		
		public function LPoint(x:Number=0, y:Number=0, action:String = '', newValue:Object = {})
		{
			this.x = x;
			this.y = y;
			this.action = action;
			this.newValue = newValue;
		}
		
	}
}