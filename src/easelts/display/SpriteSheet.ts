/*
 * SpriteSheet
 *
 * Copyright (c) 2010 gskinner.com, inc.
 * Copyright (c) 2015 Mient-jan Stelling.
 * Copyright (c) 2015 MediaMonks B.V.
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 */

/**
 * Encapsulates the properties and methods associated with a sprite sheet. A sprite sheet is a series of images (usually
 * animation frames) combined into a larger image (or images). For example, an animation consisting of eight 100x100
 * images could be combined into a single 400x200 sprite sheet (4 frames across by 2 high).
 *
 * The data passed to the SpriteSheet constructor defines three critical pieces of information:<ol>
 *    <li> The image or images to use.</li>
 *    <li> The positions of individual image frames. This data can be represented in one of two ways:
 *    As a regular grid of sequential, equal-sized frames, or as individually defined, variable sized frames arranged in
 *    an irregular (non-sequential) fashion.</li>
 *    <li> Likewise, animations can be represented in two ways: As a series of sequential frames, defined by a start and
 *    end frame [0,3], or as a list of frames [0,1,2,3].</li>
 * </OL>
 *
 * <h4>SpriteSheet Format</h4>
 *
 *      data = {
 *          // DEFINING FRAMERATE:
 *          // this specifies the framerate that will be set on the SpriteSheet. See {{#crossLink "SpriteSheet/framerate:property"}}{{/crossLink}}
 *          // for more information.
 *          framerate: 20,
 *
 *          // DEFINING IMAGES:
 *          // list of images or image URIs to use. SpriteSheet can handle preloading.
 *          // the order dictates their index value for frame definition.
 *          images: [image1, "path/to/image2.png"],
 *
 *          // DEFINING FRAMES:
 * 	        // the simple way to define frames, only requires frame size because frames are consecutive:
 * 	        // define frame width/height, and optionally the frame count and registration point x/y.
 * 	        // if count is omitted, it will be calculated automatically based on image dimensions.
 * 	        frames: {width:64, height:64, count:20, regX: 32, regY:64},
 *
 * 	        // OR, the complex way that defines individual rects for frames.
 * 	        // The 5th value is the image index per the list defined in "images" (defaults to 0).
 * 	        frames: [
 * 	        	// x, y, width, height, imageIndex, regX, regY
 * 	        	[0,0,64,64,0,32,64],
 * 	        	[64,0,96,64,0]
 * 	        ],
 *
 *          // DEFINING ANIMATIONS:
 *
 * 	        // simple animation definitions. Define a consecutive range of frames (begin to end inclusive).
 * 	        // optionally define a "next" animation to sequence to (or false to stop) and a playback "speed".
 * 	        animations: {
 * 	        	// start, end, next, speed
 * 	        	run: [0,8],
 * 	        	jump: [9,12,"run",2]
 * 	        }
 *
 *          // the complex approach which specifies every frame in the animation by index.
 *          animations: {
 *          	run: {
 *          		frames: [1,2,3,3,2,1]
 *          	},
 *          	jump: {
 *          		frames: [1,4,5,6,1],
 *          		next: "run",
 *          		speed: 2
 *          	},
 *          	stand: { frames: [7] }
 *          }
 *
 * 	        // the above two approaches can be combined, you can also use a single frame definition:
 * 	        animations: {
 * 	        	run: [0,8,true,2],
 * 	        	jump: {
 * 	        		frames: [8,9,10,9,8],
 * 	        		next: "run",
 * 	        		speed: 2
 * 	        	},
 * 	        	stand: 7
 * 	        }
 *      }
 *
 * <strong>Note that the <code>speed</code> property was added in EaselJS 0.7.0. Earlier versions had a <code>frequency</code>
 * property instead, which was the inverse of speed. For example, a value of "4" would be 1/4 normal speed in earlier
 * versions, but us 4x normal speed in 0.7.0+.</strong>
 *
 * <h4>Example</h4>
 * To define a simple sprite sheet, with a single image "sprites.jpg" arranged in a regular 50x50 grid with two
 * animations, "run" looping from frame 0-4 inclusive, and "jump" playing from frame 5-8 and sequencing back to run:
 *
 *      var data = {
 *          images: ["sprites.jpg"],
 *          frames: {width:50, height:50},
 *          animations: {run:[0,4], jump:[5,8,"run"]}
 *      };
 *      var spriteSheet = new createjs.SpriteSheet(data);
 *      var animation = new createjs.Sprite(spriteSheet, "run");
 *
 *
 * <strong>Warning:</strong> Images loaded cross-origin will throw cross-origin security errors when interacted with
 * using a mouse, using methods such as `getObjectUnderPoint`, using filters, or caching. You can get around this by
 * setting `crossOrigin` flags on your images before passing them to EaselJS, eg: `img.crossOrigin="Anonymous";`
 *
 * @class SpriteSheet
 * @constructor
 * @param {Object} data An object describing the SpriteSheet data.
 * @extends EventDispatcher
 **/

