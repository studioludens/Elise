/**
 * the LSystem class is a rewrite of one found on the internet.
 * 
 * with lots of extensions to the basic functionality
 * 
 * - timed execution
 * - symbol parameters in the form of S(p1,p2,...,pn)
 * - color codes
 * - line thickness codes
 * - polygons
 * 
 * sorry, no 3D, optimized for 2D
 * 
* @author Default
* @version 0.1
*/

package com.ludens.LSystemsPro  {
	import Singularity.Geom.*;
	
	import flash.display.Graphics;
	import flash.events.Event;
	import flash.events.EventDispatcher;
	import flash.events.TimerEvent;
	import flash.utils.*;
	

	public class LSystem extends EventDispatcher {

		public var angle:Number = Math.PI/2;
		public var rules:Array;
		public var iterations:Number = 3;
		public var startRule:String;
		public var lineCount:Number;
		public var cX:Number;
		public var cY:Number;
		public var cZ:Number;
		public var ratio:Number = 0.99;
		
		public var draw2D:Boolean;
		
		/* variables used in the execution process
		*/
		public var code:String;
		public var pos:int;
		public var curAngle:Number;
		public var curLength:Number;
		
		public var curArcLength:Number;
		public var curArcRadius:Number;
		
		public var marker:ITurtle;  
		public var graphics:Graphics; 
		public var polyGraphics:Graphics;
		
		public static const DEFAULT_LINELENGTH:Number = 1000;
		public static const MAX_SYSTEMLENGTH:int = 250000;
		
		private var _system:String;
		private var maxSystemLength:int;
		private var systemTimer:Timer;
		
		// events
		private var _updateEvent:Event = new Event(Event.CHANGE);
		
		public function LSystem(a:Number, it:Number = 3, sR:String = "F"){
			

			angle = a;
			iterations = it;
			rules = new Array();
			startRule = sR;
			lineCount = 0;
			cX = cY = cZ = 0;
		}
		
		public function resetSystem():void{
			lineCount = 0;
			
		}
		

		public function drawSystem( system:String, 
									length:Number = LSystem.DEFAULT_LINELENGTH,
									lineColor:int = 0xCCCCCC,
									lineThickness:Number = 1,
									delay:int = 0, toString:Boolean = false):Array{
			
			_system = system;
			
			marker = new Turtle();
			marker.lineLength = length;
			marker.lineColor = lineColor;
			marker.lineThickness = lineThickness;
			
			//trace(marker.lineColor);
			
			/* SET initial line style */
			graphics.lineStyle(
									marker.lineThickness, 
									marker.lineColor, 
									1
								);
								
			polyGraphics.lineStyle(
									marker.lineThickness, 
									marker.lineColor, 
									1
								);
			
			/* move marker to initial position */
			graphics.moveTo(marker.x, marker.y);
			
			maxSystemLength = Math.min(LSystem.MAX_SYSTEMLENGTH, _system.length);
			
			if(systemTimer && systemTimer.running) systemTimer.reset();
			
			if(delay > 0){
				//trace("Timer initiated!");
				// set the read head position to the start
				pos = 0;
				
				systemTimer = new Timer(delay, maxSystemLength);
				systemTimer.addEventListener(TimerEvent.TIMER, onTimerSystem);
				systemTimer.start();
				
				
				
				return null;
			}
			/*
				MAIN LOOP
				
				 loops through all the characters (interpreter)
			*/
			
			var tokens:Array = new Array();
			
			
			if(toString) {
				// add an initial SVG instruction to set line color and thickness
				tokens.push(new LToken("S", {lineColor: marker.lineColor, lineThickness: marker.lineThickness}));
			}
			
			for(var i:Number = 0; i < maxSystemLength; i++ ){
				
				//var prevCode:String = (i > 0 ? system.charAt(i-1) : '');
				var nextCode:String = (i < maxSystemLength - 1 ? _system.charAt(i+1) : '');
				
				var code:String = _system.charAt(i);
				
				curLength = marker.lineLength;
				curAngle = angle;
				
				
				curArcLength = angle/ 90;		// set the default to the equivalent of the angle in radians
				curArcRadius = 1; // set the standard curArcRadius to the current line length
				
				
				var args:Array = new Array();
				
				args = parseArguments(_system, i);
				// read the arguments
				var newPos:int = args.pop();
				i = newPos;
				
				if(toString) {
					var t:LToken = parseToken(code, args);
					if(t) tokens.push(t);
				} else {
					parseToken(code, args);
				}

				
			}
			if(toString) return tokens;
			else return null;
			
			
		}
		
		private function onTimerSystem(e:TimerEvent):void{
			
			// don't delay on anything other than a drawing instruction
			while(code != 'F' && code != 'G' && code != '~' && code != '`' && pos < maxSystemLength){
				
				var nextCode:String = (pos < maxSystemLength-1 ? _system.charAt(pos+1) : '');
				var code:String = _system.charAt(pos);
				
				curLength = marker.lineLength;
				curAngle = angle;
				
				curArcLength = angle/ 90;		// set the default to the equivalent of the angle in radians
				curArcRadius = 1; // set the standard curArcRadius to the current line length
				
				
				var args:Array = new Array();
				
				args = parseArguments(_system, pos);
				// read the arguments
				var newPos:int = args.pop();
				
				pos = newPos;
				
				//trace("[onTimerSystem]  called! pos = " + pos);
				
				parseToken(code, args);
				
				pos++;
			
			}
			
			if(pos >= maxSystemLength){
				// stop that timer
				//trace("[onTimerSystem] stopTimer = " + pos);
				systemTimer.removeEventListener(TimerEvent.TIMER, this.onTimerSystem);
				systemTimer.stop();
				
				// reset position
				pos = 0;
			}
			
			// dispatch the event
			dispatchEvent(_updateEvent);
			
			
		}
		
		public function parseToken(code:String, args:Array):LToken{
			
			// now look at the individual cases
				
			//trace("[LSystem] code=" + code);
			// move forward
			if(code == 'F' || code == 'G'){
				
				if(args.length == 1){
					marker.moveForward( curLength * Number(args.pop()) );
				} else {
					marker.moveForward(curLength);
				}
				
				graphics.lineTo(marker.x, marker.y);
				
				lineCount++;
				
				return new LToken("L", { x: marker.x, y:marker.y});
			}
			
			// move backward
			if(code == 'B'){
				
				if(args.length == 1){
					marker.moveBackward( curLength * Number(args.pop()) );
				} else {
					marker.moveBackward(curLength);
				}
				
				graphics.lineTo(marker.x, marker.y);
				
				lineCount++;
				
				return new LToken("L", { x: marker.x, y:marker.y});
			}
			
			// move forward without drawing
			if(code == 'f' || code == 'g'){
				
				if(args.length == 1){
					marker.moveForward( curLength * Number(args.pop()) );
				} else {
					marker.moveForward(curLength);
				}
				
				graphics.moveTo(marker.x, marker.y);
				
				return new LToken("M", { x: marker.x, y:marker.y});
			}
			
			// rotate right
			if(code == '+'){
				if(args.length == 1){
					marker.rotateLeft( Number(args.pop()) );
				} else {
					marker.rotateLeft(curAngle);
				}
				
				
				return null;
			}
			
			// rotate left
			if(code == '-'){
				if(args.length == 1){
					marker.rotateRight( Number(args.pop()) );
				} else {
					marker.rotateRight(curAngle);
				}
				
				return null;
			}
			
			// reset the rotation of the marker
			if(code == '$'){
				marker.resetRotation();
				return null;
			}
			
			// shrink
			if(code == '!'){
				
				if(args.length == 1){
					marker.lineLength *= Number(args.pop());
				} else {
					marker.lineLength *= ratio;
				}
				
				marker.lineLength *= ratio;
				
				return null;
			}
			
			// enlarge
			if(code == '@'){
				
				if(args.length == 1){
					marker.lineLength /= Number(args.pop());
				} else {
					marker.lineLength /= ratio;
				}
				
				marker.lineLength /= ratio;
				
				return null;
			}
			
			// push coordinate system
			if(code == '['){
				marker.pushState();
				
				return null;
			}
			
			// pop coordinate system
			if(code == ']'){
				marker.popState();
				graphics.moveTo(marker.x, marker.y);
				
				return new LToken("M", { x: marker.x, y:marker.y});
			}
			
			// adjust brightness of line --> UP
			if(code == 'V'){
				
				if(args.length == 1){
					marker.lineColorHSV.bri = args.pop();
				} else {
					marker.brightnessUp();
				}
				
				graphics.lineStyle(marker.lineThickness, marker.lineColor, 1 );
				polyGraphics.lineStyle(marker.lineThickness, marker.lineColor, 1 );
				
				return new LToken("S", {lineThickness: marker.lineThickness, lineColor: marker.lineColor});
			}
			
			// adjust brightness of line --> DOWN
			if(code == 'v'){
				marker.brightnessDown();
				graphics.lineStyle(marker.lineThickness, marker.lineColor, 1 );
				polyGraphics.lineStyle(marker.lineThickness, marker.lineColor, 1 );
				
				return new LToken("S", {lineThickness: marker.lineThickness, lineColor: marker.lineColor});

			}
			
			// adjust hue of line --> UP
			if(code == 'C'){
				
				if(args.length == 1){
					marker.lineColorHSV.hue = args.pop();
				} else if(args.length == 3){
					marker.lineColorHSV.bri = args.pop();
					marker.lineColorHSV.sat = args.pop();
					marker.lineColorHSV.hue = args.pop();
					
				} else {
					marker.hueUp();
				}
				
				graphics.lineStyle(marker.lineThickness, marker.lineColor, 1 );
				polyGraphics.lineStyle(marker.lineThickness, marker.lineColor, 1 );
				
				return new LToken("S", {lineThickness: marker.lineThickness, lineColor: marker.lineColor});
			}
			
			// adjust hue of line --> DOWN
			if(code == 'c'){
				marker.hueDown();
				graphics.lineStyle(marker.lineThickness, marker.lineColor, 1 );
				polyGraphics.lineStyle(marker.lineThickness, marker.lineColor, 1 );
				
				return new LToken("S", {lineThickness: marker.lineThickness, lineColor: marker.lineColor});
			}

			// adjust saturation of line --> UP
			if(code == 'S'){
				
				if(args.length == 1){
					marker.lineColorHSV.sat = args.pop();
				} else {
					marker.saturationUp();
				}
				
				
				graphics.lineStyle(marker.lineThickness, marker.lineColor, 1 );
				polyGraphics.lineStyle(marker.lineThickness, marker.lineColor, 1 );
				
				return new LToken("S", {lineThickness: marker.lineThickness, lineColor: marker.lineColor});
			}
			
			// adjust saturation of line --> DOWN
			if(code == 's'){
				marker.saturationDown();
				graphics.lineStyle(marker.lineThickness, marker.lineColor, 1 );
				polyGraphics.lineStyle(marker.lineThickness, marker.lineColor, 1 );
				
				return new LToken("S", {lineThickness: marker.lineThickness, lineColor: marker.lineColor});
			}
			
			// start drawing polygon
			if(code == '{'){
				
				//trace("[LSystem] start polyLine");
				polyGraphics.moveTo(marker.x, marker.y);
				
				polyGraphics.beginFill(marker.lineColor,.4);
				
				
				return new LToken("P", {start: true, x: marker.x, y:marker.y});
				
			}
			
			// end drawing polygon
			if(code == '}'){
				//trace("[LSystem] stop polyLine");
				polyGraphics.endFill();
				
				return new LToken("P", {end: true});
			}
			
			// draw polygon point
			if(code == '.'){
				//trace("[LSystem] draw polyPoint at (" + marker.x + "," + marker.y + ")");
				polyGraphics.lineTo(marker.x, marker.y);
				
				return new LToken("P", {x: marker.x, y:marker.y});
			}
			
			// change line thickness
			if(code == '\\'){
				if(marker.lineThickness < .01) 	marker.lineThickness = 0;
				else							marker.lineThickness /= 1.2;
				
				graphics.lineStyle(marker.lineThickness, marker.lineColor, 1 );
				
				return new LToken("S", {lineThickness: marker.lineThickness, lineColor: marker.lineColor});
			}
			
			if(code == '/'){
				if(marker.lineThickness < .01) 	marker.lineThickness = 0.01;
				else							marker.lineThickness *= 1.2;
				
				graphics.lineStyle(marker.lineThickness, marker.lineColor, 1 );
				
				return new LToken("S", {lineThickness: marker.lineThickness, lineColor: marker.lineColor});
			}
			
			/**
			 * EXTENSION
			 * 
			 * draw an arc with the ~
			 * optional 2 arguments: ( radius, length )
			 *   length in radians
			 */
			if(code == '~'){
				//trace("doing angled stuff: args.length = " + args.length);
				if(args.length == 2){
					curArcRadius = Number(args.pop());
					curArcLength = Number(args.pop());			
					
				} else if(args.length == 1){
					curArcLength = Number(args.pop());
				}
				
				curArcRadius *= curLength;
				
				var startAngle:Number = (marker.angle-180) * Turtle.toRADIANS;
				var endAngle:Number = startAngle + curArcLength * Math.PI * 0.5;
				
				var yMiddle:Number = marker.y + curArcRadius * Math.sin(marker.angle * Turtle.toRADIANS);
				var xMiddle:Number = marker.x + curArcRadius * Math.cos(marker.angle * Turtle.toRADIANS);
				
				var arc:Arc = new Arc(curArcRadius, xMiddle, yMiddle, startAngle, endAngle);
				arc.draw(graphics, marker.lineThickness, marker.lineColor);
				
				// move the turtle to the new position and set the current angle
				
				var diffAngle:Number = endAngle - startAngle;
				var newAngle:Number = diffAngle + (marker.angle * Turtle.toRADIANS);
				
				var endX:Number = xMiddle - curArcRadius * Math.cos(newAngle);
				var endY:Number = yMiddle - curArcRadius * Math.sin(newAngle);
				
				marker.x = endX;
				marker.y = endY;
				// set the new line to the right rotation
				marker.rotateRight(curArcLength * 90);
				
				lineCount++;
				
				return new LToken("A", {x: marker.x,
										y: marker.y,
										r: curArcRadius,
										direction: false,
										large: ((endAngle - startAngle) > 0 ? true : false)
										});
				
			}
			
			// arc left
			if(code == '`'){
				
				if(args.length == 2){
					curArcRadius = Number(args.pop());
					curArcLength = Number(args.pop());			
					
				} else if(args.length == 1){
					curArcLength = Number(args.pop());
				}
				
				curArcRadius *= curLength;
				//trace("[drawSystem] '~' setting arguments (angle = " + marker.angle);	
				
				var startAngle:Number = (marker.angle) * Turtle.toRADIANS - curArcLength * Math.PI * 0.5;
				var endAngle:Number = (marker.angle) * Turtle.toRADIANS;
				
				var yMiddle:Number = marker.y - curArcRadius * Math.sin(marker.angle * Turtle.toRADIANS);
				var xMiddle:Number = marker.x - curArcRadius * Math.cos(marker.angle * Turtle.toRADIANS);
				//graphics.drawCircle(xMiddle, yMiddle, 10);
				
				//graphics.moveTo(xMiddle, yMiddle);
				//trace("moving x = " + (marker.x - xMiddle));
				var arc:Arc = new Arc(curArcRadius, xMiddle, yMiddle, endAngle, startAngle);
				arc.draw(graphics, marker.lineThickness, marker.lineColor);
				
				// move the turtle to the new position and set the corrent angle
				
				var diffAngle:Number = endAngle - startAngle;
				var newAngle:Number = diffAngle - (marker.angle * Turtle.toRADIANS);
				
				//trace("diffAngle = " + diffAngle);
				var endX:Number = xMiddle + curArcRadius * Math.cos(newAngle);
				var endY:Number = yMiddle - curArcRadius * Math.sin(newAngle);
				
				//graphics.drawCircle(endX, endY, 20);
				
				//graphics.moveTo(endX, endY);
				marker.x = endX;
				marker.y = endY;
				// set the new line to the right rotation
				marker.rotateLeft(curArcLength * 90);
				
				lineCount++;
				
				return new LToken("A", {x: marker.x,
										y: marker.y,
										r: curArcRadius,
										direction: false,
										large: ((endAngle - startAngle) < 0 ? true : false)
										});
			}
			
			return null;

		}
		
		public function getCommand():String{
			
			var i:int, j:int, len:int;
			var isRule:Boolean;
			var isArgument:Boolean;
			
			var ret:String;
			
			var temp_rule:String;
			var cRule:Rule;
			
			var cr:int = 0; // current rule position
			
			// initialise the timer
			var time:int = getTimer();
			
			// we start the return with the startRule. from here we expand
			ret = startRule;
			
			// first iteration, main loop where we iterate the whole shape
			for(i = 0; i < iterations; i++){
				temp_rule = "";
				len = ret.length;
				
				// at the start of parsing one string one time (iteration), we assume
				// we're not in an argument
				isArgument = false;
				
				for(j = 0; j < len; j++){
					
					isRule = false;
					
					cr = 0;
					cRule = rules[cr];
					// loop through all the rules, see if one matches
					while(cRule && !isRule && !isArgument){
						
						if(ret.charAt(j) == cRule.axiom){
							
							temp_rule += cRule.rule;
							isRule = true;
							
						}
						cRule = rules[cr++];
					}
					if(!isRule){
						
						// don't bother parsing rules if we are in an argument. this prevents weird stuff
						// happening with argument descriptions
						if(ret.charAt(j) == '(') isArgument = true;
						if(isArgument && ret.charAt(j) == ')') isArgument = false;
						
						// and otherwise, just add the character to the output.
						temp_rule += ret.charAt(j);
						
					}
					
				}
				ret = temp_rule;
			}
			
			var timeTaken:int = getTimer() - time;
			//trace("[getCommand] time (ms)= " + timeTaken);
			
			return ret;

		}
		
		/*
			This function returns an array of arguments, parsed from the system string starting at location curPos
			
			
		*/
		private function parseArguments( system:String, curPos:int):Array{
			
			var args:Array = new Array();
			// get the next code
			var nextCode:String = system.charAt(curPos+1);
			var code:String = system.charAt(curPos);
			
			// see if it matches an opening parenthesis
			if(nextCode == '('){
				var argument:Number = 0;
				
				// curcode is the first character in the argument string
				var curCode:String = system.charAt(curPos+2);
				var j:int = curPos + 2;
				var arg_string:String = '';
				// process argument instruction
				while(curCode != ')'){
					
					curCode = system.charAt(j);
					if(curCode != ')') arg_string += curCode;
					if(curCode == ','){
						// we push the argument on the stack and start the next one
						
						// remember to remove the ',' from the end of the string
						var strArgument:String = arg_string.slice(0,arg_string.length-1);
						//trace("argument=" + strArgument + " num=" + arguments.length);
						args.push(strArgument);
						// reset the current working string
						arg_string = '';
					}
					j++;
				}
				
				args.push(arg_string);
				
				/*if(code == '+' || code == '-'){
					// change angle
					
					curAngle = Number(args.pop());
				} *//*else if( code != '~') {
					curLength = curLength * Number(args.pop());
				}*/
				// adjust the reading head position to the token after the ')'	
				args.push(j-1);		
			} else {
				args.push(curPos);	
			}
				
			return args;
	
		}
		
		
		
	}
}

