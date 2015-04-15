package test
{
	import flexunit.framework.TestCase;
	
	import org.as3lib.math.getNumberAsHexString;

	public class GetNumberAsHexStringTest extends TestCase
	{
		public function testGetNumberAsHexString ():void {
			assertEquals("Converting from digital number to hex produces hex string", getNumberAsHexString(255) , "0xFF");
			assertEquals("Converting from hex number to hex produces hex string", getNumberAsHexString(0xABCDEF), "0xABCDEF");
			assertEquals("Specifying the number of leading zeros will produce zeroes in the result.", getNumberAsHexString(0x00FFCC, 6), "0x00FFCC");
			assertEquals("Passing false for showHexDenotation omits the 0x from the result.", getNumberAsHexString(0x00FFCC, 6, false), "00FFCC");
		}
	}
}