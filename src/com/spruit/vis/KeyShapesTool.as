package com.spruit.vis {

	// import libraries
	import flash.display.Sprite;
	import flash.display.StageAlign;
	import flash.events.*;
	import flash.utils.*;
	//import flash.display.SpreadMethod;
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
	import mx.events.ResizeEvent;
	import flash.filters.GlowFilter;
	import flash.filters.DropShadowFilter;
	import flash.display.BitmapData;
	import flash.display.Loader;
	import flash.net.URLRequest;
	import com.spruit.encoders.PNGEnc;
	
	
	
	//import mx.containers.Canvas;
	
	// set framerate
	//[SWF(frameRate="15")]
	
	/* 
	 * KeyShapesTool: 
	 * this tool creates a lamp object consisting of shapes
	 * 
	*/
	public class KeyShapesTool extends UIComponent implements IFocusManagerComponent	{	
		
		// number of horizontal keystrokes available for manipulation
		public static const NUM_SAMPLES:int = 10;
		
		public var waveType:int = KeyShapeSprite.WAVE_SINE;
		
		public var frequency_array:Array = [1,2,3,4,6,8,16,24,32,64];
		/*
			PRIVATE VARIABLES
		*/
		
		private var _fancy:Boolean = false;
		private var _innerCircleWidth:Number = 27;
		
		
		// number of radial control points in layer
		//private const RAD_RES:int = 256;
		//private const SMALL_RAD_RES:int = 256;
		
		// number of layers
		private var NUM_LAYERS:int = 10;
		// distance of the objects
		private var _distance:Number = 5;
		
		
		/* fade speeds determine the amount of frames it uses to interpolate the current value with */
		private var FADE_SPEED:Number = 3;
		private var ROT_FADE_SPEED:Number = 3;
		
		private var HEIGHT_FADE_SPEED:Number = 10;
		private var ROT_SPEED:Number = .1;
		
		// the orientation of the shape
		private var orientation:Number = 0;
		private var or_speed:Number = 0;
		
		private var start_mouse_x:Number = 0;
		private var start_mouse_y:Number = 0;
		//private var dragging:Boolean = false;
		
		
		
		private var _pause:Boolean = false;
		
		
		
		// base volume
		public var vol:Number = 100;
		// the base volume (cannot get smaller than this)
		private const BASE_VOL:Number = 20;
		public var sampleVol:Number = 11;
		
		// array of layers
		private var sprites:Array = new Array;
		// array of samples
		private var samples:Array = new Array;
		
		// shape controller
		private var _sc:ShapeController;
		// the amount of pixels the shape controller should be offset when in pause mode
		private const SC_PAUSE_OFFSET:Number = 0;
		
		private var bg:Sprite = new Sprite();
		
		
		// minimum size of the circle
		private var MIN_SIZE:Number = 30;
		private var MAX_SIZE:Number = 150;
		
		
		// start position of the shape
		private var start_pos_x:Number = vol + BASE_VOL + sampleVol*3;
		private var start_pos_y:Number = vol / 2;
		
		// constructor
		public function KeyShapesTool()	 {	
			
			
			super();
			
			// align all sprites to center of screen
			//stage.align = StageAlign.LEFT;
			
			// create event listener that runs "onEnterFrame" function on enter frame
			addEventListener(Event.ENTER_FRAME, onEnterFrame);
			// create event listener that routs the focus event through to the active Sprite
			
			
			// create layers and make them drawable
			for(var i:int = 0; i < NUM_LAYERS; i++)  {
				sprites[i] = new KeyShapeSprite();
				sprites[i].name = 'sprite_' + i;
				
				//trace('----names: ' + sprites[i].name);
				addChild(sprites[i]);
				sprites[i].x = 0;
				sprites[i].y = i * _distance;
				sprites[i].z = i * _distance;
			}
			
			// set initial layer properties
			
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
			
			
			
			addEventListener(MouseEvent.MOUSE_MOVE, onMouseMove);
			addEventListener(MouseEvent.MOUSE_DOWN, onMouseDown);
			addEventListener(MouseEvent.MOUSE_UP, onMouseUp);
			
			
			// a bit of graphic goodness
			//this.filters = [ new DropShadowFilter(5, 90, 0xD3567A, 0.8, 0, 0, 1, .3, true, true) ];
			
			var bgLoader:Loader = new Loader();
			try {
				bgLoader.load(new URLRequest("media/tube_small.swf"));
			} catch( e:Error ){
				trace("[ERROR]: tube_small.swf not found");
			}
			
			//bgLoader.width = this.innerCircleWidth;
			//bg.addChild(bgLoader);
			
			
		}
		
		
		public function onEnterFrame(e:Event):void	{
			
			// if the component is not enabled, do nothing
			if(!this.enabled) return;
			
			//trace('frame is here!');
			//_sc.height = NUM_LAYERS * _distance + start_pos_y;
			
			//start_pos_x = width / 2;
			
			/* set the offset for the shape controller */
			if(_sc){
				_sc.lineHeight = (NUM_LAYERS-1) * _distance;
				//trace('num_layers: ' + NUM_LAYERS);
				_sc.width = vol;
				_sc.offsetLeft = start_pos_x + BASE_VOL*2;
				_sc.offsetTop = start_pos_y;
				
			} 
			
			// still a bit of hack
			/*
			this.height = _distance * NUM_LAYERS + vol;
			this.width = (vol + BASE_VOL*2 + sampleVol*3) * 2;
			start_pos_x = vol + BASE_VOL + sampleVol*3;
			*/
			
			
			bg.x = start_pos_x + BASE_VOL - innerCircleWidth / 2;
			bg.y = NUM_LAYERS * _distance + vol/4;
			
			
			//var scale:Number = innerCircleWidth / bg.width;
			
			//bg.width = innerCircleWidth;
			
			
			/*
			bg.graphics.clear();
			
			bg.graphics.lineStyle(1,0xFFFFFF,1);
			//bg.graphics.beginFill(0x0, 0);
			bg.graphics.drawRect(0,0,width,height);
			
			//bg.graphics.endFill();
			
			addChild(bg);
			*/
			
			
				
			if(!_pause){
			
				// first, calculate the new position of the samples array
				calculateSamples();
				
				// create new layer instance
				var sp:KeyShapeSprite = new KeyShapeSprite();			
				//draw the sprite
				
				sp.vol = vol;
				sp.fancy = _fancy;
				sp.waveType = waveType;
				sp.init(samples);
				
				addLayer(sp);
			} else {
				orientation += or_speed;
				//calculateSamples();
				hideLayers();
				showLayers();
				
			}
			
			
		}
		
		private function showLayers():void {
			
			
			
			for(var i:int = 0; i < sprites.length; i++){
				sprites[i].name = 'sprite_' + i;
				sprites[i].angle = orientation;
				sprites[i].fancy = _fancy;
				
				var relative_pos:Number = i/(sprites.length-1);
				
				if(_sc)
					sprites[i].volScale = (BASE_VOL / vol) + _sc.value(relative_pos);
				else
					sprites[i].volScale = (BASE_VOL / vol) + 1;
				
				
				sprites[i].draw();
				
				addChild(sprites[i]);
				
				//sprites[i].calculatePoints();
				
				if(sprites.length != NUM_LAYERS){
					trace("ERROR: less layers than expected (" + sprites.length + ")");
				}
				
				sprites[i].y = (sprites.length - i-1) * _distance + start_pos_y;
				sprites[i].x = start_pos_x + BASE_VOL;
				sprites[i].z = (i+1) * _distance;
				
				sprites[i].innerCircleWidth = _innerCircleWidth;
				
			}
			
		}
		
		private function hideLayers():void {
			
			// delete all references to display
			for(var j:int = 0; j < sprites.length; j++){
				var sp_remove:KeyShapeSprite = KeyShapeSprite(this.getChildByName('sprite_' + j));
				
				//if(sp_remove == null){ trace('ERROR: this is weird! We can\'t find the sprite you were looking for'); }
				
				removeChild(sp_remove);
			}
		}
		
		private function addLayer(sp:KeyShapeSprite):void {
			// rearrange layers
			//trace("num_children on addLayer(=" + this.numChildren);
			
			//outputChildNames('addLayer_');
			
			hideLayers();
			
			
			// remove the first element from the array and move the rest a spot down
			sprites.shift();
			// add the new element to the end of the array
			sprites.push(sp);
			
			showLayers();
		}
		
		public function myKeyDownHandler(event:KeyboardEvent):void  {
			
			
			if(KeyArray.keys[event.keyCode.toString()]){
				var current_n:int = KeyArray.keys[event.keyCode.toString()].n;
				var current_direction:int = KeyArray.keys[event.keyCode.toString()].type;
				
				samples[current_n].target_volume = (sampleVol - current_n);
				samples[current_n].type = current_direction;
				
				trace("keydown: " + current_n);
			}
			
					
			/*
			if(event.keyCode == 32)	{
				_pause = !_pause;
			}*/
		}
		
		public function myKeyUpHandler(event:KeyboardEvent):void  {
			
			if(KeyArray.keys[event.keyCode.toString()]){
				var current_n:int = KeyArray.keys[event.keyCode.toString()].n;
				var current_direction:int = KeyArray.keys[event.keyCode.toString()].type;
				
				samples[current_n].target_volume = 0;
				samples[current_n].type = KeyShapeSprite.TYPE_MIDDLE;
				
				//trace("keyup: " + current_n);
			}
		}
		
		private function onMouseMove(e:MouseEvent):void {
			//trace(e.localX);
			if(_pause && e.buttonDown){
			// rotate the layers
				
					
					or_speed = .001 * (e.stageX - start_mouse_x);
					//sprites[j].draw();
					
			}
			//vol = Math.abs(e.localX);
		}
		
		private function onMouseDown(e:MouseEvent):void {
			
			start_mouse_x = e.stageX;
			start_mouse_y = e.stageY;
			
		}
		
		public function onMouseOut(e:MouseEvent):void {
			//dragging = false;
		}
		
		private function onMouseUp(e:MouseEvent):void {
			// we didn't move the mouse (we clicked)
			if(start_mouse_x == e.stageX && start_mouse_y == e.stageY){
				or_speed = 0;
			}
			
			//dragging = false;
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
		
		
		public function get numLayers():int {
			return NUM_LAYERS;
		}
		
		public function set numLayers(value:int):void {
			
			//trace('old numChildren:' + this.numChildren);
			for(var j:int = 0; j < sprites.length; j++){
				var sp:KeyShapeSprite = KeyShapeSprite(this.getChildByName('sprite_' + j));
				removeChild(sp);
			}
			
			
			
			// decide what to do
			if(value < NUM_LAYERS) {
				// we have to delete some elements from sprites array
				sprites.splice(value,(NUM_LAYERS - value));
			}
			
			for(var i:int = 0; i < value; i++){
				sprites[i] = new KeyShapeSprite();
				sprites[i].name = 'sprite_' + i;
				sprites[i].fancy = _fancy;
				sprites[i].x = 0;
				sprites[i].y = (value - i-1) * _distance;
				sprites[i].z = i * _distance;
				addChild(sprites[i]);
			}
			
			
			NUM_LAYERS = value;
			
			
		}
		
		public function get fancy():Boolean {
			return _fancy;
		}
		
		public function set fancy(value:Boolean):void {
			_fancy = value;
			for(var i:int = 0; i < NUM_LAYERS; i++){
				sprites[i].fancy = value;
				sprites[i].draw();
			}
			
			if(_fancy){
				this.filters = [ new GlowFilter(0xF2F2F2,1, 32,32,1,1, false, false ) ]; 
			} else {
				this.filters = [];
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
		
		public function get distance():Number {
			return _distance;
		}
		
		public function set distance(value:Number):void {
			_distance = value;
		}
		
		public function get rotSpeed():Number {
			return ROT_SPEED;
		}
		
		public function set rotSpeed(value:Number):void {
			ROT_SPEED = value;
		}
		
		public override function get minHeight():Number {
			return _distance * NUM_LAYERS + vol;
		}
		
		public override function get minWidth():Number {
			return (vol + BASE_VOL*2 + sampleVol*3) * 2;
		}
		
		public function set pause(value:Boolean):void {
			_pause = value;
			
			if(_pause){
				// standard rotation speed
				or_speed = .02;
				
				if(_sc) _sc.x += SC_PAUSE_OFFSET;
			} else {
				if(_sc) _sc.x -= SC_PAUSE_OFFSET;
			}
		}
		
		public function get pause():Boolean {
			return _pause;
		}
		
		public function set sizeController(sc:ShapeController):void {
			_sc = sc;
			_sc.offsetLeft = start_pos_x;
			
			
		}
		
		public function set shapeThickness(value:Number):void{
			for(var i:int = 0; i < NUM_LAYERS; i++){
				sprites[i].backgroundOffset = value;
			}
		}
		
		public function set innerCircleWidth(value:Number):void {
			this._innerCircleWidth = value;
			for(var i:int = 0; i < NUM_LAYERS; i++){
				
				sprites[i].innerCircleWidth = _innerCircleWidth;
			}
		}
		
		public function get innerCircleWidth():Number {
			return _innerCircleWidth;
		}
		
		
		/* UTILITY FUNCTIONS */
		private function outputChildNames(val:String):void
		{
			trace('_outputFileNames_______' + val);
			for(var j:int = 0; j < this.numChildren; j++){
				//var sp:Sprite = Sprite(this.getChildByName('sprite_' + j));
				var sp:Sprite = Sprite(this.getChildAt(j));
				trace('-spritename: ' + sp.name);
			}
			
		}
		
		public function exportToString():String {
			
			var output:String = "";
			
			output += "[KDF]\n";
			output += "-layers=" + NUM_LAYERS + "\n";
			
			for(var i:Number = 0; i < NUM_LAYERS; i++){
				output += "-layer=" + i + "\n";
				//trace(sprites[i].exportToString());
				output += sprites[i].exportToString();
			}
			
			return output;
		}
		
		public function loadData(data:String):Boolean{
			// parse the KDF format
			pause = true; // set the tool on pause
			
			// hide the existing layers
			//hideLayers();
			
			
			//trace("KeyShapesTool [loadData] " + data);
			
			if(data){
				// parse the data
				var result:Array = parseData(data);
				
				if(result.length < 1){
					// error
					trace("[ERROR] no result returned by parseData");
					return false;
				}
				
				//trace("amount of new layers:" + result.length);
				numLayers = result.length;
				for(var i:int = 0; i < result.length; i++){
					// loop through the list and add an item for each, filled with the right data
					
					// create new layer instance
					var sp:KeyShapeSprite = new KeyShapeSprite();			
					
					sp.vol = result[i].vol;
					sp.fancy = _fancy;
					sp.waveType = result[i].waveType;
					sp.init(result[i].samples);
						
					addLayer(sp);
				}
				
				
			}
			trace("FINISHED loading, numChildren: " + this.numChildren);
			// return false on failure, true of success
			return true;
		}
		
		// parse KDF data, returns an array if successful
		private function parseData(data:String):Array{
			
			var result:Array = [];
			
			var raw_result:Array = data.split("\n");
			//trace("number of data items:" + result.length);
			
			var success:Boolean = true;
			
			var header:String = raw_result.shift();
			if(header == '[KDF]'){
				//trace("[PARSER] header OK");
				
				// get the amount of layers
				var strNumLayers:String = raw_result.shift();
				
				if(strNumLayers.split("=")[0] == '-layers'){
					
					var num_layers:int = int(strNumLayers.split("=")[1]);
					//trace("[PARSER] num_layers OK = " + num_layers);
					// get the layers one by one, we now know how many we need, so loop!
					
					for(var i:int=0; i < num_layers; i++){
						//trace("[PARSER] parse layer " + i);
						var layerId:Number = Number(raw_result[i*4].split("=")[1]);
						if(!layerId == i){
							success = false;
						}
						
						var layerVol:Number = Number(raw_result[i*4+1].split("=")[1]);
						var layerType:int = int(raw_result[i*4+2].split("=")[1]);
						var layerSamplesStr:String = raw_result[i*4+3].split("=")[1];
						
						var raw_layerSamples:Array = layerSamplesStr.split("|");
						
						//trace("layer samples: " + layerSamplesStr);
						// parse the samples
						var layerSamples:Array = new Array();
						
						// make a new samples array and fill it
						for(var j:int = 0; j < KeyShapesTool.NUM_SAMPLES; j++)  {
							layerSamples[j] = new Object();
							layerSamples[j] = {  
											volume: 0 ,			// current volume
											target_volume: 0, 	// max volume
											//n: 3 + Math.round(0.5 * Math.pow(j,2)), 			// number of waves
											n: 1,
											pos: 0,				// current position relative to origin
											rad_v: 0,			// radial velocity
											type: KeyShapeSprite.TYPE_MIDDLE // type of rotation
										};	
						}
						
						// put the right raw samples where they belong in layerSamples
						
						for(var k:int = 0; k < raw_layerSamples.length; k++){
							var n:int = raw_layerSamples[k].split(",")[0]; // get the n from the samples
							var vol:Number = raw_layerSamples[k].split(",")[1];
							var pos:Number = raw_layerSamples[k].split(",")[2];
							if(!(n)) {
								trace("[ERROR] reading itemdata");
							} else {
								layerSamples[k].n = n;
								layerSamples[k].volume = vol;
								layerSamples[k].pos = pos;
							}
							
							
							
						}
						
						result[i] = new Object();
						result[i].vol = layerVol;
						result[i].waveType = layerType;
						result[i].samples = layerSamples;
						
						
					}
				} else {
					trace("[PARSER] [ERROR] wrong num_layers");
					success = false;
				}
			} else {
				trace("[PARSER] [ERROR] wrong header");
				success = false;
			}
			
			
			
			if(success) return result;
			else		return new Array();
		}
		
		public function getImageData():BitmapData {
			//trace("BitmapData] " + this.width + ", " + this.height);
			var bd:BitmapData = new BitmapData(minWidth, minHeight,true, 0xFFFFFF);
			//bd.copyPixels(bd,new Rectangle(start_pos_x, start_pos_y,vol * 2, NUM_LAYERS * _distance),new Point(0,0));
			bd.draw(this);

			return bd;
		}
		
		
		public function getPNGData():ByteArray {
			return PNGEnc.encode(getImageData());
		}
		
	}	
}