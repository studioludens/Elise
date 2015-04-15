package org.as3lib.math
{
	/**
	 * Global function for returning a number within an upper and lower limit.
	 * 
	 * @param value The number to limit
	 * @param lowLimit The lowest value that will be returned.
	 * @param highLimit The highest value that will be returned.
	 * @return value if lowLimit < value < highLimit, otherwise returns the lowLimit or highLimit.
	 */
	public function limit(value:Number, lowLimit:Number, highLimit:Number):Number {
		return Math.max(lowLimit, Math.min(highLimit, value)); 
	}
}