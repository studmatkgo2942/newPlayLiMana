import { getValidCoverUrl } from "../../../utils/format.util";

type Props = {
  src?: string | null;
  type: 'playlist' | 'song';
  alt?: string;
  className?: string;
};

export function CoverImage({ src, type, alt = '', className = '' }: Readonly<Props>) {
  const validSrc = getValidCoverUrl(src, type);
  return <img src={validSrc} alt={alt} className={className} />;
}