import EventDispatcher from "../../createts/event/EventDispatcher";
import Promise from "../../createts/util/Promise";
import HttpRequest from "../../createts/util/HttpRequest";
import Rectangle from "../geom/Rectangle";
import ILoadable from "../interface/ILoadable";

class SpriteSheet extends EventDispatcher implements ILoadable<SpriteSheet>
{
	public static createSequenceDataFromString(images:string[], width:number, height:number):any
	{
		var sequenceStructure = {

			"images": images.map(src => src),
			"frames": images.map((src, index) => [0, 0, width, height, index, 0, 0]),
			"animations": {
				"animation": [0, images.length - 1]
			}

		};

		return sequenceStructure;
	}

	public static createFromString(images:string[], width:number, height:number):SpriteSheet
	{
		return new SpriteSheet(SpriteSheet.createSequenceDataFromString(images, width, height));
	}

	public static load(url:string, spriteSheet:SpriteSheet = new SpriteSheet(''), onProgress?:(process:number) => any ):Promise<SpriteSheet>
	{
		var baseDir = url;

		if(url.indexOf('.json') > -1)
		{
			baseDir = url.substr(0, url.lastIndexOf('/'));

		} else {

			if(baseDir.substr(-1) == '/')
			{
				baseDir = baseDir.substr(0, baseDir.length - 1);
			}

			url += ( url.substr(url.length-1) != '/' ? '/' : '' ) +  'library.json';
		}

		return HttpRequest
			.getJSON(url)
			.then((json:any) =>
			{
				spriteSheet.url = url;

				for(var i = 0; i < json.images.length; i++)
				{
					var image = json.images[i];
					if(!(/\\/.test(image)))
					{
						json.images[i] = baseDir + '/' + image;
					}
				}

				spriteSheet.initialize(json);

				if(onProgress) onProgress(1);

				return spriteSheet;
			});
	}

	/**
	 * Dispatched when all images are loaded.  Note that this only fires if the images
	 * were not fully loaded when the sprite sheet was initialized. You should check the complete property
	 * to prior to adding a listener. Ex.
	 * <pre><code>var sheet = new SpriteSheet(data);
	 * if (!sheet.complete) {
	 *  &nbsp; // not preloaded, listen for the complete event:
	 *  &nbsp; sheet.addEventListener("complete", handler);
	 * }</code></pre>
	 * @event complete
	 * @param {Object} target The object that dispatched the event.
	 * @param {String} type The event type.
	 * @since 0.6.0
	 */

	// public properties:
	/**
	 * Indicates whether all images are finished loading.
	 * @property complete
	 * @type Boolean
	 * @readonly
	 **/
	public complete = true;

	/**
	 * Specifies the framerate to use by default for Sprite instances using the SpriteSheet. See
	 * Sprite.framerate for more information.
	 * @property framerate
	 * @type Number
	 **/
	public framerate = 0;


	// private properties:
	/**
	 * @property _animations
	 * @protected
	 * @type Array
	 **/
	public _animations = null;

	/**
	 * @property _frames
	 * @protected
	 * @type Array
	 **/
	public _frames = null;

	/**
	 * @property _images
	 * @protected
	 * @type Array
	 **/
	public _images = null;

	/**
	 * @property _data
	 * @protected
	 * @type Object
	 **/
	public _data = null;

	/**
	 * @property _loadCount
	 * @protected
	 * @type Number
	 **/
	public loadCount = 0;

	// only used for simple frame defs:
	/**
	 * @property _frameHeight
	 * @protected
	 **/
	public _frameHeight = 0;

	/**
	 * @property _frameWidth
	 * @protected
	 **/
	public _frameWidth = 0;

	/**
	 * @property _numFrames
	 * @protected
	 **/
	public _numFrames = 0;

	/**
	 * @property _regX
	 * @protected
	 **/
	public _regX = 0;

	/**
	 * @property _regY
	 * @protected
	 **/
	public _regY = 0;


	public _hasLoaded:boolean = false;
	public url:string = null;

	/**
	 * @method constructor
	 * @param {Object} data An object describing the SpriteSheet data.
	 * @protected
	 **/
	constructor(dataOrUrl?:string|any)
	{
		super();

		if(typeof dataOrUrl == 'string')
		{
			this.url = <string> dataOrUrl;
		}
		else
		{
			this.initialize(<any> dataOrUrl);
		}
	}

