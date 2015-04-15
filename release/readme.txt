--------------------------------------------------------------------
- LSystems Pro Readme                                              -
--------------------------------------------------------------------

* Version: 0.3.2 alpha
* Release date: August 25th, 2009
* Author: Alexander Rulkens
* Company: studio:ludens

* A tool to create beautiful artwork based on the philosophy of
  Lindenmayer systems.

  Contents
-------------------------

  1. General Description
  2. Rules
  3. Interface
  4. Exporting
  5. Disclaimer
  
  A. Bibliography
  
-------------------------

This readme is a work in progress. If you want to extend it 
you are more than welcome to!


--------------------------------------------------------------------
- 1. General Description                                           -
--------------------------------------------------------------------

The purpose of this program is to help you play with, understand and
design with Lindenmayer systems. 

Lindenmayer systems (or L-systems for short) are a kind of 'formal
language' that can be used to create drawings. 

It is based on an iterative process combined with a very simple
language for describing a drawing. Letters in the language mean
things like:
- Move forward one step, while drawing a line ( F )
- Move forward one step, but don't draw a line ( f )
- Turn left by a fixed angle, but don't walk ( - )
- Turn right by a fixed angle, but don't walk ( + )
- and so on..

By combining these actions (represented by letters and other symbols)
you can draw any shape you want. (F+F+F+F draws a square if we use 
90 degree angles). 

And here is where it gets really
interesting, because you can transform these simple shapes into complex
ones, using rules. Every rule represents a substitution. For example:

F:F+F-F

This means that every time we do an iteration, we substitute F+F-F for
F. Say we take a single F as our first command. Let's see this in action:

Iteration 1: 
  Command: F

(apply rule)

Iteration 2:
  Command: F+F-F
  
(apply rule once more)

Iteration 3:
  Command: F+F-F+F+F-F-F+F-F
  
Iteration 4:
  Command: F+F-F+F+F-F-F+F-F+F+F-F+F+F-F-F+F-F-F+F-F+F+F-F-F+F-F

You can see, the drawing command becomes big quite fact. Every time
we do an iteration, the number of lines we have to draw triples! So,
watch out when ramping up those iterations, because you can make 
things quite hard for your computer very fast. That's why you can see
the calculation time in the application, so use it smartly!

Besides the basic L-system commands, this application has a number
of special extension that are specifically designed for the (graphic)
designer. These include color manipulation, line manipulation, 
drawing polygons, arcs, and custom measurements. 

All in all, enough to keep you playing for a while!

--------------------------------------------------------------------
- 2. Creating Rules                                                -
--------------------------------------------------------------------

Lindenmayer formulated a small set of symbols that have special
meaning in the language. 


Basic Commands 
-----------------------------F,G	 go forward & draw a linef,g	 go forward+	 turn left-	 turn right[	 save position]	 restore position$	 reset angle!	 scale down@	 scale up


Extensions
-----------------------------

These are extensions to the basic language symbols


Style
----------------------<	 brightness down>	 brightness upc	 hue downC	 hue ups	 saturation downS	 saturation up\	 line thickness down/	 line thickness upPolygons
----------------------{	 Start polygon}	 end polygon.	 add polygon pointArcs (experimental)
----------------------~	 draw arc right`	 draw arc left


And, don't forget: you can use any other symbol on your keybord too
to form rules. These can be very handy as placeholders for larger
structures.


--------------------------------------------------------------------
- 3. Interface                                                     -
--------------------------------------------------------------------

We have tried to keep the interface as clean as possible, so you can
focus on creating beautiful artwork. Some things to note are:

- Help Menu: this provides a cheat sheet for all the commands.
- Rules Menu: this lets you define the working of the system
    the axiom is the command you start with
    the rule commands can be entered in the larger field (will 
    scale to allow you to add aditional rules)
- 

--------------------------------------------------------------------
- 4. Exporting                                                     -
--------------------------------------------------------------------

The tool provides the option of exporting to SVG. This functionality
is still in a very early stage, and only straight lines will work.

However, we know that exporting is a very important feature, so we
will continually keep extending SVG support.


SVG is an open standard to describe vector images and is supported 
by a wide range of graphic design applications. You can open
SVG files with, amongst others: 
- Adobe Illustrator CS and higher (commercial)
- Corel Draw (commercial)
- Inkscape (free, open-source)
- WinFIG
- and many more..


Please note that all graphics will be scaled to fit into a square
of 200mm x 200mm.

--------------------------------------------------------------------
- 5. Ideas for improvement                                         -
--------------------------------------------------------------------

A number of ideas for improvement (please add your own!)

Fixes and essential features
----------------------------

- Zooming and panning interface functionality
- clearer interface (new style)
- exporting Polygons to SVG
- Updated help with tutorials
- YouTube tutorial video's
- Application logo and Icon
- directly open SVG with l-system metadata



New functionality ideas
----------------------------
- Animation options.
- full-screen option for presenting
- exporting to AVI or animated SVG (is this supported anywhere anyway?)

- using images next to lines and polygons for rendering. (PNG, JPG, SVG)
- make it 3D

- use a graphical method for creating rules



--------------------------------------------------------------------
- 5. Disclaimer                                                    -
--------------------------------------------------------------------

Please understand that this is alpha software, and not ready for
distribution yet. Therefore, I cannot be held responsible for any
kind of damage to your computer (any hang or lost data, potential 
frustration about this fact and any kind of physical violence as a
result...)

So, until better tested, TRY AT YOUR OWN RISK!

--------------------------------------------------------------------
- A. Bibliography                                                  -
--------------------------------------------------------------------

* Prusinkiewicz, Przemyslaw; Lindenmayer, Aristid (1990). 
  The Algorithmic Beauty of Plants. Springer-Verlag. pp. 101–107. 
  ISBN 978-0387972978. 

  download: http://algorithmicbotany.org/papers/#webdocs.

--------------------------------------------------------------------
- B. Update History                                                -
--------------------------------------------------------------------

* version 0.3.0 alpha - August 23, 2009
  - new SVG export operational, line color doesn't work yet
  - moved SVG functions to a new class
  
* version 0.2.2 alpha - August 20, 2009
  - More interface tweaks
  - new implementation of the SVG rendering engine
  
* version 0.2.1 alpha - August 18, 2009
  - Tweaked the interface, removed a wrong command description
  - Removed a couple of small bugs
  - started with example library of l-systems, included in download

* version 0.2.0 alpha - August 17, 2009
  - Revamped the interface (new light theme)
  - Added extended help menu with cheat sheet
  - Fixed some bugs in arc drawing
  
* version 0.1.1 alpha - August 13, 2009
  - Added support for saving and loading
  - fixed scaling bug in SVG export

* version 0.1.0 alpha - December 2009
  - first version
  - experimental support for SVG


