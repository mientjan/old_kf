import DisplayObject = require('../../display/DisplayObject');
import FlumpLibrary = require('../FlumpLibrary');
import FlumpLayerData = require('./FlumpLayerData');
import FlumpKeyframeData = require('./FlumpKeyframeData');
import FlumpTexture = require('./FlumpTexture');
import FlumpMovie = require('./FlumpMovie');
import FlumpLabelData = require('./FlumpLabelData');
import IHashMap = require("../../interface/IHashMap");
import DisplayType = require("../../enum/DisplayType");
import FlumpMtx = require("./FlumpMtx");

class FlumpMovieLayer extends DisplayObject
{
	public name:string = '';
	//private _frame:number = 0;
	public flumpLayerData:FlumpLayerData;

	protected _symbolType:number = DisplayType.UNKNOWN;
	protected _symbolMovie:FlumpMovie;
	protected _symbolTexture:FlumpTexture;
	protected _keyframeRef:any;

	//protected _symbol:FlumpMovie|FlumpTexture;
	protected _symbols:IHashMap<FlumpMovie|FlumpTexture> = {};
	protected _symbolName:any = null;


	public _storedMtx = new FlumpMtx(1, 0, 0, 1, 0, 0);

	constructor(flumpMove:FlumpMovie, flumpLayerData:FlumpLayerData)
	{
		super();

		this.disableMouseInteraction()

		this.flumpLayerData = flumpLayerData;
		this.name = flumpLayerData.name;

		for(var i = 0; i < flumpLayerData.flumpKeyframeDatas.length; i++)
		{
			var keyframe = flumpLayerData.flumpKeyframeDatas[i];

			if(keyframe.label)
			{
				flumpMove.labels[keyframe.label] = new FlumpLabelData(keyframe.label, keyframe.index, keyframe.duration);
			}

			if(( ( <any> keyframe.ref) != -1 && ( <any> keyframe.ref) != null) && ( keyframe.ref in this._symbols ) == false)
			{
				this._symbols[keyframe.ref] = flumpMove.flumpLibrary.createSymbol(keyframe.ref, false);

			}
		}

		this.setFrame(0);
	}

	//Matrix get transformationMatrix => _transformationMatrix;

	public onTick(delta:number):void
	{
		if(this._symbolType == DisplayType.DISPLAYOBJECT )
		{
			this._symbolMovie.onTick(delta);
		}
	}
	public setFrame(frame:number):void
	{
		var keyframe:FlumpKeyframeData = this.flumpLayerData.getKeyframeForFrame(frame | 0);

		if(!(keyframe instanceof FlumpKeyframeData))
		{
			this._symbolType = DisplayType.UNKNOWN;

		} else {

			var nextKeyframe = this.flumpLayerData.getKeyframeAfter(keyframe);
			var x:number = keyframe.x;
			var y:number = keyframe.y;
			var scaleX:number = keyframe.scaleX;
			var scaleY:number = keyframe.scaleY;
			var skewX:number = keyframe.skewX;
			var skewY:number = keyframe.skewY;
			var pivotX:number = keyframe.pivotX;
			var pivotY:number = keyframe.pivotY;
			var alpha:number = keyframe.alpha;

			var sinX = 0.0;
			var cosX = 1.0;
			var sinY = 0.0;
			var cosY = 1.0;

			if(keyframe.index != (frame | 0) && keyframe.tweened)
			{


				if(nextKeyframe instanceof FlumpKeyframeData)
				{
					var interped = (frame - keyframe.index) / keyframe.duration;
					var ease = keyframe.ease;

					if(ease != 0)
					{
						var t = 0.0;
						if(ease < 0)
						{
							var inv = 1 - interped;
							t = 1 - inv * inv;
							ease = 0 - ease;
						}
						else
						{
							t = interped * interped;
						}
						interped = ease * t + (1 - ease) * interped;
					}

					x = x + (nextKeyframe.x - x) * interped;
					y = y + (nextKeyframe.y - y) * interped;
					scaleX = scaleX + (nextKeyframe.scaleX - scaleX) * interped;
					scaleY = scaleY + (nextKeyframe.scaleY - scaleY) * interped;
					skewX = skewX + (nextKeyframe.skewX - skewX) * interped;
					skewY = skewY + (nextKeyframe.skewY - skewY) * interped;
					alpha = alpha + (nextKeyframe.alpha - alpha) * interped;
				}
			}

			if(skewX != 0)
			{
				sinX = Math.sin(skewX);
				cosX = Math.cos(skewX);
			}

			if(skewY != 0)
			{
				sinY = Math.sin(skewY);
				cosY = Math.cos(skewY);
			}

			this._storedMtx.a = scaleX * cosY;
			this._storedMtx.b = scaleX * sinY;
			this._storedMtx.c = -scaleY * sinX;
			this._storedMtx.d = scaleY * cosX;

			this._storedMtx.tx = x - (pivotX * this._storedMtx.a + pivotY * this._storedMtx.c);
			this._storedMtx.ty = y - (pivotX * this._storedMtx.b + pivotY * this._storedMtx.d);


			this.alpha = alpha;
			this.visible = keyframe.visible;

			if(( <any> keyframe.ref ) != -1 && ( <any> keyframe.ref ) != null)
			{
				if(this._keyframeRef != keyframe.ref)
				{
					var symbol = this._symbols[keyframe.ref];
					this._keyframeRef = keyframe.ref;
					this._symbolType = symbol.type;

					if(symbol.type == DisplayType.DISPLAYOBJECT)
					{
						this._symbolMovie = <FlumpMovie> symbol;
						this._symbolMovie.reset();
					}
					else if(symbol.type == DisplayType.TEXTURE)
					{
						this._symbolTexture = <FlumpTexture> symbol;
						this._symbolTexture.reset();
					}

				}

			}
			else
			{
				this._keyframeRef = null;
				this._symbolType = DisplayType.UNKNOWN;
			}
		}

	}

	public reset()
	{
		if(this._symbolType == DisplayType.DISPLAYOBJECT) this._symbolMovie.reset();
	}

	public draw(ctx:CanvasRenderingContext2D, ignoreCache?:boolean):boolean
	{
		if(this._symbolType == DisplayType.DISPLAYOBJECT)
		{
			this._symbolMovie.draw(ctx);
		}
		else if(this._symbolType == DisplayType.TEXTURE)
		{
			this._symbolTexture.draw(ctx);
		}

		return true;
	}
}

export = FlumpMovieLayer;