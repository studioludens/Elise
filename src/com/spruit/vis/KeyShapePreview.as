package com.spruit.vis {

	// import libraries
	import flash.display.Sprite;
	import flash.display.StageAlign;
	import flash.events.Event;
	import flash.utils.*;
	import flash.display.SpreadMethod;
	import flash.events.KeyboardEvent;
	import flash.geom.*;
	import mx.core.UIComponent;
	import mx.managers.IFocusManagerComponent;
	import mx.core.IRawChildrenContainer;
	import mx.graphics.*;
	import com.spruit.vis.KeyShapeSprite;
	import flash.events.MouseEvent;
	import com.spruit.vis.KeyArray;
	//import mx.charts.renderers.ShadowBoxItemRenderer;
	//import mx.charts.renderers.ShadowLineRenderer;
	import flash.display.Shape;
	
	
	//import mx.containers.Canvas;
	
	// set framerate
	//[SWF(frameRate="15")]
	
	/* 
	 * KeyShapesTool: 
	 * this tool creates a lamp object consisting of shapes
	 * 
	*/
	public class KeyShapePreview extends UIComponent implements IFocusManagerComponent	{	
		
		// number of horizontal keystrokes available for manipulation
		public static const NUM_SAMPLES:int = 10;
		
		
		/* fade speeds determine the amount of frames it uses to interpolate the current value with */
		private var FADE_SPEED:Number = 3;
		private var ROT_FADE_SPEED:Number = 3;
		
		private var HEIGHT_FADE_SPEED:Number = 10;
		private var ROT_SPEED:Number = .1;
		
		// the orientation of the shape
		private var orientation:Number = 0;
		private var or_speed:Number = .01;
		
		// base volume
		public var vol:Number = 60;
		// the base volume (cannot get smaller than this)
		private const BASE_VOL:Number = 20;
		public var sampleVol:Number = 11;
		
		// array of layers
		private var shape_sprite:KeyShapeSprite = new KeyShapeSprite;
		// array of samples
		private var samples:Array = new Array;
		
		// shape controller
		
		
		
		// start position of the shape
		private var start_pos_x:Number = 0;
		private var start_pos_y:Number = 0;
		
		// constructor
		public function KeyShapePreview()	 {	
			
			
			super();
			
			// create event listener that runs "onEnterFrame" function on enter frame
			addEventListener(Event.ENTER_FRAME, onEnterFrame);
			
			// create layers and make them drawable
			shape_sprite = new KeyShapeSprite();
			//shape_sprite.name = 'sprite_' + i;
				
				//trace('----names: ' + shape_sprite.name);
			
			shape_sprite.x = 0;
			shape_sprite.y = 0;
			shape_sprite.z = 0;
			
			// set initial layer properties
			var frequency_array:Array = [1,2,3,4,6,8,16,24,32,64];
			for(var j:int = 0; j < KeyShapesTool.NUM_SAMPLES; j++)  {
				samples[j] = new Object();
				samples[j] = {  
								volume: (j==3?sampleVol:0) ,			// current volume
								target_volume: (j==3?sampleVol:0), 	// max volume 			
								n: frequency_array[j],// number of waves
								pos: 0,				// current position relative to origin
								rad_v: 0,			// radial velocity
								type: KeyShapeSprite.TYPE_MIDDLE // type of rotation
							};	
			}
			
			//shape_sprite.init(samples);
			//shape_sprite.draw();
			addChild(shape_sprite);
			
		}
		
		
		public function onEnterFrame(e:Event):void	{
			
			//trace('frame is here!');
			//_sc.height = NUM_LAYERS * _distance + start_pos_y;
			
			start_pos_x = width / 2;
			
			
			//calculateSamples();
			shape_sprite.init(samples);
			shape_sprite.draw();
			
				shape_sprite.y = 0;
				shape_sprite.x = this.width / 2;
				shape_sprite.z = 0;
				
			orientation += or_speed;
			
			shape_sprite.angle = orientation;
			
		}

		
		private function calculateSamples():void {
			//vol = 30 + 10 * activeSamples();
			
			for(var i:int = 0; i < KeyShapesTool.NUM_SAMPLES; i++){
				if(samples[i].type == KeyShapeSprite.TYPE_LEFT){
					samples[i].target_rad_v = 1/(Math.sqrt(samples[i].n)) * ROT_SPEED;
				}
				
				if(samples[i].type == KeyShapeSprite.TYPE_RIGHT){
					samples[i].target_rad_v = 1/(Math.sqrt(samples[i].n)) * -ROT_SPEED;
				}
				if(samples[i].type == KeyShapeSprite.TYPE_MIDDLE){
					samples[i].target_rad_v = 0;
				}
				samples[i].rad_v = (samples[i].rad_v * (ROT_FADE_SPEED - 1) + samples[i].target_rad_v) / ROT_FADE_SPEED;
				samples[i].volume = (samples[i].volume * (FADE_SPEED - 1) + samples[i].target_volume) / FADE_SPEED;
				samples[i].pos += samples[i].rad_v;
			}
		}
	
		
		public function get fadeSpeed():int {
			return FADE_SPEED;
		}
		
		public function set fadeSpeed(value:int):void {
			FADE_SPEED = value;
		}
		
		public function get heightFadeSpeed():Number {
			return HEIGHT_FADE_SPEED;
		}
		
		public function set heightFadeSpeed(value:Number):void {
			HEIGHT_FADE_SPEED = value;
		}
		
		public function get rotSpeed():Number {
			return or_speed;
		}
		
		public function set rotSpeed(value:Number):void {
			or_speed = value;
		}
		
		
		public function set shapeThickness(value:Number):void{
				shape_sprite.backgroundOffset = value;
		}
		
	
	}	
}