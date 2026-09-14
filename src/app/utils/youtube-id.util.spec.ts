import { extractYoutubeId } from './youtube-id.util';

describe('extractYoutubeId', () => {
  it('should return a bare id as-is', () => {
    expect(extractYoutubeId('occm4Ozzrbs')).toBe('occm4Ozzrbs');
  });

  it('should extract the id from a watch?v= url', () => {
    expect(extractYoutubeId('https://www.youtube.com/watch?v=occm4Ozzrbs')).toBe('occm4Ozzrbs');
  });

  it('should extract the id from a watch?v= url with extra query params', () => {
    expect(extractYoutubeId('https://www.youtube.com/watch?list=abc&v=occm4Ozzrbs&t=10s')).toBe(
      'occm4Ozzrbs'
    );
  });

  it('should extract the id from a youtu.be short link', () => {
    expect(extractYoutubeId('https://youtu.be/occm4Ozzrbs')).toBe('occm4Ozzrbs');
  });

  it('should extract the id from a Shorts url (the reported case)', () => {
    expect(extractYoutubeId('https://youtube.com/shorts/w5by5_A5bdY?si=SDlBKgwx2EzS2-hu')).toBe(
      'w5by5_A5bdY'
    );
  });

  it('should extract the id from a Shorts url with www.', () => {
    expect(extractYoutubeId('https://www.youtube.com/shorts/w5by5_A5bdY')).toBe('w5by5_A5bdY');
  });

  it('should extract the id from an embed url', () => {
    expect(extractYoutubeId('https://www.youtube.com/embed/occm4Ozzrbs')).toBe('occm4Ozzrbs');
  });

  it('should trim surrounding whitespace', () => {
    expect(extractYoutubeId('  occm4Ozzrbs  ')).toBe('occm4Ozzrbs');
  });

  it('should fall back to the trimmed input for unrecognized text', () => {
    expect(extractYoutubeId('no-es-una-url-de-youtube')).toBe('no-es-una-url-de-youtube');
  });

  it('should return an empty string for empty input', () => {
    expect(extractYoutubeId('')).toBe('');
  });
});
