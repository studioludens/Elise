package com.ludens.elise.util
{
	public class LSystemStringUtil
	{
		public function LSystemStringUtil()
		{
		}
		
		/**
		 * checkString():
		 * 
		 * checks if the string given to the system has the right number of parenthesis
		 * - returns false if not all matching parenthesis
		 * - returns true if valid
		 **/
		public static function stringValid(value:String):Boolean{
			
			var _leftBrace:int = 0;
			var _rightBrace:int = 0;
			
			var _leftParen:int = 0;
			var _rightParen:int = 0;
			
			for(var i:int=0;i<value.length;i++){
				if(value.charAt(i) == '[') _leftBrace++;
				if(value.charAt(i) == ']') _rightBrace++;
				
				if(value.charAt(i) == '(') _leftParen++;
				if(value.charAt(i) == ')') _rightParen++;
			}
			
			return (_leftBrace == _rightBrace && _leftParen == _rightParen);
			
		}
	}
}