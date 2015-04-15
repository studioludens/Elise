package com.ludens.LSystemsPro
{
	import flash.display.*;
	import flash.events.*;
	import flash.filters.*;
	import flash.utils.*;
	
	/**
		 * experimental SVG support.
		 * 
		 * TODO: place this in a proper class
		 * 
		 */
		
		
		
	public class SVGExporter
	{
		public function SVGExporter()
		{
		}
		
		private static var __svgStart:String = '<?xml version="1.0" encoding="iso-8859-1"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">" '; 
		
		
		private static var __svgTag:String = '<svg xml:space="preserve"></svg>';
		private static var __pathTag:String = '<path fill="none" x="0" y="0" stroke="#000000"></path>';
		
		public static function export(svgPoints:Array, metadata:XML):Object {
			
			// for export time
			var time:int = getTimer();
			
			var boxWidth:Number = 200;
			var boxHeight:Number = 200;
			//var output:String = SVGExporter.__svgStart + ' height="' + boxHeight + 'mm" width="' + boxWidth + 'mm"' + SVGExporter.__svgItem1;
			
			var svgXml:XML = new XML(SVGExporter.__svgTag);
			svgXml.@height = boxHeight + "mm";
			svgXml.@width = boxWidth + "mm";
			
			
			
			
			var xMin:Number = Number.POSITIVE_INFINITY;
			var yMin:Number = Number.POSITIVE_INFINITY;
			var xMax:Number = Number.NEGATIVE_INFINITY;
			var yMax:Number = Number.NEGATIVE_INFINITY;
			
			// get the bounds
			
			for(var i:int = 0; i < svgPoints.length; i++){
				if(svgPoints[i].x < xMin) xMin = svgPoints[i].x;
				if(svgPoints[i].y < yMin) yMin = svgPoints[i].y;
				if(svgPoints[i].x > xMax) xMax = svgPoints[i].x;
				if(svgPoints[i].y > yMax) yMax = svgPoints[i].y;
			}
			
			var xScale:Number = boxWidth / (xMax - xMin);
			var yScale:Number = boxHeight / (yMax - yMin);
			
			var totalScale:Number = (xScale > yScale ? xScale : yScale);
			
			// set the current color
			var currentColor:uint = 0; //_lineColor;
			var currentThickness:Number = 1; // _lineThickness * totalScale;
			
			// form the current <path> SVG elements
			var currentPath:XML = new XML(SVGExporter.__pathTag);
			// set stroke color
			// convert to rgb for use in stroke="rgb(r,g,b)"
			var red:int = currentColor >> 16 & 0xFF;
			var green:int = currentColor >> 8 & 0xFF;
			var blue:int = currentColor & 0xFF;

			currentPath["@stroke"] = "rgb(" + red + "," + green + "," + blue + ")";
			currentPath["@stroke-width"] = Math.max(currentThickness, 0.001);
			
			
			// starting point
			
			
			var currentInstructions:String = "M0,0";
			var lastAction:String = "";
			var scaledX:Number = 0;
			var scaledY:Number = 0;
			var currentPos:String = "0,0";
			var lastPos:String;
			
			for(var j:int = 0; j < svgPoints.length; j++){
				
				lastAction = action;
				
				var action:String = svgPoints[j].action;
				
				if(action == "M" ||  action == "L" || action == "A"){
					scaledX = svgPoints[j].x * totalScale;
					scaledY = svgPoints[j].y * totalScale;
					
					lastPos = currentPos;
					currentPos = scaledX + "," + scaledY;
				}
				
				
				
				if(action == "M" || action == "L"){
					
					currentInstructions += action + currentPos;
				
				} else if(action == "A"){
					// draw an arc
					var scaledR:Number = svgPoints[j].parameters.r * totalScale;
					
					currentInstructions += action 
					       + scaledR + "," + scaledR 
					       + " 0 " + (svgPoints[j].parameters.direction ? "1" : "0")
					       + "," + (svgPoints[j].parameters.large ? "1" : "0")
					       + " " + currentPos;
					
				} else if(action == "P"){
					// draw lines on the special polygon path
					
					/**
					 * TODO: implement this
					 */
				} else if(action == "S"){
					// push current path in the list
					
					
					// form the current <path> SVG elements
					
					
					// only add new path if the position has changed. This prevents multiple 
					// sequential line operations from creating empty paths
					if(lastAction != action) {
						
						currentPath.@d = currentInstructions;
						svgXml.* += currentPath.copy();
						//trace("[LSystemTool][getSVG] curpos( "+ currentPos + ")");
						currentPath = new XML(__pathTag);
						// reset line start to new location
						currentInstructions = "M" + currentPos;
					}
					
					// set new values
					
					currentColor = svgPoints[j].parameters.lineColor;
					currentThickness = svgPoints[j].parameters.lineThickness * totalScale;
					
					// set stroke color
					
					// convert to rgb for use in stroke="rgb(r,g,b)"
					var red:int = currentColor >> 16 & 0xFF;
					var green:int = currentColor >> 8 & 0xFF;
					var blue:int = currentColor & 0xFF;

					currentPath["@stroke"] = "rgb(" + red + "," + green + "," + blue + ")";
					currentPath["@stroke-width"] = (currentThickness > 0 ? currentThickness : 0.001);
					// start new path
					// starting point  :should be?
					
				}
			}
			
			
			currentPath.@d = currentInstructions;
			// add the last path to the SVG
			svgXml.g.* += currentPath.copy();
			
			// add metadata with the xml for the l-system
			
			svgXml.metadata.* += metadata;
			
			var timeTaken:uint = getTimer() - time;
			
			//trace(output);
			return {xml: svgXml, timeTaken: timeTaken};
			
		}
		
		
		  private static function zeroPad(number:String, width:int):String {
			   var ret:String = ""+number;
			   while( ret.length < width )
			       ret="0" + ret;
			   return ret;
		  }


	}
}