	public initialize(data?:any)
	{
		var i, l, o, a;
		if(data == null)
		{
			return;
		}

		this.framerate = data.framerate || 0;

		// parse images:
		if(data.images && (l = data.images.length) > 0)
		{
			a = this._images = [];
			for(i = 0; i < l; i++)
			{
				var img = data.images[i];
				if(typeof img == "string")
				{
					var src = img;
					img = document.createElement("img");
					img.src = src;
				}
				a.push(img);
				if(!img.getContext && !img.complete)
				{
					this.loadCount++;
					this.complete = false;
					(function(o)
					{
						img.onload = function()
						{
							o._handleImageLoad();
						}
					})(this);
				}
			}
		}

		// parse frames:
		if(data.frames == null)
		{ // nothing
		}
		else if(data.frames instanceof Array)
		{
			this._frames = [];
			a = data.frames;
			for(i = 0, l = a.length; i < l; i++)
			{
				var arr = a[i];
				this._frames.push({image: this._images[arr[4] ? arr[4] : 0], rect: new Rectangle(arr[0], arr[1], arr[2], arr[3]), regX: arr[5] || 0, regY: arr[6] || 0 });
			}
		}
		else
		{
			o = data.frames;
			this._frameWidth = o.width;
			this._frameHeight = o.height;
			this._regX = o.regX || 0;
			this._regY = o.regY || 0;
			this._numFrames = o.count;
			if(this.loadCount == 0)
			{
				this._calculateFrames();
			}
		}

		// parse animations:
		this._animations = [];
		if((o = data.animations) != null)
		{
			this._data = {};
			var name;
			for(name in o)
			{
				var anim:any = {name: name};
				var obj = o[name];
				if(typeof obj == "number")
				{ // single frame
					a = anim.frames = [obj];
				}
				else if(obj instanceof Array)
				{ // simple
					if(obj.length == 1)
					{
						anim.frames = [obj[0]];
					}
					else
					{
						anim.speed = obj[3];
						anim.next = obj[2];
						a = anim.frames = [];
						for(i = obj[0]; i <= obj[1]; i++)
						{
							a.push(i);
						}
					}
				}
				else
				{ // complex
					anim.speed = obj.speed;
					anim.next = obj.next;
					var frames = obj.frames;
					a = anim.frames = (typeof frames == "number") ? [frames] : frames.slice(0);
				}
				if(anim.next === true || anim.next === undefined)
				{
					anim.next = name;
				} // loop
				if(anim.next === false || (a.length < 2 && anim.next == name))
				{
					anim.next = null;
				} // stop
				if(!anim.speed)
				{
					anim.speed = 1;
				}
				this._animations.push(name);
				this._data[name] = anim;
			}
		}

	}

	public hasLoaded():boolean
	{
		return this._hasLoaded;
	}

	public load( onProgress?:(progress:number) => any):Promise<SpriteSheet>
	{
		if(this.hasLoaded())
		{
			if(onProgress) onProgress(1);

			return new Promise<SpriteSheet>((resolve:Function, reject:Function) => {
				resolve(this);
			});
		}

		if(this._animations.length > 0)
		{
			return new Promise<SpriteSheet>((resolve:Function, reject:Function) => {

				var total = this.loadCount;
				var kill = setInterval(() => {

					if(onProgress){
						onProgress((total - this.loadCount) / total);
					}

					if(this.loadCount == 0)
					{
						this._hasLoaded = true;
						resolve(this);
						clearInterval(kill);
					}
				});

			});
		}

		if(!this.url)
		{
			throw new Error('url is not set and there for can not be loaded');
		}

		return SpriteSheet.load(this.url, this, onProgress ).catch(() => {
			throw new Error('could not load library');
		});
	}

	// public methods:
	/**
	 * Returns the total number of frames in the specified animation, or in the whole sprite
	 * sheet if the animation param is omitted.
	 * @method getNumFrames
	 * @param {String} animation The name of the animation to get a frame count for.
	 * @return {Number} The number of frames in the animation, or in the entire sprite sheet if the animation param is omitted.
	 */
	public getNumFrames(animation?:string):number
	{
		var result:number = 0;
		if(animation == null)
		{
			result =  this._frames ? this._frames.length : this._numFrames;
		}
		else
		{
			var data = this._data[animation];
			if(data == null)
			{
				result = 0;
			}
			else
			{
				result = data.frames.length;
			}
		}

		return result;
	}

	/**
	 * Returns an array of all available animation names as strings.
	 * @method getAnimations
	 * @return {Array} an array of animation names available on this sprite sheet.
	 **/
	public getAnimations()
	{
		return this._animations.slice(0);
	}

