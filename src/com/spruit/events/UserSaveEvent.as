package com.spruit.events
{
	import flash.events.Event;

	public class UserSaveEvent extends Event
	{
		public var designName:String;
		public var isPrivate:Boolean;
		public var sendDesign:Boolean;
		
		public function UserSaveEvent(type:String, designName:String, isPrivate:Boolean, sendDesign:Boolean)
		{
			//TODO: implement function
			super(type);
			
			this.designName = designName;
			this.isPrivate = isPrivate;
			this.sendDesign = sendDesign;
			
			
		}
		
		public override function clone():Event {
			return new UserSaveEvent( type, designName, isPrivate, sendDesign );
		}
		
	}
}