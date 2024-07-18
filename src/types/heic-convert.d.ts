declare module 'heic-convert' {
	function convert(options: {
		buffer: ArrayBuffer;
		format: 'JPEG' | 'PNG';
		quality: number;
	}): Promise<Buffer>;

	export default convert;
}
