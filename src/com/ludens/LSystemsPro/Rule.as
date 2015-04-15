/**
* ...
* @author Default
* @version 0.1
*/

package   com.ludens.LSystemsPro {

	public class Rule {
		public var axiom:String = "F";
		public var rule:String = "";
		public var type:int = Rule.TYPE_SIMPLERULE;
		
		public var _simpleRule:Boolean = true;
		
		public static var TYPE_SIMPLERULE:int = 0;
		public static var TYPE_DEFINITION:int = 1;
		public static var TYPE_STOCHASTIC:int = 2;
		
		public function Rule(ax:String = null, ru:String = null){
			axiom = ax;
			rule = ru;
		}
		
		public static function createRule(str:String):Rule{
			
			var r:Rule = new Rule();
			str = str.replace(" ", "");
			r.axiom = str.substring(0, 1);
			/*
			var type_def:String = str.substring(1,1);
			
			if(type_def == '='){
				r.type = Rule.TYPE_DEFINITION;
			} else {
				r.type = Rule.TYPE_SIMPLERULE;
			}
			*/
			//r.action = str.substr(1,1);
			
			r.rule = str.substring(2, str.length);
			return r;
			
		}
		
		
		
	}
	
}