	/**
	 * Returns an object defining the specified animation. The returned object contains:<UL>
	 *     <LI>frames: an array of the frame ids in the animation</LI>
	 *     <LI>speed: the playback speed for this animation</LI>
	 *     <LI>name: the name of the animation</LI>
	 *     <LI>next: the default animation to play next. If the animation loops, the name and next property will be the
	 *     same.</LI>
	 * </UL>
	 * @method getAnimation
	 * @param {String} name The name of the animation to get.
	 * @return {Object} a generic object with frames, speed, name, and next properties.
	 **/
	public getAnimation(name:string):any
	{
		return this._data[name];
	}

	/**
	 * Returns an object specifying the image and source rect of the specified frame. The returned object has:<UL>
	 *     <LI>an image property holding a reference to the image object in which the frame is found</LI>
	 *     <LI>a rect property containing a Rectangle instance which defines the boundaries for the frame within that
	 *     image.</LI>
	 *     <LI> A regX and regY property corresponding to the regX/Y values for the frame.
	 * </UL>
	 * @method getFrame
	 * @param {Number} frameIndex The index of the frame.
	 * @return {Object} a generic object with image and rect properties. Returns null if the frame does not exist.
	 **/
	public getFrame(frameIndex)
	{
		var frame;
		if(this._frames && (frame = this._frames[frameIndex]))
		{
			return frame;
		}

		return null;
	}

	/**
	 * Returns a {{#crossLink "Rectangle"}}{{/crossLink}} instance defining the bounds of the specified frame relative
	 * to the origin. For example, a 90 x 70 frame with a regX of 50 and a regY of 40 would return:
	 *
	 *      [x=-50, y=-40, width=90, height=70]
	 *
	 * @method getFrameBounds
	 * @param {Number} frameIndex The index of the frame.
	 * @param {Rectangle} [rectangle] A Rectangle instance to copy the values into. By default a new instance is created.
	 * @return {Rectangle} A Rectangle instance. Returns null if the frame does not exist, or the image is not fully loaded.
	 **/
	public getFrameBounds(frameIndex, rectangle?)
	{
		var frame:any = this.getFrame(frameIndex);

		return frame ? (rectangle || new Rectangle(-frame.regX, -frame.regY, frame.rect.width, frame.rect.height)) : null;
	}

	/**
	 * Returns a string representation of this object.
	 * @method toString
	 * @return {String} a string representation of the instance.
	 **/
	public toString()
	{
		return "[SpriteSheet]";
	}

	/**
	 * Returns a clone of the SpriteSheet instance.
	 * @method clone
	 * @return {SpriteSheet} a clone of the SpriteSheet instance.
	 **/
	public clone()
	{
		// TODO: there isn't really any reason to clone SpriteSheet instances, because they can be reused.
		var o = new SpriteSheet();
		o.complete = this.complete;
		o._animations = this._animations;
		o._frames = this._frames;
		o._images = this._images;
		o._data = this._data;
		o._frameHeight = this._frameHeight;
		o._frameWidth = this._frameWidth;
		o._numFrames = this._numFrames;
		o.loadCount = this.loadCount;
		return o;
	}

	// private methods:
	/**
	 * @method _handleImageLoad
	 * @protected
	 **/
	public _handleImageLoad()
	{
		if(--this.loadCount == 0)
		{
			this._calculateFrames();
			this.complete = true;
			this.dispatchEvent("complete");
		}
	}

	/**
	 * @method _calculateFrames
	 * @protected
	 **/
	public _calculateFrames(){
		if (this._frames || this._frameWidth == 0) { return; }

		this._frames = [];

		var maxFrames = this._numFrames || 100000; // if we go over this, something is wrong.
		var frameCount = 0, frameWidth = this._frameWidth, frameHeight = this._frameHeight;
		var spacing = 0;//this._spacing
		var margin = 0; //this._margin;

		imgLoop:
			for (var i=0, imgs=this._images; i<imgs.length; i++) {
				var img = imgs[i], imgW = img.width, imgH = img.height;

				var y = margin;
				while (y <= imgH-margin-frameHeight) {
					var x = margin;
					while (x <= imgW-margin-frameWidth) {
						if (frameCount >= maxFrames) { break imgLoop; }
						frameCount++;
						this._frames.push({
							image: img,
							rect: new Rectangle(x, y, frameWidth, frameHeight),
							regX: this._regX,
							regY: this._regY
						});
						x += frameWidth+spacing;
					}
					y += frameHeight+spacing;
				}
			}
		this._numFrames = frameCount;
	}
}

export default SpriteSheet;
