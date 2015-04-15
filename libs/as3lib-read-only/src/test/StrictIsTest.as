package test
{
	import flash.display.MovieClip;
	import flash.display.Sprite;
	
	import flexunit.framework.TestCase;
	
	import org.as3lib.utils.strictIs;

	public class StrictIsTest extends TestCase
	{
		public function testStrictIs():void {
			var s:Sprite = new Sprite();
			var m:MovieClip = new MovieClip();
			
			assertTrue("Sprite instance is Sprite", s is Sprite);
			assertTrue("MovieClip instance is Sprite", m is Sprite);
			assertFalse("Sprite instance is not MovieClip", s is MovieClip);

			assertTrue("Sprite instance is strictly Sprite", strictIs(s, Sprite));
			assertFalse("MovieClip instance is strictly not a Sprite", strictIs(m, Sprite));
			assertFalse("Sprite instance is strictly not a MovieClip", strictIs(s, MovieClip));
		}
		
	}
}