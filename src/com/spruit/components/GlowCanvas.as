package com.spruit.components
{
	import flash.filters.DropShadowFilter;
	import flash.filters.BitmapFilterQuality;
	import mx.containers.Canvas;	
	
	public class GlowCanvas extends Canvas
	{
		public function GlowCanvas():void	{
			
			super();
			
			var myDropShadow:DropShadowFilter = new flash.filters.DropShadowFilter();
			myDropShadow.color = 0x0;
			myDropShadow.blurX = 8;
			myDropShadow.blurY = 8;
			myDropShadow.distance = 0;
			myDropShadow.strength = 1.7;
			myDropShadow.alpha = .6;
			myDropShadow.quality = BitmapFilterQuality.MEDIUM;

			var myTempFilters:Array = this.filters;
			myTempFilters.push(myDropShadow);
			this.filters = myTempFilters;

		}
	}
}