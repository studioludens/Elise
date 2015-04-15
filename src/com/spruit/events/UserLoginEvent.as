package com.spruit.events
{
	import flash.events.Event;

	public class UserLoginEvent extends Event
	{
		public var username:String;
		public var password:String;
		
		public function UserLoginEvent(type:String, username:String, password:String)
		{
			//TODO: implement function
			super(type);
			
			this.username = username;
			this.password = password;
			
			
		}
		
		public override function clone():Event {
			return new UserLoginEvent( type, username, password );
		}
		
	}
}