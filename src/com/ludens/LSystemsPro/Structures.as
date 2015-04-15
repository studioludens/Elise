/**
* ...
* @author Default
* @version 0.1
*/

package  com.ludens.LSystemsPro {

	public class Structures {
		public static var Sets:Array =[
		{title:"Koch Curve", length: 20, angle:90, startAngle:90, iterations:4, axiom:"F", rules:"F:F+F-F-F+F", thickness:3, ratio:0.9},
		{title:"Dragon Curve", length: 30, angle:90, startAngle:90, iterations:10, axiom:"FX", rules:"X:X+YF+\nY:-FX-Y", thickness:3, ratio:0.9},
		{title:"Fractal Plant", length:18, angle:25, startAngle:180, iterations:4, axiom:"X", rules:"X:F-[[X]+X]+F[+FX]-X\nF:FF", thickness:3, ratio:0.9},
		{title:"Sierpinski Triangle", length:22, angle:60, startAngle:90, iterations:6, axiom:"F", rules:"F:G-F-G\nG:F+G+F", thickness:3, ratio:0.9},
		{title:"Hilbert Curve", length:14, angle:90, startAngle:90, iterations:4, axiom:"L", rules:"L:+RF-LFL-FR+\nR:-LF+RFR+FL-", thickness:3, ratio:0.9},
		{title:"Test 1", length:12, angle:90, startAngle:90, iterations:6, axiom:"F", rules:"F:F+X-X-X+F\nX:F++F++F", thickness:3, ratio:0.9},
		{title:"Xero", length:12, angle:90, startAngle:90, iterations:8, axiom:"F", rules:"F:F+B-X-B+F\nX:G+X+G", thickness:3, ratio:0.9},
		{title:"Sierpinski Carpet", length:10, angle:90, startAngle:90, iterations:3, axiom:"FX-FX-FX-FX-", rules:"X:GX-GX+GY++FX-GX-GX-GX++GX-GX\nY:GYGYGY", thickness:1, ratio:0.94},
		{title:"3D'd Sierpinski Square", length:14, angle:90, startAngle:90, iterations:3, axiom:"FX-FX-FX-FX-", rules:"X:GX-GX+GY++FX-GX-GX-GX++GX-GX\nY:GYGY-&FGY+&F", thickness:1, ratio:0.94},
		{title:"Branch 3D", length:14, angle:25, startAngle:90, iterations:5, axiom:"X", rules:"X:F-[[&X]+<<<X]+F[>>>+!F-X]\nF:FF", thickness:3, ratio:0.94}
		];
	}
}
