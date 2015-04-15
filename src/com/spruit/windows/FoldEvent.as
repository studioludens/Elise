package com.spruit.windows
{
	import flash.events.Event;
	
	public class FoldEvent extends Event    {
        
        public static const FOLD:String 	= "fold";
        public static const UNFOLD:String 	= "unfold";
        
        public var foldAction:String;
        
        public function FoldEvent(action:String)
        {
        	
	    	if(action == FOLD)	{
	    		foldAction = FOLD;
	    	}
	    	
	    	if(action == UNFOLD)	{
	    		foldAction = UNFOLD;
	    	}
	    	
	    	super(foldAction, false, false); //bubble by default   
            
        }

        override public function clone():Event{
            return new FoldEvent(foldAction);  //  bubbling support inside
        }          
    }

}