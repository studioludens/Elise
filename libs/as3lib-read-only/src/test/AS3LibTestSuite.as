package test
{
	import flexunit.framework.TestSuite;

	public class AS3LibTestSuite extends TestSuite
	{
		public function AS3LibTestSuite ()
		{
			super();
			
			addTestSuite(StrictIsTest);
			addTestSuite(IsPassedByValueTest);
			addTestSuite(AbstractEnforcerTest);
			addTestSuite(ClonerTest);
			addTestSuite(LimitTest);
			addTestSuite(GetNumberAsHexStringTest);
		}
		
	}
}