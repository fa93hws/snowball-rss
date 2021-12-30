import Jimp from 'jimp';

type Coordinate = {
  x: number;
  y: number;
};

type AbsolutePosition = Coordinate & {
  relative: false;
};

type RelativePosition = Coordinate & {
  relative: true;
};

type Position = AbsolutePosition | RelativePosition;

function getAbsolutePosition(
  position: Position,
  size: { width: number; height: number },
): AbsolutePosition {
  if (position.relative === false) {
    return position;
  }
  return {
    x: position.x * size.width,
    y: position.y * size.height,
    relative: false,
  };
}

export async function addTextWaterMark({
  buffer,
  position,
  text,
  mime,
}: {
  buffer: Buffer;
  position: Position;
  text: string;
  mime: string;
}): Promise<Buffer> {
  const image = await Jimp.read(buffer);
  const font = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);
  const width = image.getWidth();
  const height = image.getHeight();
  const waterMarkPosition: Position = getAbsolutePosition(position, { width, height });
  image.print(font, waterMarkPosition.x, waterMarkPosition.y, text);
  return image.getBufferAsync(mime);
}
