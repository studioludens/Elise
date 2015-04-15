package com.spruit.renderers
{
	import mx.core.UIComponent;
	import mx.containers.Canvas;
	import flash.display.DisplayObject;
	import flash.filters.DropShadowFilter;
	import flash.net.URLRequest;
	import flash.utils.*;

	import mx.core.IDataRenderer;
	import flash.display.*;
	import mx.effects.*;
	import flash.events.Event;
	import mx.core.IDataRenderer;
	import flash.events.ProgressEvent;
	import flash.geom.Rectangle;
	import mx.events.DragEvent;
	import flash.events.MouseEvent;
	import mx.controls.listClasses.IListItemRenderer;
	import flash.events.ErrorEvent;
	import mx.controls.Image;
	

	[Style(name="borderColor", type="Number", inherit="no")]
	[Style(name="borderAlpha", type="Number", inherit="no")]
	[Style(name="borderWidth", type="Number", inherit="no")]
	[Event("loaded")]
	
	
	public class KeyShapePreviewTile extends Canvas implements IListItemRenderer
	{
		/* public variables */
		
		[Bindable] public var userName:String;
		[Bindable] public var designName:String;
		[Bindable] public var designId:String;
		[Bindable] public var baseUrl:String;
		[Bindable] public var imageName:String;
		
		[Bindable] public var image:Image;
		
		
		private static var _nextId:int = 0;
		private var _id:int;
		private var _loader:Loader;
		
		private var _baseLoader:Loader;
		
		private var _loaded:Boolean = false;
		private var __loaderWidth:Number = 75;
		private var __loaderHeight:Number = 50;
		private var relScale:Number = 0.75;
		private const BORDER_WIDTH:Number = 0;
		private var _border:Shape;
		private var _background:Sprite;
		
		[Bindable] public var progress:Number = 0;
		
		public function KeyShapePreviewTile()
		{
			_id= _nextId++;

			_background = new Sprite();
			
			rawChildren.addChild(_background);
			
			
			_loader = new Loader;
			_baseLoader = new Loader;
			image = new Image;
			buttonMode = true;
			
			
			//addChild(_loader);
			
//			visible = false;
			
			//_border = new Shape();
			
			//addChild(_border);
			

		}
		
		public function get loaded():Boolean
		{
			return _loaded;
		}
		
		private function loadComplete(e:Event):void
		{
			_loaded = true;
			//_loader.width = 210;
			//_loader.height = 100;
			
			__loaderWidth = _loader.width;
			__loaderHeight =  _loader.height;
			
			_background.visible = false;
			
			rawChildren.addChild(image);
			image.addChild(_loader);
		
			
			
			invalidateSize();
			invalidateDisplayList();
			invalidateSize();
			dispatchEvent(new Event("loaded"));		
			
			
		}
		
		private function baseLoadComplete(e:Event):void {
			
			
			
			invalidateDisplayList();
			invalidateSize();
			
			rawChildren.addChild(_baseLoader);
			
			_baseLoader.x = 55;
			_baseLoader.y = 276;
			_baseLoader.width = 12;
			_baseLoader.height = 100;
			
			invalidateDisplayList();
			
		}
		
		private var _publicAlpha:Number = 1;
		private var _fadeValue:Number = 1;
		private var _data:Object;

		public function get _loaderBounds():Rectangle
		{
			var unscaledWidth:Number = this.unscaledWidth - 2;
			var unscaledHeight:Number = this.unscaledHeight - 2;
			var sX:Number = unscaledWidth/__loaderWidth;
			var sY:Number = unscaledHeight/__loaderHeight;
			var scale:Number = Math.min(sX,sY);
			var tX:Number = 1 + unscaledWidth/2 - (__loaderWidth/2)*scale;
			var tY:Number = 1 + unscaledHeight/2 - (__loaderHeight/2)*scale;
			
			return new Rectangle(tX,tY,__loaderWidth*scale,__loaderHeight*scale);
			//return new Rectangle(0,0,210, 375);
			_loader.x = tX;
			_loader.y = tY;
		}
		
		public override function set data(value:Object):void
		{
			_loaded = false;
			progress= 0;
			_data = value;
			var url:String = String((_data is String)? _data:_data.thumb);
			
			baseUrl = (_data.baseUrl ? _data.baseUrl : "");
			userName = (_data.username ? _data.username : "unknown");
			designName = (_data.name ? _data.name : "");
			designId = (_data.id ? _data.id : "");
			
			
			
			trace("the URL:" + url);
			_loader.load(new URLRequest(baseUrl + url));
			_loader.contentLoaderInfo.addEventListener(Event.COMPLETE,loadComplete);
				
			_loader.contentLoaderInfo.addEventListener(ProgressEvent.PROGRESS,updateProgress);	
			
			
			_baseLoader.load(new URLRequest("media/tube_small.swf"));
			
			_baseLoader.contentLoaderInfo.addEventListener(Event.COMPLETE,baseLoadComplete);
			//
			
			invalidateDisplayList();
			invalidateSize();
		}
		
		
		public override function get data():Object { return _data;}
		
		public function set fadeValue(value:Number):void
		{
			_fadeValue = value;
			super.alpha = _publicAlpha*_fadeValue;
		}
		public function get fadeValue():Number {return _fadeValue;}

		private function updateProgress(e:ProgressEvent):void
		{
			progress = e.bytesLoaded / e.bytesTotal;
			//trace("progress: "+progress);
		}
		override public function set alpha(value:Number):void
		{
			_publicAlpha = value;
			super.alpha = _publicAlpha*_fadeValue;
		}
		

		override protected function measure():void
		{
			measuredWidth = __loaderWidth*relScale+2;
			measuredHeight = __loaderHeight*relScale+2;
		}
		override protected function updateDisplayList(unscaledWidth:Number, unscaledHeight:Number):void
		{
			var bg:Graphics = _background.graphics;
			bg.clear();
			//var g:Graphics = _border.graphics;
			//g.clear();

			if(_loaded == false)
				return;
			
			var borderColor:* = getStyle("borderColor");
			var borderAlpha:* = getStyle("borderAlpha");
			var borderWidth:* = getStyle("borderWidth");
			
			var backgroundColor:* = getStyle("backgroundColor");
			
			if(isNaN(borderColor) || borderColor == null)
				borderColor = 0xBBBBBB;
			if(isNaN(borderAlpha) || borderAlpha == null)
				borderAlpha = 1;
			if(isNaN(borderWidth) || borderWidth == null)
				borderWidth = BORDER_WIDTH;		
			
			if(isNaN(backgroundColor) || backgroundColor == null)
				backgroundColor = 0x000000;				
				
			unscaledWidth -= 2;
			unscaledHeight -= 2;
			var sX:Number = unscaledWidth/__loaderWidth;
			var sY:Number = unscaledHeight/__loaderHeight;
			var scale:Number = Math.min(sX,sY);
			var tX:Number = 1 + unscaledWidth/2 - (__loaderWidth/2)*scale;
			var tY:Number = 1 + unscaledHeight/2 - (__loaderHeight/2)*scale;

			
			_loader.width = __loaderWidth*scale* relScale;
			_loader.height = __loaderHeight*scale* relScale;
			_loader.x = -10;
			_loader.y = 100;
			_baseLoader.x = 53;
			_baseLoader.y = 270;
			_baseLoader.width = 12;
			_baseLoader.height = 100;
			
			//_loader.x = tX;
			//_loader.y = tY;
			
			bg.beginFill(backgroundColor,.4);
			bg.drawRect(_loader.x,_loader.y,_loader.width,_loader.height);
			bg.endFill();				
			
			// don't draw the border
			/*
			g.lineStyle(borderWidth,borderColor,borderAlpha,false,"normal",CapsStyle.NONE,JointStyle.MITER);
			
			g.moveTo(tX+borderWidth/2,tY+borderWidth/2);
			g.lineTo(tX+_loader.width-borderWidth/2,tY+borderWidth/2);
			g.lineTo(tX+_loader.width-borderWidth/2,tY+_loader.height-borderWidth/2);
			g.lineTo(tX+borderWidth/2,tY+_loader.height-borderWidth/2);
			g.lineTo(tX+borderWidth/2,tY+borderWidth/2);
			*/

		}
	}
}