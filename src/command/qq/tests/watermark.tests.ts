import Jimp from 'jimp';
import { createWatermarkHandler } from '../watermark';

describe('createWatermarkHandler', () => {
  it('adds watermark with this params', async () => {
    const fakeAddWatermark = jest.fn();
    await createWatermarkHandler(123, fakeAddWatermark)(Buffer.from('fakeBuffer'));
    await new Promise(setImmediate);
    expect(fakeAddWatermark).toHaveBeenCalledWith({
      buffer: Buffer.from('fakeBuffer'),
      position: {
        x: 0.05,
        y: 0.9,
        relative: true,
      },
      text: 'QQ Qun: 123',
      mime: Jimp.MIME_PNG,
    });
  });
});
