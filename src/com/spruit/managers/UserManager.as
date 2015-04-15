package com.spruit.managers
{
	import flash.utils.IDataInput;
	import mx.core.IContainer;
	import mx.graphics.IFill;
	import mx.core.IFactory;
	import mx.core.IChildList;
	import com.spruit.components.IShapeProvider;
	import com.spruit.data.DataRequest;
	
	/** 
	 * UserManager()
	 * this class implements the singleton design pattern
	 * it manages the user's login information and state
	 * it also communicates with the server to login a user
	 */
	public class UserManager
	{
		private var _userName:String;
		private var _userPassword:String; // encoded MD5
		private var _userId:int;
		
		private var _loggedIn:Boolean;
		private var _dataProvider:IShapeProvider;
		
		public var numUserDesigns:int;
		public var lastSavedDesignId:int;
		
		
		// the only instance of this class
		static private var _instance:UserManager;
		
		// getInstance should be called whenever you want to talk to this global class
		static public function getInstance():UserManager {
			
			if(_instance == null){
				_instance = new UserManager(arguments.callee);
			}
			return _instance;
		}
		
		/* CONSTRUCTOR */
		public function UserManager(caller:Function = null):void {
			if( caller != UserManager.getInstance )
                throw new Error ("Singleton is a singleton class, use getInstance() instead");
			
            if ( UserManager._instance != null )
                throw new Error( "Only one Singleton instance should be instantiated" );	
			
			trace("UserManager: instance constructor called");
			_loggedIn = false;
			_userId = -1;
			
		}
		
		public function reset():void {
			
			_userName = null;
			_userPassword = null;
			_userId = -1;
			
			_loggedIn = false;
			
		}
		
		
		
		// getters and setters
		[Bindable]
		public function get userName():String {
			trace("UserManager: username = " + _userName);
			return _userName;
		}
		
		public function set userName(value:String):void{
			_userName = value;
			trace("UserManager: username set to: " + value);
		}
		
		public function get userPassword():String {
			
			return _userPassword;
		}
		
		public function set userPassword(value:String):void{
			_userPassword = value;
		}
		
		
		public function get userId():int {
			return _userId;
		}
		
		public function set userId(value:int):void{
			_userId = value;
			trace("UserManager: userid set to: " + value);
		}
		
		public function get loggedIn():Boolean {
			return _loggedIn;
		}
		
		public function set loggedIn(value:Boolean):void{
			
			// loggedIn can only be set on true when _userId && _userPassword && _userName are all there
			if(value && !(_userId && _userPassword && _userName)){
				throw new Error("UserManager: cannot login when username, password and userid are not all present");
			}
			_loggedIn = value;
			
			trace("UserManager: loggedIn set to: " + value);
			
			
		}
		
		
		
	}
}