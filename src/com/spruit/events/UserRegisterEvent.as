package com.spruit.events
{
	import flash.events.Event;

	public class UserRegisterEvent extends Event
	{
		public var username:String;
		public var password:String;
		public var email:String;
		public var sendUpdates:Boolean;
		
		public function UserRegisterEvent(type:String, username:String, password:String, email:String, sendUpdates:Boolean)
		{
			//TODO: implement function
			super(type);
			
			this.username = username;
			this.password = password;
			this.email = email;
			this.sendUpdates = sendUpdates;
			
			
		}
		
		public override function clone():Event {
			return new UserRegisterEvent( type, username, password , email, sendUpdates);
		}
		
	}
}