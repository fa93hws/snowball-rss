import { addTextWaterMark as _addTextWaterMark } from '@services/watermark-service';
import Jimp from 'jimp';

export function createWatermarkHandler(
  groupId: number,
  addTextWaterMark: typeof _addTextWaterMark = _addTextWaterMark,
) {
  return (buffer: Buffer): Promise<Buffer> =>
    addTextWaterMark({
      buffer,
      position: {
        x: 0.05,
        y: 0.9,
        relative: true,
      },
      text: `QQ Qun: ${groupId}`,
      mime: Jimp.MIME_PNG,
    });
}
