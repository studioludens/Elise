package com.spruit.vis
{
	import flash.display.Sprite;
	import mx.graphics.*;
	import flash.geom.*;
	import flash.display.Shape;
	import flash.display.Graphics;
	import flash.utils.ByteArray;
	import mx.charts.renderers.ShadowLineRenderer;
	import flash.filters.*;

	public class KeyShapeSprite extends Sprite
	{
		
		
		public static const TYPE_MIDDLE:int = 2;
		public static const TYPE_LEFT:int = 1;
		public static const TYPE_RIGHT:int = 3;
		
		public static const WAVE_SINE:int = 1;
		public static const WAVE_BLOCK:int = 2;
		public static const WAVE_SPIKE:int = 3;
		public static const WAVE_SUPERSHAPE:int = 4;
		public static const WAVE_BLOB:int = 5;
		
		public var lineColor:Number = 0xDDDDED;
		public var fancy:Boolean	= false; // if fancy, use the dvanced rendering with filters to display the object
		public var fancyAlpha:Number = 0.3;
		public var waveType:int = WAVE_SINE;
		
		public var innerCircleWidth:Number = 26;
		
		
		public var volume:Number 			= 0; // current volume
		public var target_volume:Number 	= 0; // max volume
		public var angle:Number		= 0; // rotation for rendering
		
		/* private variables */
		public var vol:Number				= 30; // volume
		public var volScale:Number			= 1;
		
		
		/* position on the z axis */
		public var z:Number 				= 0;
		public var pan:Number				= 200;
		public var focalLength:Number 		= 600;
		
		/*
			PRIVATE VARIABLES
		*/
		// samples
		// array of samples
		private var samples:Array = new Array;
		
		private var _rot_speed:Number = .1;
		private var _fade_speed:Number = 10;
		
		private var _rad_res:int = 150;
		// the datapoints to be drawed
		private var datapoints:Array;
		
		private var draw_shape:Sprite = new Sprite();
		private var background_shape:Sprite = new Sprite();
		private var middle_shape:Sprite = new Sprite();
		private var render_shapes:Sprite = new Sprite();
		private var bottom_shape:Sprite = new Sprite;
		
		private var _background_offset:Number = 6;
		
		
		public function KeyShapeSprite():void {
			
			super();
			
			// set initial layer properties
			var frequency_array:Array = [1,2,3,4,6,8,16,24,32,64];
			for(var j:int = 0; j < KeyShapesTool.NUM_SAMPLES; j++)  {
				samples[j] = new Object();
				samples[j] = {  
								volume: 0 ,			// current volume
								target_volume: 0, 	// max volume
								//n: 3 + Math.round(0.5 * Math.pow(j,2)), 			// number of waves
								n: frequency_array[j],
								pos: 0,				// current position relative to origin
								rad_v: 0,			// radial velocity
								type: KeyShapeSprite.TYPE_MIDDLE // type of rotation
							};	
			}
			
			
			datapoints = new Array(_rad_res);
			for(var i:int = 0; i < _rad_res; i++){
				//datapoints[i]:Object = new Object();
				//datapoints[i] = {x:0, y:0};
				datapoints[i] = new Object();
				datapoints[i].x = 0;
				datapoints[i].y = 0;
			}
			
		}
		
		public function init(init_samples:Array):void{
			//trace('inited nr ' + name);
			
			// create a copy of init_samples, not a reference
			var ba:ByteArray = new ByteArray();
			ba.writeObject(init_samples);
			ba.position = 0;
			
			samples = ba.readObject();
			
			
			calculatePoints();
			draw();
		}
				
		
		public function calculatePoints():void {
			// fill the array with points to draw
			
			for(var i:int = 0; i < _rad_res; i++)  {
				// define location on circle
				var loc:Number = (i/_rad_res)*Math.PI*2;
				
				// calculate the current amplitude
				var theta:Number = 0;
				
				for(var j:int = 0; j < KeyShapesTool.NUM_SAMPLES; j++)  {
					
					if(samples[j].volume > .2){
						// SHAPE: just a regular sine waveform
						if(waveType == WAVE_SINE){
							theta += samples[j].volume * Math.sin(samples[j].n * (loc + samples[j].pos));
							continue;
						} 
						
						
						// SHAPE: a block waveform
						if(waveType == WAVE_BLOCK){
							theta += samples[j].volume * 
									 (Math.sin(samples[j].n * (loc + samples[j].pos)) > 0 ? 0.7 : -0.7);
							continue;
						}
						
						
						// SHAPE: a supershape
						if(waveType == WAVE_SUPERSHAPE){
							theta += 0.5 * samples[j].volume * 
									 (-2+Math.pow(4, Math.sin(samples[j].n * (loc + samples[j].pos))));
							continue;
						}
						
						// SHAPE: a spiked shape
						if(waveType == WAVE_SPIKE){
							var spikiness:Number = 3;
							var rel_height:Number = Math.sin(samples[j].n * (loc + samples[j].pos));
							theta += .5 * spikiness * samples[j].volume * (1-Math.pow(1-rel_height, 1/spikiness));
							continue;
						}
						
						if(waveType == WAVE_BLOB){
							theta += samples[j].volume * 
									 (-0.8 + Math.sqrt(1+Math.sin(samples[j].n * (loc + samples[j].pos))));
							continue;
						}
					}
					
					
				}
				
				// put the values in the datapoint array so we can use it do draw
				//datapoints[i] = new Object();
				var sin_loc:Number = Math.sin(loc);
				var cos_loc:Number = Math.cos(loc);
				datapoints[i].y = (vol + theta) * cos_loc;
				datapoints[i].x = (vol + theta) * sin_loc;				
			}
		}
		
		
		public function draw():void {
			
			if(fancy) drawFancy();
			else	  drawNormal();
			
		}
		/*
			function drawNormal():
				draws this shape, using the 2 sprites draw_shape and background_shape with simple 'light shadow' drop effect.
		*/
		private function drawNormal():void{
			
			/* variable definitions */
			var w:Number = vol * 4;
			var h:Number = w/2;
			
			// used to determine correct starting position of line-tool
			var begin_x:Number = 0;
			var begin_y:Number = 0;

			// the two layers we are using to draw on
     		draw_shape.graphics.clear();
     		background_shape.graphics.clear();
	     	
	     	
				// setup a fill to fake light effect
				var fill:RadialGradient = new RadialGradient();
				
				fill.angle = 30;
				fill.focalPointRatio = 0;
			
			    var g1:GradientEntry = new GradientEntry(0x999999,.05,1);
				var g2:GradientEntry = new GradientEntry(0x555555,.1,1);
	   			var g3:GradientEntry = new GradientEntry(0x090909,.6,1);
	  
	     		fill.entries = [g1,g2,g3];
	     		
			
			fill.begin(draw_shape.graphics,new Rectangle(-(w/2),-(h/2),w,h-10));
			
			
			// now define the linestyle
			
			draw_shape.graphics.lineStyle(
				0,
				0x0,
				0);
			
			
			//draw_shape.graphics.beginFill(0xFFFFFF,1);
			
			
			background_shape.graphics.lineStyle(
				0,0,0);
			
			background_shape.graphics.beginFill(0xFFFFFF,1);		
			
			// draw new layer instance
			for(var i:int = 0; i < _rad_res; i++)  {
				
				
				//var pan:Number = 200;
				
				var cur_w:Number = Math.sqrt(datapoints[i].x * datapoints[i].x + datapoints[i].y * datapoints[i].y);
				var cur_angle:Number = Math.atan2(datapoints[i].x, datapoints[i].y);
				var cur_x:Number = datapoints[i].x;
				var cur_y:Number = datapoints[i].y;
				
				//trace(angle);
				var newAngle:Number = cur_angle + angle;
				cur_x = volScale * cur_w * Math.cos(newAngle);
				cur_y = volScale * cur_w * Math.sin(newAngle);
				
				var scale:Number = focalLength / (focalLength + (cur_y));
				
				cur_x *= scale;
				cur_y = scale * (pan) - pan;
				
				// compensate for perspective; this is a hack
				cur_y -= ((vol * volScale)/(.045 * pan));
				// larger = lower, smaller = higher (relative y pos)
				
				// read out the first value and put the cursor on that position
				if(i == 0)  {
					draw_shape.graphics.moveTo(cur_x, cur_y);
					background_shape.graphics.moveTo(cur_x, cur_y+_background_offset);
					
					begin_x = cur_x;
					begin_y = cur_y;
				}
				
				
				draw_shape.graphics.lineTo(cur_x, cur_y);	
				background_shape.graphics.lineTo(cur_x, cur_y+_background_offset);
							
			}
			
			draw_shape.graphics.lineTo(begin_x, begin_y);
			background_shape.graphics.moveTo(begin_x, begin_y+_background_offset);
			
			//draw_shape.graphics.endFill();
			fill.end(draw_shape.graphics);
			background_shape.graphics.endFill();
			
			addChild(background_shape);
			addChild(draw_shape);
		
		}
		
		/*
			function drawFancy():
				as the name suggests, this function draws a more sophisticated shape using filters to create the edge highlight (on draw_shape)
				and the background, using background_shape.
		*/
		private function drawFancy():void {
		
			
			// used to determine correct starting position of line-tool
			var begin_x:Number = 0;
			var begin_y:Number = 0;

			// the two layers we are using to draw on
     		draw_shape.graphics.clear();
     		background_shape.graphics.clear();
	     	middle_shape.graphics.clear();
	     	
			
			// now define the linestyle
			
			draw_shape.graphics.lineStyle(
				2,
				0xFFFFFF,
				1);
				
			middle_shape.graphics.lineStyle(
				1,
				0xFFFFFF,
				0.7);
			
			
			background_shape.graphics.lineStyle(
				0,0,0);
			
			background_shape.graphics.beginFill(0x111111,fancyAlpha);
			
			
			// draw new layer instance
			for(var i:int = 0; i < _rad_res; i++)  {
				
				
				//var pan:Number = 200;
				
				var cur_w:Number = Math.sqrt(datapoints[i].x * datapoints[i].x + datapoints[i].y * datapoints[i].y);
				var cur_angle:Number = Math.atan2(datapoints[i].x, datapoints[i].y);
				var cur_x:Number = datapoints[i].x;
				var cur_y:Number = datapoints[i].y;
				
				//trace(angle);
				var newAngle:Number = cur_angle + angle;
				cur_x = volScale * cur_w * Math.cos(newAngle);
				cur_y = volScale * cur_w * Math.sin(newAngle);
				
				var scale:Number = focalLength / (focalLength + (cur_y));
				
				cur_x *= scale;
				cur_y = scale * (pan) - pan;
				
				// compensate for perspective; this is a hack
				cur_y -= ((vol * volScale)/(.045 * pan));
				// larger = lower, smaller = higher (relative y pos)
				
				// read out the first value and put the cursor on that position
				if(i == 0)  {
					draw_shape.graphics.moveTo(cur_x, cur_y);
					background_shape.graphics.moveTo(cur_x, cur_y);
					
					begin_x = cur_x;
					begin_y = cur_y;
				}
				
				
				draw_shape.graphics.lineTo(cur_x, cur_y);	
				background_shape.graphics.lineTo(cur_x, cur_y);
							
			}
			
			draw_shape.graphics.lineTo(begin_x, begin_y);
			background_shape.graphics.moveTo(begin_x, begin_y);
			
			background_shape.graphics.endFill();
			
			
			middle_shape.graphics.drawEllipse(-innerCircleWidth / 2, -innerCircleWidth / 6, innerCircleWidth, innerCircleWidth / 3);
			
			
			
			addChild(render_shapes);
			
			render_shapes.addChild(background_shape);
			render_shapes.addChild(draw_shape);
			render_shapes.addChild(middle_shape);
			
			draw_shape.filters = [ new DropShadowFilter( 0, 90, 0xE6EBF2,0.9,0, _background_offset, 2.4, 1,false, false, true) ];
			middle_shape.filters = [ new DropShadowFilter( 0, 90, 0xE6EBF2,0.6,0, _background_offset * 3, 1.8, 1,false, false, true) ];
			//background_shape.filters = [new GlowFilter(0xF2F2F2,1, 32,32,1,1, false, false )];
			
		}
				
		
		public function set rotSpeed(value:Number):void {
			_rot_speed = value;
		}
		
		public function get rotSpeed():Number {
			return _rot_speed;
		}
		
		public function get backgroundOffset():Number {
			return _background_offset;
		}
		
		public function set backgroundOffset(value:Number):void {
			_background_offset = value;
		}
		
		public function exportToString():String {
			
			var output:String = "";
			
			// the volume
			output += "--vol=" + volScale * vol + "\n";
			// the type of wave
			output += "--type=" + waveType + "\n";
			
			output += "--samples=";
			for(var j:int = 0; j < KeyShapesTool.NUM_SAMPLES; j++)  {
				if(samples[j].volume > 0) 
					output += samples[j].n + "," + volScale * samples[j].volume + "," + samples[j].pos + "|";
			}
			output += "\n";
			
			return output;
		}
	}
}