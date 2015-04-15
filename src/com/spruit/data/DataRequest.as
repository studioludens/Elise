package com.spruit.data
{
	import flash.utils.ByteArray;
	
	public class DataRequest
	{
		public static const LOGIN:String = "login";
		public static const REGISTER:String = "register";
		public static const SAVE:String = "save";
		
		public static const SHAPETYPE_COASTER:String = "coaster";
		public static const SHAPETYPE_KEYSHAPE:String = "keyshape";
		
		public var data:Object;
		public var type:String;
		
		public function DataRequest(type:String, data:Object){
			this.type = type;
			this.data = data;
			
		}
		
		// make a deep object copy of data, just to avoid later contamination
		public function getData():Object {
			return this.cloneObject(data);
		}
		
		public function cloneObject(o:Object):Object{
	       var bytes:ByteArray = new ByteArray();
	       bytes.writeObject(o);
	       bytes.position = 0;
	       return bytes.readObject();
    	}
		
	}
}