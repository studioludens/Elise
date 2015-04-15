package com.ludens.utilities
{
	public class ColorUtilExtra
	{
		public static function getRBGfromHSV(H:Number, S:Number, V:Number):uint
		{
		  // Adapted from: http://easyrgb.com/math.php?MATH=M21#text21
		  var R:uint, G:uint, B:uint;
		  var var_h:Number;
		  var var_i:int;
		  var var_1:Number, var_2:Number, var_3:Number;
		  var var_r:Number, var_g:Number, var_b:Number;
		 
		  if (S == 0)
		  {
		     R = V * 255;
		     G = V * 255;
		     B = V * 255;
		  }
		  else
		  {
		     var_h = H * 6;
		     if ( var_h >= 6 )
		       var_h = 0;         // H must be < 1
		     var_i = Math.floor(var_h);   
		     var_1 = V * ( 1 - S );
		     var_2 = V * ( 1 - S * ( var_h - var_i ) );
		     var_3 = V * ( 1 - S * ( 1 - ( var_h - var_i ) ) );
		
		     if      ( var_i == 0 ) { var_r = V     ; var_g = var_3 ; var_b = var_1; }
		     else if ( var_i == 1 ) { var_r = var_2 ; var_g = V     ; var_b = var_1; }
		     else if ( var_i == 2 ) { var_r = var_1 ; var_g = V     ; var_b = var_3; }
		     else if ( var_i == 3 ) { var_r = var_1 ; var_g = var_2 ; var_b = V    ; }
		     else if ( var_i == 4 ) { var_r = var_3 ; var_g = var_1 ; var_b = V    ; }
		     else                   { var_r = V     ; var_g = var_1 ; var_b = var_2; }
		 
		     R = var_r * 255;
		     G = var_g * 255;
		     B = var_b * 255;
		  }
		  return (R << 16) + (G << 8) + B;
		}
		
		public static function getHSVfromRGB(color:int):Object 
		{
			var H:Number, S:Number, V:Number;
			var var_R:Number, var_G:Number, var_B:Number;
			var var_Min:Number, var_Max:Number, del_Max:Number;
			var del_R:Number, del_G:Number, del_B:Number;
			
			var R:int = (color & 0xFF0000) / 0xFFFF;
			var G:int = (color & 0x00FF00) / 0xFF;
			var B:int = (color & 0x0000FF);
			
			var_R = ( R / 255 );                     //RGB values = 0 ÷ 255
			var_G = ( G / 255 );
			var_B = ( B / 255 );
			
			var_Min = Math.min( var_R, var_G, var_B);    //Min. value of RGB
			var_Max = Math.max( var_R, var_G, var_B);    //Max. value of RGB
			del_Max = var_Max - var_Min;             //Delta RGB value
			
			V = var_Max;
			
			if ( del_Max == 0 )                     //This is a gray, no chroma...
			{
			   H = 0;                                //HSV results = 0 ÷ 1
			   S = 0;
			}
			else                                    //Chromatic data...
			{
			   S = del_Max / var_Max;
			
			   del_R = ( ( ( var_Max - var_R ) / 6 ) + ( del_Max / 2 ) ) / del_Max;
			   del_G = ( ( ( var_Max - var_G ) / 6 ) + ( del_Max / 2 ) ) / del_Max;
			   del_B = ( ( ( var_Max - var_B ) / 6 ) + ( del_Max / 2 ) ) / del_Max;
			
			   if      ( var_R == var_Max ) H = del_B - del_G;
			   else if ( var_G == var_Max ) H = ( 1 / 3 ) + del_R - del_B;
			   else if ( var_B == var_Max ) H = ( 2 / 3 ) + del_G - del_R;
			
			   if ( H < 0 ) ; H += 1;
			   if ( H > 1 ) ; H -= 1;
			}
			
			var ret:Object = new Object;
			ret.hue = Math.min(Math.max(H,0),1);
			ret.sat = Math.min(Math.max(S,0),1);
			ret.bri = Math.min(Math.max(V,0),1);
			return ret;
		}
	}
}