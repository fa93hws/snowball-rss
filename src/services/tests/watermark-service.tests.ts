import Jimp from 'jimp';
import { addTextWaterMark } from '../watermark-service';

describe('addWaterMark', () => {
  const fakePrint = jest.fn();
  const fakeImage = {
    getWidth: () => 100,
    getHeight: () => 100,
    print: fakePrint,
    getBufferAsync: () => '123',
  };

  const fakeRead = jest.spyOn(Jimp, 'read').mockResolvedValue(fakeImage as any);
  const fakeLoadFont = jest.spyOn(Jimp, 'loadFont').mockResolvedValue('font' as any);

  it('use absolute position', async () => {
    const buffer = Buffer.from('fake-image');
    await addTextWaterMark({
      buffer,
      position: { x: 5, y: 5, relative: false },
      text: 'watermark',
      mime: 'image/png',
    });
    await new Promise(setImmediate);
    expect(fakePrint).toHaveBeenCalledWith('font', 5, 5, 'watermark');
  });

  it('use relative position', async () => {
    const buffer = Buffer.from('fake-image');
    await addTextWaterMark({
      buffer,
      position: { x: 0.5, y: 0.5, relative: true },
      text: 'watermark',
      mime: 'image/png',
    });
    await new Promise(setImmediate);
    expect(fakePrint).toHaveBeenCalledWith('font', 50, 50, 'watermark');
  });

  afterEach(() => {
    fakePrint.mockRestore();
  });

  afterAll(() => {
    fakeRead.mockRestore();
    fakeLoadFont.mockRestore();
  });
});
