interface IPlayable
{
	paused:boolean;
	play(times?:number):any;
	stop():IPlayable;
}

export = IPlayable;