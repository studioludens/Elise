package com.spruit.vis
{
	import flash.display.Sprite;
	import flash.events.*;
	import flash.utils.*;
	import flash.display.SimpleButton;
	import flash.geom.Rectangle;
	
	public class HControlPoint extends Sprite	{
		
		public var mouse_down:Boolean = false;
		
		public  var id:int;
		public  var rad:Number;
		/*private var x_init:Number;
		private var y_init:Number;
		*/
		private var cp_drag_width:Number = 0;
		private var cp_drag_height:Number = 0;
		
		public var x_ball:Number = 0;
		
		private var _pos:Number = 1;
		
		public var lineColor:int = 0xAAAAAA;
		
		public var hBorder:int = 30;
		
		/* objects the control points exists of */
		private var _button:SimpleButton = new SimpleButton();
		private var _clickArea:Sprite    = new Sprite();
		
		private var _enabled:Boolean = true;

		public function HControlPoint(id_input:int, rad_input:Number)	{	
										
			init(id_input, rad_input);
		
			
		}
		
		public function init(id_input:int, rad_input:Number):void{
			this.id = id_input;
			//this.x = x_input;
			//this.x_ball = x_input;
			//this.y = y_input;
			//this.x_init = x_input;
			//this.y_init = y_input;
			this.rad = rad_input;
			//this.cp_drag_width = cp_drag_width_input;
			//this.cp_drag_height = cp_drag_height_input;
			//this._button.x = x_input;
			
			addChild(_clickArea);
			
				
   			drawButton();
			activateButton();
										
		}
		
		private function onEnterFrame(e:Event):void {
			//trace(mouse_down);
			
			if(mouse_down && _enabled){
				var weight:Number = .3 * Math.abs(mouseY);
				weight *= weight * weight;
				//trace(weight);
				_pos = ((_pos)*weight + (Math.min(Math.max(mouseX,0),cp_drag_width)) / cp_drag_width)/(weight+1);
				
				x_ball = _pos * cp_drag_width;
				
				_button.x = _pos * cp_drag_width;
				
				//trace('we are moving point ' + id);
				
			}
			
			/*
			this.alpha = 3 * Math.exp(
							-((mouseX - _button.x) * (mouseX - _button.x)) / (50 * 50));
			*/
			
		}
		
		private function drawClipArea():void{
			_clickArea.graphics.clear();
			//_clickArea.graphics.lineStyle(0, 0x000000, 0);
			
			_clickArea.graphics.lineStyle(0, 0xFFFFFF, 0);
			_clickArea.graphics.beginFill(0x0, 0);
			_clickArea.graphics.drawRect(-hBorder, 0 - (cp_drag_height/2), cp_drag_width + hBorder*2, cp_drag_height);
			//_clickArea.graphics.drawRect(0, 0, cp_drag_width, cp_drag_height);
			_clickArea.graphics.endFill();
			_clickArea.graphics.moveTo(0,0);
			_clickArea.graphics.lineTo(width,0);
			
		}
		
		public function drawButton():void {
		
		      var down:Sprite = new Sprite();
		      down.graphics.beginFill(0xAAAAAA);
			  down.graphics.lineStyle(1, lineColor,0);
			  down.graphics.drawCircle(0, 0, rad);
			  down.graphics.endFill();
		
		      var up:Sprite = new Sprite();
		      up.graphics.beginFill(lineColor);
			  up.graphics.lineStyle(1, 0x0,1);
			  up.graphics.drawCircle(0, 0, rad);
			  up.graphics.endFill();
		
		      var over:Sprite = new Sprite();
		      over.graphics.beginFill(0x444444);
			  over.graphics.lineStyle(1, lineColor,0);
			  over.graphics.drawCircle(0, 0, rad);
			  over.graphics.endFill();
		
		      _button.upState = up;
		      _button.overState = over;
		      _button.downState = down;
		      _button.useHandCursor = true;
		      _button.hitTestState = up;
		      //_button.width = rad;
		
		      addChild(_button);
		}
		
		private function activateButton():void {
			addEventListener(MouseEvent.MOUSE_MOVE, pointMouseMove);
			addEventListener(MouseEvent.MOUSE_DOWN, pointMouseDown);
			addEventListener(MouseEvent.MOUSE_UP, pointMouseUp);
			addEventListener(MouseEvent.MOUSE_OUT, pointMouseOut);
			addEventListener(MouseEvent.ROLL_OUT, pointMouseOut);
			addEventListener(MouseEvent.ROLL_OVER, pointMouseOver);
			addEventListener(Event.ENTER_FRAME, onEnterFrame);
    	}
    	
    	private function pointMouseMove(event:MouseEvent):void	{
    		if(event.buttonDown)	{
    			
    			//if(this.mouseX > 0 && this.mouseX < cp_drag_width){
	    		mouse_down = true;
	    		
	    		var weight:Number = .2 * Math.abs(mouseY);
	    		
	    		
				//trace(weight);
				_pos = ((_pos)*weight + (Math.min(Math.max(mouseX,0),cp_drag_width)) / cp_drag_width)/(weight+1);
				
				
				x_ball = _pos * cp_drag_width;
				
				_button.x = _pos * cp_drag_width;
				
				trace('dragged to --  value: ' + value);
	    			
    		}
    	}
    	
    	public function pointMouseDown(event:MouseEvent):void	{
    		mouse_down = true;
    	}
    	
    	public function pointMouseOver(event:MouseEvent):void	{
    		//trace('rollover' + id);
    		if(event.buttonDown)
    			mouse_down = true;
    		else
    			mouse_down = false;
    	}
    	
    	private function pointMouseUp(event:MouseEvent):void	{
    		mouse_down = false;
    	}
    	private function pointMouseOut(event:MouseEvent):void {
    		mouse_down = false;
    	}
    	
    	public function set itemWidth(value:Number):void {
    		cp_drag_width = value;
    		drawClipArea();
    		
    		//this._pos = 1;
    		this.x_ball = this._pos * cp_drag_width;
    		this._button.x = this._pos * cp_drag_width;
    	}
    	
    	public function get itemWidth():Number {
    		return _pos;
    		
    	}
    	
    	public function set itemHeight(value:Number):void {
    		cp_drag_height = value;
    		//drawClipArea();
    	}
    	
    	public override function set width(value:Number):void {
    		trace('newwidth: ' + value);
    		
    	}
    	
    	public function get value():Number {
    		return _pos;
    		
    	}
    	
    	public function set value(val:Number):void {
    		
    		_pos = val;
    		x_ball = _pos * cp_drag_width;
    		_button.x = _pos * cp_drag_width;
    		//trace('value set!' + cp_drag_width);
    		//this._button.x = this.x_ball;
    		
    	}
    	
    	public function get enabled():Boolean {
			return _enabled;
		}
		
		public function set enabled(value:Boolean):void {
			_enabled = value;
		}
    	
	}
}
