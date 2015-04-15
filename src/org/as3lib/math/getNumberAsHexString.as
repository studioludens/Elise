package org.as3lib.math
{
	/**
	* Converts a uint into a string in the format “0x123456789ABCDEF”.
	* This function is quite useful for displaying hex colors as text.
	*
	* @author Mims H. Wright (modified by Pimm Hogeling)
	*
	* @use <code>
	* getNumberAsHexString(255); // 0xFF
	* getNumberAsHexString(0xABCDEF); // 0xABCDEF
	* getNumberAsHexString(0x00FFCC); // 0xFFCC
	* getNumberAsHexString(0x00FFCC, 6); // 0x00FFCC
	* getNumberAsHexString(0x00FFCC, 6, false); // 00FFCC
	* </code>
	*
	*
	* @param number The number to convert to hex. Note, numbers larger than 0xFFFFFFFF may produce unexpected results.
	* @param minimumLength The smallest number of hexits to include in the output.
	* 					   Missing places will be filled in with 0’s.
	* 					   e.g. getNumberAsHexString(0xFF33, 6); // results in "0x00FF33"
	* @param showHexDenotation If true, will append "0x" to the front of the string.
	* @return String representation of the number as a string starting with "0x"
	*/
	public function getNumberAsHexString(number:uint, minimumLength:uint = 1, showHexDenotation:Boolean = true):String {
		// The string that will be output at the end of the function.
		var string:String = number.toString(16).toUpperCase();
		
		// While the minimumLength argument is higher than the length of the string, add a leading zero.
		while (minimumLength > string.length) {
			string = "0" + string;
		}
		
		// Return the result with a "0x" in front of the result.
		if (showHexDenotation) { string = "0x" + string; }
		
		return string;
	}
}