package org.as3lib.color
{
	
	import flash.events.Event;
	import flash.events.EventDispatcher;
	
	import org.as3lib.math.getNumberAsHexString;
	import org.as3lib.math.limit;
	
	/**
	 * A color, based on a 32-bit hex color, that can be manipulated, split into channels, 
	 * and converted into several convenient formats. 
	 * 
	 * This class makes extensive use of bitwise operations. For information on how these work, check out the 
	 * following resources.
	 * <ul>
	 * <li><a href="http://lab.polygonal.de/2007/05/10/bitwise-gems-fast-integer-math/">Bitwise Gems (Polygonal Labs)</a></li>
	 * <li><a href="http://www.gamedev.net/reference/articles/article1563.asp">Bitwise Operations in C</a></li>
	 * <li><a href="http://en.wikipedia.org/wiki/Bitwise_operation">Wikipedia</a></li>
	 * </ul>
	 * 
	 * Most of the formulae for converting to and from HSV and HSL color spaces was found in this article.
	 * <a href="http://en.wikipedia.org/wiki/HSL_and_HSV">Wikipedia - HSL and HSV</a>
	 * 
	 * @author Mims H. Wright
	 */
	public class Color extends EventDispatcher
	{
		[Event(name="colorChanged", type="flash.events.Event")]
		public static const COLOR_CHANGED:String = "colorChanged";
		
		// Masks and offsets are used for bitwise operations on the color channels.
		public static const ALPHA_MASK:uint = 0xFF000000; 
		public static const ALPHA_OFFSET:uint = 24;
		public static const RED_MASK:uint = 0x00FF0000; 
		public static const RED_OFFSET:uint = 16;
		public static const GREEN_MASK:uint = 0x0000FF00; 
		public static const GREEN_OFFSET:uint = 8;
		public static const BLUE_MASK:uint = 0x000000FF; 
		public static const BLUE_OFFSET:uint = 0;
		
		/** Used to mask out the alpha channel */
		protected static const RGB24_MASK:uint = 0x00FFFFFF;
		/** Maximum value allowed for a 32-bit color */
		protected static const MAX_COLOR_VALUE:uint = 0xFFFFFFFF;
		/** Maximum value allowed for a 24-bit color */
		protected static const MAX_COLOR_VALUE_24:uint = 0xFFFFFF;
		/** Maximum value allowed for a single channel */ 
		protected static const MAX_CHANNEL_VALUE:uint = 0xFF;
		/** The step size betwen web color channels */
		protected static const WEB_COLOR_STEP_SIZE:uint = 0x33;
		
		
		/** 
		 * This is the hex value for the Color object in the standard form, 0xaarrggbb. 
		 * It is the only true record of the color represented by a Color object. 
		 * All other getters and setters ultimately manipulate this value.
		 */
		protected var _hex:uint = 0x00000000;
		
		
		[Bindable("colorChanged")]
		public function get hex ():uint { return _hex; }
		public function set hex (rgba:uint):void { 
			rgba = limit(rgba, 0, MAX_COLOR_VALUE);
			_hex = rgba; 
			dispatchEvent(new Event(COLOR_CHANGED));
		}
		
		[Bindable]
		/** alias for hex */
		public function get hex32():uint { return hex; }
		public function set hex32(rgba:uint):void { hex = rgba; }
		
		[Bindable]
		public function get hex24():uint { return _hex & RGB24_MASK; }
		public function set hex24(rgb:uint):void {
			rgb = limit(rgb, 0, MAX_COLOR_VALUE_24);
			// add the previous alpha channel back to the RGB value.
			rgb |= (alpha << ALPHA_OFFSET);
			this.hex = rgb;
		}
		
		// Individual channel getters and setters
		[Bindable]
		/** The hex value for the alpha channel. */
		public function get alpha():uint { 						return (hex & ALPHA_MASK) >>> ALPHA_OFFSET; }
		public function set alpha(alpha:uint):void {			setChannel(alpha, ALPHA_OFFSET, ALPHA_MASK); }
		[Bindable]
		/** The percentage value for the alpha channel. */
		public function get alphaPercent():Number { 			return alpha / MAX_CHANNEL_VALUE }
		public function set alphaPercent(alpha:Number):void { 	setChannel(int(alpha * MAX_CHANNEL_VALUE), ALPHA_OFFSET, ALPHA_MASK); }
		
		[Bindable]
		/** The hex value for the red channel. */
		public function get red():uint {						return (hex & RED_MASK) >>> RED_OFFSET; } 
		public function set red(red:uint):void { 				setChannel(red, RED_OFFSET, RED_MASK); }
		[Bindable]
		/** The percentage value for the red channel. */
		public function get redPercent():Number { 				return red / MAX_CHANNEL_VALUE }
		public function set redPercent(red:Number):void { 		setChannel(int(red * MAX_CHANNEL_VALUE), RED_OFFSET, RED_MASK); }
		
		[Bindable]
		/** The hex value for the green channel. */
		public function get green():uint {		 				return (hex & GREEN_MASK) >>> GREEN_OFFSET; }
		public function set green(green:uint):void {		 	setChannel(green, GREEN_OFFSET, GREEN_MASK); }
		[Bindable]
		/** The percentage value for the green channel. */
		public function get greenPercent():Number { 			return green / MAX_CHANNEL_VALUE }
		public function set greenPercent(green:Number):void { 	setChannel(int(green * MAX_CHANNEL_VALUE), GREEN_OFFSET, GREEN_MASK); }
		
		[Bindable]
		/** The hex value for the blue channel. */
		public function get blue():uint { 						return (hex & BLUE_MASK) >>> BLUE_OFFSET; }
		public function set blue(blue:uint):void { 				setChannel(blue, BLUE_OFFSET, BLUE_MASK); }
		[Bindable]
		/** The percentage value for the blue channel. */
		public function get bluePercent():Number { 				return blue / MAX_CHANNEL_VALUE }
		public function set bluePercent(blue:Number):void { 	setChannel(int(blue * MAX_CHANNEL_VALUE), BLUE_OFFSET, BLUE_MASK); }
		
		
		//[Bindable]
		public function get black():Number { return Math.min(1 - redPercent, 1 - greenPercent, 1 - bluePercent); } 
		//[Bindable]
		public function get cyan():Number { return (1 - redPercent - black) / (1 - black); }
		//[Bindable]
		public function get magenta():Number { return (1 - greenPercent - black) / (1 - black); }
		//[Bindable]
		public function get yellow():Number { return (1 - bluePercent - black) / (1 - black); }
		
		
		/**
		 * Indicates the color space that HS_ operations will use by default.
		 * If true, HSV (hue, saturation, value) will be used.
		 * If false, HSL (hue, saturation, lightness) will be used. 
		 */
		public var useHSV:Boolean = true;
					
		/**
		 * returns the hue (in HSV or HSL space) of the color as a value in degrees from 0-360
		 */
		public function get hue():Number {
			
			// nested function to calculate the hue based on the lightest color.
			function calculateHue (colorA:uint, colorB:uint, offset:uint):Number {
				return (60 * (colorA - colorB) / (lightestChannelValue - darkestChannelValue) + offset) % 360;
			}
	
			if (this.isGrey()) {
				return 0; // grey colors don't really have a hue.
			} else if (lightestChannelValue == red) {
				return calculateHue (green, blue, 0);
			} else if (lightestChannelValue == green) {
				return calculateHue (blue, red, 120);
			} else if (lightestChannelValue == blue) {
				return calculateHue (red, green, 240);
			} else {
				throw new Error("Somehow the brightest channel isn't one of the channels"); 
			}
		}
		
		public function set hue(hue:Number):void { 
			hue = limit(hue, 0, 360);
			if (useHSV) {setHSV(hue, saturation, value);} 
			else { setHSL(hue, saturation, lightness); }
		}
		
		/** Returns the hue as a percentage instead of as a degree */
		public function get huePercent():Number { return hue/360; }
		
		
		public function get saturation ():Number {
			if (useHSV) {
				// HSV space
				return uint(lightestChannelValue - darkestChannelValue) / lightestChannelValue;
			} else {
				if (isGrey()) { return 0; }
			
				var diff:uint = lightestChannelValue - darkestChannelValue;
				var sum:uint = lightestChannelValue + darkestChannelValue;
				
				if (lightness <= 0.5) {
					return diff / sum;
				}
				// if lightness >= 0.5
				return diff / (2 - sum);
			}
		}
		public function set saturation(saturation:Number):void {
			saturation = limit(saturation, 0, 1);
			if (useHSV) { setHSV(hue, saturation, value); }
			else { setHSL(hue, saturation, lightness); }
		}
		
		public function get value ():uint {
			return lightestChannelValue;
		}
		public function set value(value:uint):void {
			limit(value, 0, MAX_CHANNEL_VALUE);
			setHSV(hue, saturation, value);
		}
		
		public function get lightness():Number {
			return 0.5 * (lightestChannelValue + darkestChannelValue);
		}
		public function set lightness(lightness:Number):void {
			limit(lightness, 0, 1);
			setHSL(hue, saturation, lightness);
		}
		
		/**
		 * Sets the color by providing three values - one for each channel.
		 */
		public function setRGB(red:uint, green:uint, blue:uint):void {
			this.red = red;
			this.green = green;
			this.blue = blue;
		}
		
		
		/** 
		 * Sets the hue, saturation, and lightness of the color.
		 * 
		 * @param hue The hue in degrees (0~360)
		 * @param saturation The saturation in percent (0~1)
		 * @param the lightness in percent (0~1) 
		 */
		public function setHSL(hue:Number, saturation:Number, lightness:Number):void {
			
			// If saturation is 0, that means the color is grey so just use the lightness value for all channels. 
			if (saturation == 0) { 
				red = green = blue = lightness;
				return;
			}
			
			// limit parameters to appropriate range.
			hue 		= limit(hue, 0, 360);
			saturation 	= limit(saturation, 0, 1);
			lightness 	= limit(lightness, 0, 1);
			
			// begin crazy algorithms!!! zOMG!!1
			var q:Number, p:Number, rHue:Number, gHue:Number, bHue:Number;
			if (lightness < 0.5) { 
				q = lightness * (1 + saturation); 
			} else { 
				q = lightness + saturation - (lightness * saturation); 
			}
			
			p = 2 * lightness - q;
			rHue = huePercent + 1/3;
			gHue = huePercent;
			bHue = huePercent - 1/3;
			
			if (huePercent < 1/3) { bHue += 1.0; }
			if (huePercent > 1/3) { rHue -= 1.0; }
			
			red = calculateResultForChannel(rHue);
			green = calculateResultForChannel(gHue);
			blue = calculateResultForChannel(bHue);
			
			// nested function to figure out results for each channel based on channel hue.
			function calculateResultForChannel(channelHue:Number):Number {
				if (channelHue < 1/6) { 
					return p + ((q - p) * 6 * channelHue);
				} else if (channelHue < 1/2) {
					return q;
				} else if (channelHue < 2/3) {
					return p + ((q - p) * 6 * (2/3 - channelHue));
				} else {
					return p;
				}
			}
		} 
		
		/** 
		 * Sets the hue, saturation, and value of the color.
		 * 
		 * @param hue The hue in degrees (0~360)
		 * @param saturation The saturation in percent (0~1)
		 * @param the value in percent (0~255) 
		 */
		public function setHSV(hue:Number, saturation:Number, value:uint):void {
			limit(hue, 0, 360);
			limit(saturation, 0, 1);
			limit(value, 0, 255);
			
			var hueRange:Number, i:int, f:Number, p:Number, q:Number, t:Number, v:Number;
			
			// Begin Crazy algorithms
			hueRange = hue / 60;
			i = Math.floor(hueRange) % 6;
			f = hueRange - Math.floor(hueRange);
			p = value * (1 - saturation);
			q = value * (1 - f * saturation);
			t = value * (1 - (1 - f) * saturation);
			v = value;
			
			switch (i) {
				case 0: setRGB(v,t,p); break;
				case 1: setRGB(q,v,p); break;
				case 2: setRGB(p,v,t); break;
				case 3: setRGB(p,q,v); break;
				case 4: setRGB(t,p,v); break;
				case 5: setRGB(v,p,q); break;
				default: throw new Error("Invalid hue while converting HSV to RGB");
			}
		}
		
		
		/**
		 * Returns the <em>value</em> of the lightest color channel (excluding alpha).
		 * Used internally for hsv and hsl operations. 
		 */
		protected function get lightestChannelValue():uint {	return Math.max(red, Math.max(green, blue)); }
		
		/**
		 * Returns the <em>value</em> of the darkest color channel (excluding alpha).
		 * Used internally for hsv and hsl operations. 
		 */
		protected function get darkestChannelValue():uint {		return Math.min(red, Math.min(green, blue)); }
		
		/** Returns true if the color is a shade of grey (including white and black) */
		public function isGrey():Boolean { return lightestChannelValue == darkestChannelValue; }
		
		/** 
		 * Constructor 
		 * 
		 * @param value An initial value for the color. Default is black with full alpha.
		 */
		public function Color(value:uint = 0xFF000000) {
			_hex = value;
		}
		
		
		/**
		 * Sets the value of a color channel. 
		 * Used by the individual color channel getters and setters.
		 * 
		 * @param value The new value to set the channel - between 0 and 0xFF
		 * @param offset The number of places to binary shift the channel value. e.g. 8 for green.
		 * @param mask The binary mask for the channel
		 */
		private function setChannel(value:int, offset:uint, mask:uint):void {
			// limit the value between 0 and 0xFF
			value = limit(value, 0, MAX_CHANNEL_VALUE);
			// shift the value to the appropriate channel
			value <<= offset;
			// clear the channel
			this.hex &= ~mask;
			// set the channel to the new value
			this.hex |= value;	
		}
		
		/** 
		 * Produces the opposite color of the current value of the color object.
		 * e.g. yellow becomes blue, black becomes white 
		 */
		public function invert():void {
			red = MAX_CHANNEL_VALUE - red;
			green = MAX_CHANNEL_VALUE - green;
			blue = MAX_CHANNEL_VALUE - blue;
		}
		
		/**
		 * Returns the rgb value for the web color that is closest to the color.
		 * 
		 * @returns uint The value for the nearest web color.
		 */ 
		public function getNearestWebColor():uint {
			var r:uint, g:uint, b:uint;
			r = Math.round(red / WEB_COLOR_STEP_SIZE) * WEB_COLOR_STEP_SIZE;
			g = Math.round(green / WEB_COLOR_STEP_SIZE) * WEB_COLOR_STEP_SIZE;
			b = Math.round(blue / WEB_COLOR_STEP_SIZE) * WEB_COLOR_STEP_SIZE;
			return (r << RED_OFFSET | g << GREEN_OFFSET | b << BLUE_OFFSET);
		}
		
		
		// conversion methods
		
		/** Return a string value of the color */
		override public function toString():String { return getNumberAsHexString(_hex, 8); }
		
		/** Return an array of the 4 channels */
		public function toArray():Array { return [red, green, blue, alpha]; }
	}
}