import IFlumpLibrary = require('../../interface/IFlumpLibrary');
import FlumpTexture = require('./FlumpTexture');
import FlumpLibrary = require('../FlumpLibrary');
import IHashMap = require('../../interface/IHashMap');
import Promise = require('../../../createts/util/Promise');

class FlumpTextureGroupAtlas
{
	public static load(flumpLibrary:FlumpLibrary, json:IFlumpLibrary.IAtlas):Promise<FlumpTextureGroupAtlas>
	{
		var file = json.file;
		var url = flumpLibrary.url + '/' + file;

		return new Promise(function(resolve, reject){
			var img = <HTMLImageElement> document.createElement('img');
			img.onload = () => {
				resolve(img);
			};

			img.onerror = () => {
				reject();
			};

			img.src = url;
		}).then((data:HTMLImageElement) => {
			return new FlumpTextureGroupAtlas(data, json);
		});
	}

	public renderTexture:HTMLImageElement;
	public flumpTextures:IHashMap<FlumpTexture> = {};

	constructor( renderTexture:HTMLImageElement, json:IFlumpLibrary.IAtlas)
	{
		this.renderTexture = renderTexture;

		var textures = json.textures;
		for(var i = 0; i < textures.length; i++)
		{
			var texture = textures[i];
			this.flumpTextures[texture.symbol] = new FlumpTexture(renderTexture, texture);
		}
	}
}

export = FlumpTextureGroupAtlas;