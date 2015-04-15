/**
 * class LToken : datastructure for representing a visual token in an L-System
 * 
 * using an array of LTokens, we can represent a drawing. The interpreter implements
 * these drawing instructions. No information about the state of the L-system is stored
 * in this array, so it can run without the parameters of the L-System it represents
 * 
 * - represents a token in an L-system
 * - used for exporting to SVG
 * 
 * - actions:
 *   M : Move instruction
 *     @params: x:Number, y:Number
 *   L : draw Line instruction
 *     @ params: x:Number, y:Number
 *   A : draw arc instruction
 *     @ params: x:Number, y:Number, r:Number, direction:Boolean, large:Boolean
 *   P : draw Polygon instruction
 *     @ params: start:Boolean, x:Number, y:Number, end:Boolean
 *   S : set line Style instruction
 *    @params: lineColor:Number, lineThickness:Number
 *   
 */
package  com.ludens.LSystemsPro
{
	
	public class LToken
	{
		public var action:String = '';
		public var x:Number;
		public var y:Number;
		
		public var parameters:Object;
		
		public function LToken(action:String = 'M', parameters:Object = null)
		{
			this.action = action;
			this.x = (parameters.x != null ? parameters.x : null);
			this.y = (parameters.y != null ? parameters.y : null);
			
			this.parameters = parameters;
		}

	}
}