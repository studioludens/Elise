package org.as3lib.utils
{
	import org.as3lib.utils.strictIs;
	import org.as3lib.errors.AbstractError;
	
	/**
	 * A utility class for helping to enforce runtime Abstract class and 
	 * method checking. 
	 * 
	 * @author Mims Wright
	 */
	public class AbstractEnforcer
	{
		/**
		 * When called within a constructor, ensures that the constructor
		 * cannot be instantiated unless it is subclassed.
		 *  
		 * @param self A reference to the object whose constructor is being called.
		 * @param abstractClass The class to make abstract. The class of the constructed object.
		 * @throws org.as3lib.errors.AbstractError If self is an instance of abstractClass (and not a subclass).
		 *
		 * @use <code>
		 * package {
		 * 		public class AbstractClass {
		 *	 		// this constructor cannot be called (without throwing an error) unless AbstractClass is subclassed. 
		 * 			public function AbstractClass() {
		 * 				AbstractEnforcer.enforceConstructor(this, AbstractClass);
		 *				// other constructor code here.
		 *			}
		 *		}
		 *  }
		 * </code>
		 */ 
		public static function enforceConstructor(self:Object, abstractClass:Class):void {
			if (strictIs(self, abstractClass)) {
				throw (new AbstractError(AbstractError.CONSTRUCTOR_ERROR));
			}
		}
		
		/**
		 * When called within a method, will throw an error if the method is
		 * called, thus forcing it to be overridden in a subclass to be used.
		 * Note, there can be no default implementation of an abstract method so 
		 * using super.methodName() will still throw the error.
		 * 
		 * @throws org.as3lib.errors.AbstractError If the method is called without being overridden.
		 * 
		 * @use <code>
		 * package {
		 * 		public class AbstractClass {
		 * 			// this method must be overridden.
		 * 			public function abstractMethod() {
		 * 				AbstractEnforcer.enforceMethod();
		 *			}
		 *		}
		 * }
		 * </code>
		 */
		public static function enforceMethod ():void {
			throw (new AbstractError(AbstractError.METHOD_ERROR));
		}
	}
}