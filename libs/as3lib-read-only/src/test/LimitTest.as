package test
{
	import flexunit.framework.TestCase;
	
	import org.as3lib.math.limit;

	public class LimitTest extends TestCase
	{
		public function testLimit():void {
			var low:int = 0;
			var high:int = 100;
			
			assertEquals("Values between low and high are passed thru.", limit(50, low, high), 50);
			assertEquals("Values lower than low value are limited to the low value.", limit(low - 100, low, high), low);
			assertEquals("Values higher than the high value are limited to the high value.", limit(high + 100, low, high), high);
			assertEquals("If any values are NaN, return NaN.", limit(5, NaN, high), NaN);
		}
	}
}