package test
{
	import flexunit.framework.TestCase;
	
	import org.as3lib.utils.Cloner;

	public class ClonerTest extends TestCase
	{
		public function testClone():void {
			var source:Cloneable = new Cloneable();
			source.string = "foo";
			source.object = {bar:"baz"};
			var clone:Cloneable = Cloner.clone(source) as Cloneable;
			
			assertTrue("Cloner can copy simple objects like ints.", int(Cloner.clone(5)) == 5);
			assertEquals("Cloner can copy more complex objects like arrays.", (Cloner.clone([0,10,20,30]) as Array)[2], 20);
			assertNotNull("Cloned object is not null", clone);
			assertTrue("Cloned object has the same values as source.", clone.string == "foo" && clone.object.bar == "baz");
			assertFalse("Cloned object is not the exact same object as the source.", clone === source);
			assertTrue("Cloned object retains its data type.", clone is Cloneable);
			
			var nonCloneable:NonCloneable;
			try { 
				nonCloneable = Cloner.clone(new NonCloneable(0)) as NonCloneable;
			} catch (e:Error) {
				assertNull("Cloned object cannot work on data types with required parameters in the constructor", nonCloneable )
			}
		}
		
	}
}

class Cloneable extends Object
{
	public var string:String;
	public var object:Object;
	
	public function Cloneable() {
		this.string = string;
		this.object = object;
	}
}

class NonCloneable extends Object {
	public function NonCloneable(requiredParameter:int) {}
}
