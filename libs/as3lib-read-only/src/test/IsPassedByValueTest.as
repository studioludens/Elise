package test
{
	import flexunit.framework.TestCase;
	
	import org.as3lib.utils.isPassedByValue;

	public class IsPassedByValueTest extends TestCase
	{
		public function testIsPassedByValue():void {
			assertTrue("uint is passed by value", isPassedByValue(uint(5)));
			assertTrue("int is passed by value", isPassedByValue(int(5)));
			assertTrue("Number is passed by value", isPassedByValue(5.5));
			assertTrue("String is passed by value", isPassedByValue("foo"));
			assertTrue("Boolean is passed by value", isPassedByValue(true));
			
			assertFalse("null values don't indicate the type of the variable container.", isPassedByValue(null));
			
			var xml:XML = 
				        <body>
				            <p>hello</p>
				        </body>;
			assertFalse("XML is not passed by value even though it's a primitive", isPassedByValue(xml));
		}
		
	}
}